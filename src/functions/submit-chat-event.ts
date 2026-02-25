import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { config } from "../util/config";

const sqs = new SQSClient({});

interface ChatEventBody {
  userId?: string;
  sessionId?: string;
}

export const handler = async (event: {
  body?: string | null;
  requestContext?: unknown;
}): Promise<{ statusCode: number; body: string }> => {
  const queueUrl = config.chatEventsQueueUrl;
  if (!queueUrl) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "CHAT_EVENTS_QUEUE_URL not configured" }),
    };
  }

  let parsedBody: ChatEventBody;
  try {
    parsedBody = event.body ? JSON.parse(event.body) : {};
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  const { userId, sessionId } = parsedBody;
  if (typeof userId !== "string" || !userId.trim()) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "userId is required and must be a non-empty string" }),
    };
  }
  if (typeof sessionId !== "string" || !sessionId.trim()) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "sessionId is required and must be a non-empty string" }),
    };
  }

  try {
    const result = await sqs.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({ userId: userId.trim(), sessionId: sessionId.trim() }),
      })
    );
    return {
      statusCode: 202,
      body: JSON.stringify({ messageId: result.MessageId ?? "sent" }),
    };
  } catch (err) {
    console.error("SQS send failed:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to enqueue event" }),
    };
  }
};
