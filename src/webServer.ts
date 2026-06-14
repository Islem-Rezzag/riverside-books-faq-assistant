import { readFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import path from "node:path";
import { URL } from "node:url";

import { loadConfig } from "./config.js";
import { loadFaqs } from "./faqs.js";
import { routeQuestionWithLLM } from "./llmRouter.js";
import {
  NO_MATCH_MESSAGE,
  SETUP_MESSAGE,
  TECHNICAL_ISSUE_MESSAGE,
} from "./responsePolicy.js";
import type { FAQ, RouteResult } from "./types.js";

type ApiStatus = "success" | "no_match" | "technical_error";
type ApiSource = "Official FAQ" | "None";

interface AskResponse {
  status: ApiStatus;
  answer: string;
  faqId: number | null;
  faqQuestion: string | null;
  faqAnswer: string | null;
  confidence: number | null;
  reason: string;
  model: string;
  source: ApiSource;
  elapsedMs: number;
}

const DEFAULT_PORT = 5173;
const WEB_ROOT = path.join(process.cwd(), "web");
const MIME_TYPES = new Map<string, string>([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
]);

function resolvePort(): number {
  const rawPort = process.env.PORT?.trim();

  if (!rawPort) {
    return DEFAULT_PORT;
  }

  const parsed = Number(rawPort);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  payload: unknown,
): void {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function sendText(
  response: ServerResponse,
  statusCode: number,
  message: string,
): void {
  response.writeHead(statusCode, {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(message);
}

function stripAssistantPrefix(answer: string): string {
  return answer.startsWith("Riverside Books: ")
    ? answer.slice("Riverside Books: ".length)
    : answer;
}

function withElapsed(response: Omit<AskResponse, "elapsedMs">, startedAt: number): AskResponse {
  return {
    ...response,
    elapsedMs: Date.now() - startedAt,
  };
}

async function readRequestBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

function parseQuestion(body: string): string | null {
  const parsed: unknown = JSON.parse(body);

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("question" in parsed) ||
    typeof parsed.question !== "string"
  ) {
    return null;
  }

  return parsed.question.trim();
}

function mapRouteResult(
  result: RouteResult,
  startedAt: number,
): AskResponse {
  if (result.status === "success") {
    return withElapsed({
      status: "success",
      answer: stripAssistantPrefix(result.faq.answer),
      faqId: result.faq.id,
      faqQuestion: result.faq.question,
      faqAnswer: result.faq.answer,
      confidence: result.confidence,
      reason: result.reason,
      model: result.model,
      source: "Official FAQ",
    }, startedAt);
  }

  if (result.status === "no_match") {
    return withElapsed({
      status: "no_match",
      answer: stripAssistantPrefix(NO_MATCH_MESSAGE),
      faqId: null,
      faqQuestion: null,
      faqAnswer: null,
      confidence: result.confidence,
      reason: result.reason,
      model: result.model,
      source: "None",
    }, startedAt);
  }

  return withElapsed({
    status: "technical_error",
    answer: stripAssistantPrefix(TECHNICAL_ISSUE_MESSAGE),
    faqId: null,
    faqQuestion: null,
    faqAnswer: null,
    confidence: result.confidence,
    reason: result.reason,
    model: result.model,
    source: "None",
  }, startedAt);
}

function setupErrorResponse(model: string, startedAt: number): AskResponse {
  return withElapsed({
    status: "technical_error",
    answer: stripAssistantPrefix(SETUP_MESSAGE),
    faqId: null,
    faqQuestion: null,
    faqAnswer: null,
    confidence: null,
    reason: "OPENAI_API_KEY is not configured",
    model,
    source: "None",
  }, startedAt);
}

function emptyQuestionResponse(model: string, startedAt: number): AskResponse {
  return withElapsed({
    status: "no_match",
    answer: "Please enter a question.",
    faqId: null,
    faqQuestion: null,
    faqAnswer: null,
    confidence: 0,
    reason: "empty question",
    model,
    source: "None",
  }, startedAt);
}

async function handleAsk(
  request: IncomingMessage,
  response: ServerResponse,
  faqs: FAQ[],
): Promise<void> {
  const startedAt = Date.now();
  const config = loadConfig();
  const body = await readRequestBody(request);
  let question: string | null;

  try {
    question = parseQuestion(body);
  } catch {
    question = null;
  }

  if (question === null) {
    sendJson(response, 400, withElapsed({
      status: "technical_error",
      answer: stripAssistantPrefix(TECHNICAL_ISSUE_MESSAGE),
      faqId: null,
      faqQuestion: null,
      faqAnswer: null,
      confidence: null,
      reason: "invalid request body",
      model: config.openAIModel,
      source: "None",
    }, startedAt) satisfies AskResponse);
    return;
  }

  if (question === "") {
    sendJson(response, 200, emptyQuestionResponse(config.openAIModel, startedAt));
    return;
  }

  if (!config.openAIApiKey) {
    sendJson(response, 200, setupErrorResponse(config.openAIModel, startedAt));
    return;
  }

  const result = await routeQuestionWithLLM(question, faqs, config);
  sendJson(response, 200, mapRouteResult(result, startedAt));
}

function safeStaticPath(requestPath: string): string | null {
  const relativePath = requestPath === "/" ? "index.html" : requestPath.slice(1);
  const decodedPath = decodeURIComponent(relativePath);
  const resolvedPath = path.resolve(WEB_ROOT, decodedPath);
  const pathFromWebRoot = path.relative(WEB_ROOT, resolvedPath);

  if (pathFromWebRoot.startsWith("..") || path.isAbsolute(pathFromWebRoot)) {
    return null;
  }

  return resolvedPath;
}

async function serveStatic(
  requestUrl: URL,
  response: ServerResponse,
): Promise<void> {
  const filePath = safeStaticPath(requestUrl.pathname);

  if (!filePath) {
    sendText(response, 403, "Forbidden");
    return;
  }

  try {
    const content = await readFile(filePath);
    const contentType =
      MIME_TYPES.get(path.extname(filePath)) ?? "application/octet-stream";

    response.writeHead(200, {
      "content-type": contentType,
      "cache-control": "no-store",
    });
    response.end(content);
  } catch {
    sendText(response, 404, "Not found");
  }
}

async function main(): Promise<void> {
  const faqs = await loadFaqs();
  const port = resolvePort();

  const server = createServer((request, response) => {
    void (async () => {
      const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host}`);

      if (request.method === "POST" && requestUrl.pathname === "/api/ask") {
        await handleAsk(request, response, faqs);
        return;
      }

      if (request.method === "GET") {
        await serveStatic(requestUrl, response);
        return;
      }

      sendText(response, 405, "Method not allowed");
    })().catch(() => {
      if (!response.headersSent) {
        sendJson(response, 500, {
          status: "technical_error",
          answer: stripAssistantPrefix(TECHNICAL_ISSUE_MESSAGE),
          faqId: null,
          faqQuestion: null,
          faqAnswer: null,
          confidence: null,
          reason: "server error",
          model: loadConfig().openAIModel,
          source: "None",
          elapsedMs: 0,
        } satisfies AskResponse);
      } else {
        response.end();
      }
    });
  });

  server.listen(port, () => {
    console.log("Riverside Books FAQ Assistant UI");
    console.log(`Open http://localhost:${port}`);
  });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
