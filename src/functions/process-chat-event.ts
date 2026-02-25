import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { config } from "../util/config";

const dynamo = new DynamoDBClient({});

interface SQSRecord {
  body?: string;
}

interface ChatEventMessage {
  userId?: string;
  sessionId?: string;
}

export const handler = async (event: { Records?: SQSRecord[] }): Promise<void> => {
  const tableName = config.chatSessionsTable;
  if (!tableName) {
    throw new Error("CHAT_SESSIONS_TABLE not configured");
  }

  const records = event.Records ?? [];
  const now = Date.now();
  const scheduledEndAt = now + 10 * 60 * 1000; // 10 minutes from now

  for (const record of records) {
    let message: ChatEventMessage;
    try {
      message = record.body ? JSON.parse(record.body) : {};
    } catch {
      throw new Error(`Invalid message body: ${record.body}`);
    }

    const userId = typeof message.userId === "string" ? message.userId : "";
    const sessionId = typeof message.sessionId === "string" ? message.sessionId : "";
    if (!userId || !sessionId) {
      throw new Error("Message must include userId and sessionId");
    }

    const id = crypto.randomUUID();

    await dynamo.send(
      new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: id },
          userId: { S: userId },
          sessionId: { S: sessionId },
          scheduledEndAt: { N: String(scheduledEndAt) },
          endedAt: { NULL: true },
          createdAt: { N: String(now) },
          updatedAt: { N: String(now) },
        },
      })
    );
  }
};
