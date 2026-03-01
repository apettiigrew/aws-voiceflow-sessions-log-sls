import { ConditionalCheckFailedException, DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { z } from "zod";
import { config } from "../util/config";
import { ChatEvent, chatEventBodySchema, nowJamaicaMs } from "../util/date";
import { Status } from "../models/data";
import { DateTime } from "luxon";

const dynamo = new DynamoDBClient({});

interface SQSRecord {
  body?: string;
}

function parseMessage(raw: string | undefined): ChatEvent {
  let parsed;
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(`Invalid message body: ${raw}`);
  }

  const result = chatEventBodySchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Message validation failed");
  }

  return result.data;
}

export const handler = async (event: { Records?: SQSRecord[] }): Promise<void> => {
  const tableName = config.chatSessionsTable;
  const records = event.Records ?? [];
  if (records.length === 0) return;

  const now = nowJamaicaMs();
  for (const record of records) {
    console.log(record);

    const { userId, timestamp } = parseMessage(record.body);
    const dt = DateTime.fromFormat(
      timestamp,
      "cccc, LLL dd, yyyy, HH:mm",
      { zone: "America/Jamaica" }
    );
    
    const timestampMs = dt.toMillis();
    const scheduledEndAt = timestampMs + 10 * 60 * 1000;
    const id = crypto.randomUUID();

    try {
      await dynamo.send(
        new PutItemCommand({
          TableName: tableName,
          ConditionExpression: "attribute_not_exists(userId)",
          Item: {
            id: { S: id },
            userId: { S: userId.trim() },
            status: { S: Status.ACTIVE },
            scheduledEndAt: { N: String(scheduledEndAt) },
            voiceflowRequestSent: { BOOL: false },
            createdAt: { N: String(now) },
          },
        })
      );
    } catch (err) {
      if (err instanceof ConditionalCheckFailedException) {
        console.warn(`Skipping duplicate userId: ${userId}`);
      }
    }
  }
};
