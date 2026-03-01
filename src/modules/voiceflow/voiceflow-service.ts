import { config } from "../../util/config";

interface ApiError {
  message: string;
  status?: number;
}

// Generic response structure
export interface ApiResponse {
  data?: any;
  error?: ApiError;
}
export interface FetchConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  queryParams?: Record<string, string | number>;
}

export async function voiceFlowApi(method: string, path: string):Promise<void | {error:{message:string}}> {

  try {
    const response = await fetch(`${config.voiceflowBaseUrl}${path}`, {
      method,
      headers: {
        Authorization: config.voiceflowApiKey,
        versionID: config.voiceflowVersionId,
      },
    });

    // Handle HTTP errors
    if (!response.ok) {
      throw new Error(`voiceflow api DELETE request failed for ${path}`)
    }

  } catch (error) {
    console.error("Error has occured while sending voiceflow api");
    return {
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}
