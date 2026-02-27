import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { z } from "zod";
import { config } from "../util/config";
import { nowJamaicaMs } from "../util/date";
import { Status } from "../models/data";

const dynamo = new DynamoDBClient({});

const chatEventMessageSchema = z.object({
  data: z.object({
    endTime: z.number({ message: "data.endTime is required and must be a number (Unix milliseconds)" }),
    environmentID: z.string().min(1, "data.environmentID is required and must be a non-empty string"),
    projectID: z.string().min(1, "data.projectID is required and must be a non-empty string"),
    sessionID: z.string().min(1, "data.sessionID is required and must be a non-empty string"),
    startTime: z.number({ message: "data.startTime is required and must be a number (Unix milliseconds)" }),
    userID: z.string().min(1, "data.userID is required and must be a non-empty string"),
  }),
  resource: z.string().min(1, "resource is required and must be a non-empty string"),
  time: z.number({ message: "time is required and must be a number (Unix milliseconds)" }),
  type: z.literal("runtime.session.end"),
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
    
    const { data } = parseMessage(record.body);
    const id = crypto.randomUUID();
    const scheduledEndAt = data.startTime + 10 * 60 * 1000;
    const now = nowJamaicaMs();
    await dynamo.send(
      new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: id },
          userId: { S: data.userID.trim() },
          sessionId: { S: data.sessionID.trim() },
          status: { S: Status.ACTIVE },
          scheduledEndAt: { N: String(scheduledEndAt) },
          voiceflowRequestSent: { BOOL: false },
          createdAt: { N: String(now) },
        },
      })
    );
  }
};
