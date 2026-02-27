import type { SQSBatchResponse, SQSEvent } from "aws-lambda";
import { SessionRecord } from "../models/data";
import { deleteUserState } from "../modules/voiceflow/voiceflow-service";

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  const batchItemFailures: SQSBatchResponse["batchItemFailures"] = [];

  for (const record of event.Records) {
    try {
      let payload: SessionRecord;
      try {
        payload = JSON.parse(record.body) as SessionRecord;
      } catch {
        throw new Error(`Invalid message body: ${record.body}`);
      }

      await deleteUserState(payload.userId);
    } catch (err) {
      console.error(`Failed to process message ${record.messageId}:`, err);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};
