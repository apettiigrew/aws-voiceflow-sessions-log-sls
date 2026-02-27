import type { SQSBatchResponse, SQSEvent } from "aws-lambda";
import { config } from "../util/config";
import { SessionRecord } from "../models/data";

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  const baseUrl = config.externalServiceUrl;
  const batchItemFailures: SQSBatchResponse["batchItemFailures"] = [];

  for (const record of event.Records) {
    try {
      let payload: SessionRecord;
      try {
        payload = JSON.parse(record.body) as SessionRecord;
      } catch {
        throw new Error(`Invalid message body: ${record.body}`);
      }

      const res = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`External service returned ${res.status}: ${await res.text()}`);
      }
    } catch (err) {
      console.error(`Failed to process message ${record.messageId}:`, err);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};
