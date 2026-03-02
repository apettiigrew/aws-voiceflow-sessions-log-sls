import {
  DynamoDBClient,
  QueryCommand,
  type AttributeValue,
} from "@aws-sdk/client-dynamodb";
import {
  SQSClient,
  SendMessageBatchCommand,
  type SendMessageBatchRequestEntry,
} from "@aws-sdk/client-sqs";
import { config } from "../util/config";
import { nowJamaicaMs } from "../util/date";
import { Status } from "../models/data";

const dynamo = new DynamoDBClient({});
const sqs = new SQSClient({});

const GSI_NAME = "StatusScheduledEndAtIndex";
const SQS_BATCH_SIZE = 10;

function attributeToValue(v: AttributeValue): string | number | null | undefined {
  if (v.S !== undefined) return v.S;
  if (v.N !== undefined) return Number(v.N);
  if (v.NULL !== undefined) return null;
  return undefined;
}

function itemToPayload(item: Record<string, AttributeValue>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(item)) {
    const v = attributeToValue(val);
    if (v !== undefined) out[k] = v;
  }
  return out;
}

export const handler = async (): Promise<void> => {
  const tableName = config.chatSessionsTable;
  const queueUrl = config.expiredSessionsQueueUrl;
  const now = nowJamaicaMs();
  let lastKey: Record<string, AttributeValue> | undefined;
  let totalSent = 0;

  do {
    const result = await dynamo.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: GSI_NAME,
        KeyConditionExpression: "#s = :active AND scheduledEndAt < :now",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: {
          ":active": { S: Status.ACTIVE  },
          ":now": { N: String(now) },
        },
        ExclusiveStartKey: lastKey,
      })
    );

    const items = result.Items ?? [];
    if (items.length === 0 && !result.LastEvaluatedKey) {
      break;
    }

    console.log(items);

    for (let i = 0; i < items.length; i += SQS_BATCH_SIZE) {
      const batch = items.slice(i, i + SQS_BATCH_SIZE);
      const entries: SendMessageBatchRequestEntry[] = batch.map((item, idx) => ({
        Id: `msg-${totalSent + idx}`,
        MessageBody: JSON.stringify(itemToPayload(item)),
      }));

      const result = await sqs.send(
        new SendMessageBatchCommand({ QueueUrl: queueUrl, Entries: entries })
      );

      totalSent += result.Successful?.length ?? 0;

      if (result.Failed && result.Failed.length > 0) {
        const failedIds = new Set(result.Failed.map((f) => f.Id));
        const retryEntries = entries.filter((e) => failedIds.has(e.Id));

        const retryResult = await sqs.send(
          new SendMessageBatchCommand({ QueueUrl: queueUrl, Entries: retryEntries })
        );

        totalSent += retryResult.Successful?.length ?? 0;

        if (retryResult.Failed && retryResult.Failed.length > 0) {
          throw new Error(
            `Failed to enqueue ${retryResult.Failed.length} session(s) after retry: ` +
              retryResult.Failed.map((f) => `${f.Id} (${f.Code}: ${f.Message})`).join(", ")
          );
        }
      }
    }

    lastKey = result.LastEvaluatedKey;
  } while (lastKey);
};
