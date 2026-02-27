import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import type { SQSBatchResponse, SQSEvent } from "aws-lambda";
import { SessionRecord } from "../models/data";
import { config } from "../util/config";
import { voiceFlowApi } from "../modules/voiceflow/voiceflow-service";

const dynamo = new DynamoDBClient({});

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  const batchItemFailures: SQSBatchResponse["batchItemFailures"] = [];

  // call voiceflow api ensure success
  // success | fail
  // call dynamodb api ensure success
  // success | fail


  for (const record of event.Records) {
    try {
      let payload: SessionRecord;
      payload = JSON.parse(record.body) as SessionRecord;
      
      const result = await voiceFlowApi("DELETE", `/state/user/${encodeURIComponent(payload.userId)}`);

      if (result.error) {
        throw new Error(`Voiceflow request failed for user "${payload.userId}": ${result.error.message}`);
      }

      await dynamo.send(
        new UpdateItemCommand({
          TableName: config.chatSessionsTable,
          Key: { id: { S: payload.id } },
          UpdateExpression: "SET voiceflowRequestSent = :sent",
          ExpressionAttributeValues: {
            ":sent": { BOOL: true },
          },
        })
      );
    } catch (err) {
      console.error(`Failed to process message ${record.messageId}:`, err);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};
