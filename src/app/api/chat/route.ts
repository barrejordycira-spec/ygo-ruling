import { google } from "@ai-sdk/google";
import { streamText, type UIMessage } from "ai";
import { findRelevantCards, findRelevantRules } from "@/lib/retrieval";
import { buildSystemPrompt } from "@/lib/system-prompt";

export const maxDuration = 30;

// Convert UI messages (parts format) to model messages (content format)
function toModelMessages(uiMessages: UIMessage[]) {
  return uiMessages.map((msg) => ({
    role: msg.role as "user" | "assistant",
    content:
      msg.parts
        ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("") ?? "",
  }));
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  const modelMessages = toModelMessages(messages);

  // Get the latest user message for context retrieval
  const lastUserMessage =
    modelMessages.findLast((m) => m.role === "user")?.content ?? "";

  const relevantCards = findRelevantCards(lastUserMessage);
  const relevantRules = findRelevantRules(lastUserMessage);
  const systemPrompt = buildSystemPrompt(relevantCards, relevantRules);

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: systemPrompt,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
