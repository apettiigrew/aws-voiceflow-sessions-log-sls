import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { z } from "zod";
import { config } from "../util/config";
import { nowJamaicaMs } from "../util/date";
import { Status } from "../models/data";

const dynamo = new DynamoDBClient({});

const chatEventMessageSchema = z.object({
  userId: z.string().min(1, "userId is required and must be a non-empty string"),
  sessionId: z.string().min(1, "sessionId is required and must be a non-empty string"),
  timestamp: z.number({ message: "timestamp is required and must be a number (Unix milliseconds)" }),
});

type ChatEventMessage = z.infer<typeof chatEventMessageSchema>;

interface SQSRecord {
  body?: string;
}

function parseMessage(raw: string | undefined): ChatEventMessage {
  let parsed: unknown;
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(`Invalid message body: ${raw}`);
  }

  const result = chatEventMessageSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Message validation failed");
  }

  return result.data;
}

export const handler = async (event: { Records?: SQSRecord[] }): Promise<void> => {
  const tableName = config.chatSessionsTable;
  const records = event.Records ?? [];
  if (records.length === 0) return;

  
  for (const record of records) {
    console.log(record);
    
    const { userId, sessionId,timestamp} = parseMessage(record.body);
    const id = crypto.randomUUID();
    const scheduledEndAt = timestamp + 10 * 60 * 1000;
    const now = nowJamaicaMs();
    await dynamo.send(
      new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: id },
          userId: { S: userId.trim() },
          sessionId: { S: sessionId.trim() },
          status: { S: Status.ACTIVE },
          scheduledEndAt: { N: String(scheduledEndAt) },
          voiceflowRequestSent: { BOOL: false },
          createdAt: { N: String(now) },
        },
      })
    );
  }
};
