import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getPipelineSnapshot } from "@/lib/pipeline-context";
import { applyPipelineActions, parseExtractedActions } from "@/lib/pipeline-write-actions";

export const runtime = "nodejs";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const SYSTEM_PROMPT = `You are an AI sales assistant for Kiran's QuoteTracker. You have access to his live pipeline data. Answer questions about his deals, follow ups, and pipeline performance. Be direct and actionable.

Examples of questions you can answer:
- Which deals are overdue for follow up?
- What is my total pipeline value?
- Which deals should I prioritise today?
- What is my conversion rate?
- Summarise my pipeline
- Which customer has the highest value quote?`;

const ACTION_EXTRACTOR_PROMPT = `You extract database write actions from the latest user message in a sales CRM chat.

Return strict JSON only in this shape:
{
  "actions": [
    { "type": "add_note", "quote": "company-or-id", "note": "note text" },
    { "type": "update_status", "quote": "company-or-id", "status": "Quoted|Closed Won|Closed Lost|Checking With Supplier|Part Number Issue|Not Found" },
    { "type": "update_follow_up", "quote": "company-or-id", "date": "date text from user", "target": "next" }
  ]
}

Rules:
- Only include actions explicitly requested by user.
- If user gives a conversational update like "update the PLC deal — customer responds by May 5th", treat it as add_note.
- If no write action requested, return {"actions":[]}.
- Do not include explanations or markdown.`;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing ANTHROPIC_API_KEY in environment variables." },
        { status: 500 }
      );
    }

    const body = (await req.json()) as { messages?: ChatMessage[] };
    const incoming = Array.isArray(body.messages) ? body.messages : [];
    const messages = incoming
      .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m) => ({
        role: m.role,
        content: m.content.slice(0, 4000),
      }));

    if (messages.length === 0) {
      return NextResponse.json({ error: "At least one message is required." }, { status: 400 });
    }

    const snapshotResult = await getPipelineSnapshot();
    if (!snapshotResult.data) {
      return NextResponse.json(
        { error: snapshotResult.error ?? "Could not fetch pipeline data from Supabase." },
        { status: 500 }
      );
    }
    let snapshot = snapshotResult.data;

    const anthropic = new Anthropic({ apiKey });

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    let actionSummaries: string[] = [];
    if (lastUserMessage) {
      try {
        const extraction = await anthropic.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 400,
          system: ACTION_EXTRACTOR_PROMPT,
          messages: [
            {
              role: "user",
              content: `Latest user message:
${lastUserMessage}

Available quotes:
${JSON.stringify(snapshot.quotes.map((q) => ({ id: q.id, company: q.company, status: q.status })), null, 2)}`,
            },
          ],
        });

        let extractedRaw = "";
        for (const block of extraction.content) {
          if (block.type === "text") {
            extractedRaw += block.text;
          }
        }
        const extracted = parseExtractedActions(extractedRaw);

        if (extracted.actions.length > 0) {
          const applyResult = await applyPipelineActions(snapshot, extracted.actions);
          actionSummaries = applyResult.summaries;
          if (applyResult.anySuccess) {
            const refreshed = await getPipelineSnapshot();
            if (refreshed.data) snapshot = refreshed.data;
          }
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Action extraction failed.";
        actionSummaries = [`Could not process write action request: ${msg}`];
      }
    }

    const stream = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1200,
      stream: true,
      system: `${SYSTEM_PROMPT}

Write actions attempted for the latest user message:
${actionSummaries.length ? actionSummaries.map((s) => `- ${s}`).join("\n") : "- No write actions requested."}

Live pipeline data (JSON):
${JSON.stringify(snapshot, null, 2)}`,
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
