
import "server-only";

export type AIMessage = {
    role: "system" | "user" | "assistant";
    content: string;
};

export type AITextOptions = {
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
};

type Provider = "groq" | "ollama" | "auto";

export class AIProviderError extends Error {
    constructor(
        message: string,
        public retryable = false,
    ) {
        super(message);
        this.name = "AIProviderError";
    }
}

function isRetryableProviderError(error: unknown): error is AIProviderError {
    return error instanceof AIProviderError && error.retryable;
}

function getProvider(): Provider {
    const provider = (process.env.AI_PROVIDER || "auto")
        .trim()
        .toLowerCase();
        console.log("[AI Provider selected]:", provider);

    if (
        provider === "groq" ||
        provider === "ollama" ||
        provider === "auto"
    ) {
        return provider;
    }

    throw new AIProviderError(
        'Invalid AI_PROVIDER. Use "groq", "ollama", or "auto".',
    );
}

function formatOllamaPrompt(messages: AIMessage[]): string {
    return messages
        .map((message) => `${message.role.toUpperCase()}:\n${message.content}`)
        .join("\n\n");
}

async function fetchWithTimeout(
    url: string,
    init: RequestInit,
    timeoutMs: number,
): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, {
            ...init,
            signal: controller.signal,
            cache: "no-store",
        });
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            throw new AIProviderError("AI provider request timed out.", true);
        }

        throw new AIProviderError("AI provider is unreachable.", true);
    } finally {
        clearTimeout(timeout);
    }
}

async function callGroq(
    messages: AIMessage[],
    options: AITextOptions,
): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY?.trim();

    if (!apiKey) {
        throw new AIProviderError("GROQ_API_KEY is not configured.");
    }

    const model =
        process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-20b";

    // gpt-oss models spend part of the token budget on hidden reasoning,
    // so keep reasoning minimal and leave headroom for the actual answer.
    const isReasoningModel = model.includes("gpt-oss");
    const maxTokens = options.maxTokens ?? 1000;

    const response = await fetchWithTimeout(
        "https://api.groq.com/openai/v1/chat/completions",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: options.temperature ?? 0.2,
                // `max_tokens` is deprecated by Groq. Reasoning tokens count
                // against this budget for GPT-OSS, so reserve enough tokens for
                // the model to produce a visible answer after reasoning.
                max_completion_tokens: isReasoningModel
                    ? Math.max(maxTokens, 1024)
                    : maxTokens,
                ...(isReasoningModel && { reasoning_effort: "low" }),
            }),
        },
        options.timeoutMs ?? 30_000,
    );

    if (!response.ok) {
        const retryable =
            response.status === 408 ||
            response.status === 429 ||
            response.status >= 500;

        throw new AIProviderError(
            `Groq request failed with status ${response.status}.`,
            retryable,
        );
    }

    const data: {
        choices?: Array<{
            message?: { content?: string | null };
        }>;
    } = await response.json();

    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
        throw new AIProviderError("Groq returned an empty response.", true);
    }

    return content;
}

async function withRetry(
    operation: () => Promise<string>,
    attempts = 2,
): Promise<string> {
    let lastError: unknown;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;

            if (!isRetryableProviderError(error) || attempt === attempts - 1) {
                throw error;
            }

            // Keep the retry brief so editor completions remain responsive.
            await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
        }
    }

    throw lastError;
}

async function callOllama(
    messages: AIMessage[],
    options: AITextOptions,
): Promise<string> {
    const baseUrl = (
        process.env.OLLAMA_BASE_URL?.trim() ||
        "http://localhost:11434"
    ).replace(/\/+$/, "");

    const response = await fetchWithTimeout(
        `${baseUrl}/api/generate`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model:
                    process.env.OLLAMA_MODEL?.trim() ||
                    "qwen2.5-coder:3b",
                prompt: formatOllamaPrompt(messages),
                stream: false,
                options: {
                    temperature: options.temperature ?? 0.2,
                    num_predict: options.maxTokens ?? 1000,
                    repeat_penalty: 1.1,
                    num_ctx: 4096,
                },
            }),
        },
        options.timeoutMs ?? 120_000,
    );

    if (!response.ok) {
        const retryable =
            response.status === 408 ||
            response.status === 429 ||
            response.status >= 500;

        throw new AIProviderError(
            `Ollama request failed with status ${response.status}.`,
            retryable,
        );
    }

    const data: { response?: string } = await response.json();
    const content = data.response?.trim();

    if (!content) {
        throw new AIProviderError("Ollama returned an empty response.", true);
    }

    return content;
}

/**
 * Call this function only from server-side code, such as Route Handlers.
 */
export async function generateAIText(
    messages: AIMessage[],
    options: AITextOptions = {},
): Promise<string> {
    const provider = getProvider();

    if (provider === "groq") {
        return withRetry(() => callGroq(messages, options));
    }

    if (provider === "ollama") {
        return withRetry(() => callOllama(messages, options));
    }

    // In auto mode, skip Groq if no key is configured.
    if (!process.env.GROQ_API_KEY?.trim()) {
        return withRetry(() => callOllama(messages, options));
    }

    try {
        return await withRetry(() => callGroq(messages, options));
    } catch (error) {
        if (!isRetryableProviderError(error)) {
            throw error;
        }

        console.warn(
            "Groq is temporarily unavailable; trying Ollama fallback.",
        );

        return withRetry(() => callOllama(messages, options));
    }
}

