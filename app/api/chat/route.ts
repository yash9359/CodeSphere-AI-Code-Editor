import { type NextRequest, NextResponse } from "next/server"
import { generateAIText } from "@/lib/ai-provider";

interface ChatMessage {
    role: "user" | "assistant"
    content: string
}

interface EnhancePromptRequest {
    prompt: string
    context?: {
        fileName?: string
        language?: string
        codeContent?: string
    }
}

type ChatRequestBody = {
    action?: unknown
    prompt?: unknown
    context?: EnhancePromptRequest["context"]
    message?: unknown
    history?: unknown
}

function isChatMessage(value: unknown): value is ChatMessage {
    if (!value || typeof value !== "object") return false

    const message = value as { role?: unknown; content?: unknown }
    return (
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string"
    )
}

async function generateAIResponse(messages: ChatMessage[]) {
    const systemPrompt = `You are an expert AI coding assistant. You help developers with:
- Code explanations and debugging
- Best practices and architecture advice
- Writing clean, efficient code
- Troubleshooting errors
- Code reviews and optimizations

Always provide clear, practical answers. When showing code, use proper formatting with language-specific syntax.
Keep responses concise but comprehensive. Use code blocks with language specification when providing code examples.`;

    const fullMessages = [
        { role: "system" as const, content: systemPrompt },
        ...messages,
    ];

    return await generateAIText(fullMessages, {
        temperature: 0.7,
        // Leave room for GPT-OSS reasoning as well as the user-visible reply.
        maxTokens: 1536,
        timeoutMs: 120000,
    });
}

async function enhancePrompt(request: EnhancePromptRequest) {
    const enhancementPrompt = `You are a prompt enhancement assistant. Take the user's basic prompt and enhance it to be more specific, detailed, and effective for a coding AI assistant.

Original prompt: "${request.prompt}"

Context: ${request.context ? JSON.stringify(request.context, null, 2) : "No additional context"}

Enhanced prompt should:
- Be more specific and detailed
- Include relevant technical context
- Ask for specific examples or explanations
- Be clear about expected output format
- Maintain the original intent

Return only the enhanced prompt, nothing else.`

   try {
    const response = await generateAIText(
        [
            {
                role: "user",
                content: enhancementPrompt,
            },
        ],
        {
            temperature: 0.3,
            maxTokens: 500,
            timeoutMs: 30000,
        },
    );

    return response.trim() || request.prompt;
} catch (error) {
    console.error("Prompt enhancement error:", error);
    return request.prompt;
}
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as ChatRequestBody

        // Handle prompt enhancement
        if (body.action === "enhance") {
            if (typeof body.prompt !== "string" || !body.prompt.trim()) {
                return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
            }

            const enhancedPrompt = await enhancePrompt({
                prompt: body.prompt,
                context: body.context,
            })
            return NextResponse.json({ enhancedPrompt })
        }

        // Handle regular chat
        const { message, history } = body

        if (!message || typeof message !== "string") {
            return NextResponse.json({ error: "Message is required and must be a string" }, { status: 400 })
        }

        const validHistory = Array.isArray(history)
            ? history.filter(isChatMessage)
            : []

        const recentHistory = validHistory.slice(-10)
        const messages: ChatMessage[] = [...recentHistory, { role: "user", content: message }]

        const aiResponse = await generateAIResponse(messages)

        if (!aiResponse) {
            throw new Error("Empty response from AI model")
        }

        return NextResponse.json({
            response: aiResponse,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error("Error in AI chat route:", error)
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
        return NextResponse.json(
            {
                error: "Failed to generate AI response",
                details: errorMessage,
                timestamp: new Date().toISOString(),
            },
            { status: 500 },
        )
    }
}

export async function GET() {
    return NextResponse.json({
        status: "AI Chat API is running",
        timestamp: new Date().toISOString(),
        info: "Use POST method to send chat messages or enhance prompts",
    })
}
