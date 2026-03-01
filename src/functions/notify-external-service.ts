import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import type { SQSBatchResponse, SQSEvent } from "aws-lambda";
import { SessionRecord } from "../models/data";
import { config } from "../util/config";
import { voiceFlowDeleteApi, voiceFlowInteractApi } from "../modules/voiceflow/voiceflow-service";

const dynamo = new DynamoDBClient({});

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  const batchItemFailures: SQSBatchResponse["batchItemFailures"] = [];

  for (const record of event.Records) {
    try {
      let payload: SessionRecord;
      payload = JSON.parse(record.body) as SessionRecord;
    
      // Send voiceflow API request to restart the user conversation
      const result = await voiceFlowInteractApi(payload.userId);

      if (result != undefined && result.error) {
        throw new Error(`Voiceflow interact request failed for user "${payload.userId}": ${result.error.message}`);
      }

      console.log(result);
      
      // Update dynamo table to signal that the request has been sent for this userid
      await dynamo.send(
        new UpdateItemCommand({
          TableName: config.chatSessionsTable,
          Key: { userId: { S: payload.userId } },
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
