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
function getEnvValueOrReturnUndefined(key: string): string | undefined {
  const value = process.env[key];
  return value;
}


export const config = {
  /** AWS API Gateway API key. */
  awsHttpApiKey: getEnvValueOrThrowError("AWS_HTTP_API_KEY"),
  /** Voiceflow API key for state management API calls. */
  voiceflowApiKey: getEnvValueOrThrowError("VOICEFLOW_API_KEY"),
  /** Voiceflow base URL for dialog management API. */
  voiceflowBaseUrl: getEnvValueOrThrowError("VOICEFLOW_BASEURL"),
  /** Voicelfow version that is currently being used */
  voiceflowVersionId: getEnvValueOrReturnUndefined("VOICEFLOW_VERSIONID") || "development",
  /** SQS queue URL for chat events (used by submitChatEvent). */
  chatEventsQueueUrl: getEnvValueOrThrowError("CHAT_EVENTS_QUEUE_URL"),
  /** DynamoDB table name for chat sessions. */
  chatSessionsTable: getEnvValueOrThrowError("CHAT_SESSIONS_TABLE"),
  /** SQS queue URL for expired sessions (used by determineSession). */
  expiredSessionsQueueUrl: getEnvValueOrThrowError("EXPIRED_SESSIONS_QUEUE_URL"),
  /** SQS queue URL for notify worker (used by markSessionsInactive). */
  notifyQueueUrl: getEnvValueOrThrowError("NOTIFY_QUEUE_URL"),
} as const;

export type Config = typeof config;
