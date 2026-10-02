import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { anthropic, AI_MODEL, getSkillSystemPrompt } from "@/lib/ai/client";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json() as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  };

  if (!body.messages?.length) {
    return new Response("Missing messages", { status: 400 });
  }

  const systemPrompt = await getSkillSystemPrompt();

  const systemBlocks = systemPrompt
    ? [{ type: "text" as const, text: systemPrompt, cache_control: { type: "ephemeral" as const } }]
    : undefined;

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const enqueue = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const stream = anthropic.messages.stream({
          model: AI_MODEL,
          max_tokens: 8096,
          ...(systemBlocks ? { system: systemBlocks } : {}),
          messages: body.messages,
        });

        stream.on("text", (text) => {
          enqueue({ type: "delta", text });
        });

        await stream.finalMessage();
        enqueue({ type: "done" });
      } catch (err) {
        console.error("[api/chat]", err);
        enqueue({ type: "error", error: "Falha ao gerar a resposta do AI." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
