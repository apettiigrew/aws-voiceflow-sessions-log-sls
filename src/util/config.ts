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
  get awsHttpApiKey() { return getEnvValueOrThrowError("AWS_HTTP_API_KEY"); },
  /** Voiceflow API key for state management API calls. */
  get voiceflowApiKey() { return getEnvValueOrThrowError("VOICEFLOW_API_KEY"); },
  /** Voiceflow base URL for dialog management API. */
  get voiceflowBaseUrl() { return getEnvValueOrThrowError("VOICEFLOW_BASEURL"); },
  /** Voicelfow version that is currently being used */
  get voiceflowVersionId() { return getEnvValueOrReturnUndefined("VOICEFLOW_VERSIONID") || "development"; },
  /** SQS queue URL for chat events (used by submitChatEvent). */
  get chatEventsQueueUrl() { return getEnvValueOrThrowError("CHAT_EVENTS_QUEUE_URL"); },
  /** DynamoDB table name for chat sessions. */
  get chatSessionsTable() { return getEnvValueOrThrowError("CHAT_SESSIONS_TABLE"); },
  /** SQS queue URL for expired sessions (used by determineSession). */
  get expiredSessionsQueueUrl() { return getEnvValueOrThrowError("EXPIRED_SESSIONS_QUEUE_URL"); },
  /** SQS queue URL for notify worker (used by markSessionsInactive). */
  get notifyQueueUrl() { return getEnvValueOrThrowError("NOTIFY_QUEUE_URL"); },
};

export type Config = typeof config;
