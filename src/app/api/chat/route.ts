import { google } from "@ai-sdk/google";
import { streamText, createUIMessageStreamResponse } from "ai";
import { findRelevantCards, findRelevantRules } from "@/lib/retrieval";
import { buildSystemPrompt } from "@/lib/system-prompt";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Get the latest user message for context retrieval
  const lastUserMessage =
    messages.findLast((m: { role: string }) => m.role === "user")?.content ?? "";

  const relevantCards = findRelevantCards(lastUserMessage);
  const relevantRules = findRelevantRules(lastUserMessage);
  const systemPrompt = buildSystemPrompt(relevantCards, relevantRules);

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: systemPrompt,
    messages,
  });

  return result.toUIMessageStreamResponse();
}
