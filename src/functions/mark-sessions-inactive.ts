import {
  DynamoDBClient,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { SQSClient, SendMessageBatchRequestEntry, SendMessageCommand } from "@aws-sdk/client-sqs";
import { config } from "../util/config";
import { Context, SQSEvent } from "aws-lambda";
import { SessionRecord, Status } from "../models/data";
import { nowJamaicaMs } from "../util/date";

const dynamo = new DynamoDBClient({});
const sqs = new SQSClient({});

interface SQSRecord {
  body: SendMessageBatchRequestEntry;
}

interface SessionPayload {
  body: SendMessageBatchRequestEntry[]
}

export const handler = async (event: SQSEvent, context: Context): Promise<void> => {
  const tableName = config.chatSessionsTable;
  const notifyQueueUrl = config.notifyQueueUrl;

  console.log(event);
  if (event.Records.length == 0) {
    return;
  }
  let payload;
  const records = event.Records;
  for (const record of records) {

    try {
      payload = JSON.parse(record.body) as SessionRecord;
    } catch {
      throw new Error(`Invalid message body: ${record.body}`);
    }


    await dynamo.send(
      new UpdateItemCommand({
        TableName: tableName,
        Key: { id: { S: payload.id } },
        UpdateExpression: "SET #s = :inactive, updatedAt = :now",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: {
          ":inactive": { S: Status.INACTIVE },
          ":now": { N: String(nowJamaicaMs()) },
        },
      })
    );

    await sqs.send(
      new SendMessageCommand({
        QueueUrl: notifyQueueUrl,
        MessageBody: JSON.stringify(payload),
      })
    );
  }
};
