import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { z } from "zod";
import { config } from "../util/config";

const sqs = new SQSClient({});

/** Request body schema; validated in handler via safeParse(parsed). */
const chatEventBodySchema = z.object({
  userId: z.string().min(1, "userId is required and must be a non-empty string"),
  // sessionId: z.string().min(1, "sessionId is required and must be a non-empty string"),
  timestamp: z.number({ message: "timestamp is required and must be a number (Unix milliseconds)" }),
});

export type ChatEventBody = z.infer<typeof chatEventBodySchema>;

type OkResult<T> = { ok: true } & T;
type ErrResult = { ok: false; response: APIGatewayProxyResult };
type Result<T> = OkResult<T> | ErrResult;

function parseBody(raw: string | null): unknown {
  if (raw == null || raw === "") return {};
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error("Invalid JSON body");
  }
}

function ensureQueueUrl(): Result<{ queueUrl: string }> {
  return { ok: true, queueUrl: config.chatEventsQueueUrl };
}

function parseAndValidateBody(rawBody: string | null): Result<{ body: ChatEventBody }> {
  let parsed: unknown;
  try {
    parsed = parseBody(rawBody);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid JSON body";
    return {
      ok: false,
      response: { statusCode: 400, body: JSON.stringify({ error: message }) },
    };
  }

  const result = chatEventBodySchema.safeParse(parsed);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Validation failed";
    return {
      ok: false,
      response: { statusCode: 400, body: JSON.stringify({ error: message }) },
    };
  }

  return { ok: true, body: result.data };
}

async function enqueueChatEvent(
  queueUrl: string,
  body: ChatEventBody
): Promise<APIGatewayProxyResult> {
  const { userId, timestamp } = body;
  try {
    const sendResult = await sqs.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({
          userId: userId.trim(),
          // sessionId: sessionId.trim(),
          timestamp: timestamp,
        }),
      })
    );
    return {
      statusCode: 202,
      body: JSON.stringify({ messageId: sendResult.MessageId ?? "sent" }),
    };
  } catch (err) {
    console.error("SQS send failed:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to enqueue event" }),
    };
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const queue = ensureQueueUrl();
  if (!queue.ok) return queue.response;

  const validated = parseAndValidateBody(event.body);
  if (!validated.ok) return validated.response;

  return enqueueChatEvent(queue.queueUrl, validated.body);
};
