/**
 * Application config from environment variables.
 * All env vars required by the Lambda functions are read here.
 */

function getEnvValueOrThrowError(key: string): string {
  const value = process.env[key];
  if (value === undefined) {
    throw new Error(`'${key}' is undefined!`);
  }
  return value;
}

export const config = {
  /** SQS queue URL for chat events (used by submitChatEvent). */
  chatEventsQueueUrl: getEnvValueOrThrowError("CHAT_EVENTS_QUEUE_URL"),
  /** DynamoDB table name for chat sessions (used by processChatEvent). */
  chatSessionsTable: getEnvValueOrThrowError("CHAT_SESSIONS_TABLE"),
  /** SQS queue URL for expired sessions (used by determineSession). */
  expiredSessionsQueueUrl: getEnvValueOrThrowError("EXPIRED_SESSIONS_QUEUE_URL"),
  /** SQS queue URL for notify worker (used by markSessionsInactive). */
  notifyQueueUrl: getEnvValueOrThrowError("NOTIFY_QUEUE_URL"),
  /** External notification service URL (used by notifyExternalService). */
  externalServiceUrl: getEnvValueOrThrowError("EXTERNAL_SERVICE_URL"),
} as const;

export type Config = typeof config;
