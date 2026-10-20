import type { IncomingMessage, ServerResponse } from "node:http";

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "HttpError";
    this.status = status;
  }
}

export interface ErrorResponse {
  date: string;
  path: string;
  message: string;
}

export function sendResponse(
  response: ServerResponse,
  status: number,
  body?: unknown,
) {
  response.statusCode = status;

  if (body !== undefined) {
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify(body));
    return;
  }

  response.end();
}

export async function getBodyObject(
  request: IncomingMessage,
): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch (err) {
    throw new HttpError(400, "Request body is not valid JSON", err);
  }
  return body;
}

export function buildErrorBody(message: string, url?: string): ErrorResponse {
  return {
    date: new Date().toISOString(),
    path: url ?? "/",
    message,
  };
}
