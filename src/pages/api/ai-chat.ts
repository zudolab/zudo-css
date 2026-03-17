export const prerender = false;

import type { APIRoute } from "astro";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage } from "../../types/ai-chat";

let docsContextCache: string | null = null;

function loadDocsContext(): string {
  if (docsContextCache !== null) return docsContextCache;
  try {
    // In server mode, the client assets are at dist/client/
    const distDir = fileURLToPath(new URL("../../client", import.meta.url));
    const content = readFileSync(join(distDir, "llms-full.txt"), "utf-8");
    docsContextCache = content;
    return content;
  } catch {
    // Fallback: try without client/ prefix (varies by adapter mode)
    try {
      const distDir = fileURLToPath(new URL("../..", import.meta.url));
      const content = readFileSync(join(distDir, "llms-full.txt"), "utf-8");
      docsContextCache = content;
      return content;
    } catch {
      docsContextCache = "";
      return "";
    }
  }
}

const SYSTEM_PROMPT_BASE =
  "You are a helpful documentation assistant for zudo-doc. Answer questions about the documentation concisely and accurately.";

function buildSystemPrompt(): string {
  const docsContext = loadDocsContext();
  if (!docsContext) return SYSTEM_PROMPT_BASE;
  return `${SYSTEM_PROMPT_BASE}\n\nHere is the full documentation content for reference:\n\n${docsContext}`;
}

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function buildPrompt(message: string, history: ChatMessage[]): string {
  if (history.length === 0) {
    return message;
  }
  const contextLines = history.map(
    (h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`,
  );
  contextLines.push(`User: ${message}`);
  return contextLines.join("\n\n");
}

const LOCAL_TIMEOUT_MS = 60_000;

async function handleLocalMode(
  message: string,
  history: ChatMessage[],
): Promise<string> {
  const docsContext = loadDocsContext();
  const contextPrompt = buildPrompt(message, history);

  // Build stdin input: docs context (if any) + user prompt
  // This avoids ARG_MAX limits — only short flags go on the command line
  const stdinParts: string[] = [];
  if (docsContext) {
    stdinParts.push(
      `<documentation>\n${docsContext}\n</documentation>\n\nBased on the documentation above, answer the following:\n`,
    );
  }
  stdinParts.push(contextPrompt);

  return new Promise((resolve, reject) => {
    const proc = spawn(
      "claude",
      [
        "-p",
        "--model",
        "haiku",
        "--max-budget-usd",
        "0.50",
        "--system-prompt",
        SYSTEM_PROMPT_BASE,
      ],
      { stdio: ["pipe", "pipe", "pipe"] },
    );

    proc.stdin.write(stdinParts.join("\n"));
    proc.stdin.end();

    let output = "";
    let error = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        proc.kill();
        reject(new Error("claude CLI timed out after 60 seconds"));
      }
    }, LOCAL_TIMEOUT_MS);

    proc.stdout.on("data", (data: Buffer) => {
      output += data.toString();
    });
    proc.stderr.on("data", (data: Buffer) => {
      error += data.toString();
    });

    proc.on("error", (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(new Error(`Failed to spawn claude: ${err.message}`));
      }
    });

    proc.on("close", (code) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        if (code === 0) resolve(output.trim());
        else reject(new Error(`claude exited with code ${code}: ${error}`));
      }
    });
  });
}

async function handleRemoteMode(
  message: string,
  history: ChatMessage[],
): Promise<string> {
  const client = new Anthropic({
    apiKey: import.meta.env.ANTHROPIC_API_KEY,
  });

  const messages = history.map((h) => ({
    role: h.role as "user" | "assistant",
    content: h.content,
  }));
  messages.push({ role: "user", content: message });

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    system: buildSystemPrompt(),
    messages,
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text ?? "No response generated.";
}

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON in request body" }, 400);
  }

  const { message, history } = body as {
    message: unknown;
    history: unknown;
  };

  if (typeof message !== "string" || !message.trim()) {
    return jsonResponse({ error: "message must be a non-empty string" }, 400);
  }

  if (!Array.isArray(history)) {
    return jsonResponse({ error: "history must be an array" }, 400);
  }

  const validHistory = history.filter(
    (h: unknown): h is ChatMessage =>
      typeof h === "object" &&
      h !== null &&
      "role" in h &&
      "content" in h &&
      (h.role === "user" || h.role === "assistant") &&
      typeof h.content === "string",
  );

  const mode = import.meta.env.AI_CHAT_MODE || "mock";

  try {
    let response: string;

    if (mode === "local") {
      response = await handleLocalMode(message, validHistory);
    } else if (mode === "remote") {
      response = await handleRemoteMode(message, validHistory);
    } else {
      return jsonResponse({
        error:
          'AI chat mode not configured. Set AI_CHAT_MODE to "local" or "remote" in your environment.',
      }, 500);
    }

    return jsonResponse({ response });
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : "AI chat request failed" },
      500,
    );
  }
};
