import { config } from "../../util/config";

interface ApiError {
  message: string;
  status?: number;
}

// Generic response structure
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}
export interface FetchConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  queryParams?: Record<string, string | number>;
}

export async function voiceFlowApi<T>(method: string, path: string): Promise<ApiResponse<T>> {

  try {
    const response = await fetch(`${config.voiceflowBaseUrl}${path}`, {
      method,
      headers: {
        Authorization: config.voiceflowApiKey,
      },
    });

    // Handle HTTP errors
    if (!response.ok) {
      return {
        error: {
          message: `HTTP error: ${response.statusText}`,
          status: response.status,
        },
      };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}
