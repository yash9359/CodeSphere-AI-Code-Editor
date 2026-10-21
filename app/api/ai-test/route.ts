
import { NextResponse } from "next/server";
import { generateAIText } from "@/lib/ai-provider";

export const runtime = "nodejs";

export async function POST() {
  try {
    const response = await generateAIText(
      [
        {
          role: "user",
          content: "Reply with exactly: Groq connection successful",
        },
      ],
      {
        temperature: 0,
        maxTokens: 50,
        timeoutMs: 30000,
      },
    );

    return NextResponse.json({ success: true, response });
  } catch (error) {
    // Detailed provider errors server logs mein hi rakho.
    console.error("Groq test failed:", error);

    return NextResponse.json(
      { success: false, error: "AI connection failed. Check server logs." },
      { status: 500 },
    );
  }
}
