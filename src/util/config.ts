/**
 * Application config from environment variables.
 * All env vars required by the Lambda functions are read here.
 */
const env = process.env;

export const config = {
  /** SQS queue URL for chat events (used by submitChatEvent). */
  chatEventsQueueUrl: env.CHAT_EVENTS_QUEUE_URL ?? "",
  /** DynamoDB table name for chat sessions (used by processChatEvent). */
  chatSessionsTable: env.CHAT_SESSIONS_TABLE ?? "",
} as const;

export type Config = typeof config;
