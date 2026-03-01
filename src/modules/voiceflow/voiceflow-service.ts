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
  console.log(`[voiceFlowApi] Called — method: ${method}, path: ${path}`);

  try {
    const url = `${config.voiceflowBaseUrl}${path}`;
    console.log(`[voiceFlowApi] Sending request to: ${url}`);

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: config.voiceflowApiKey,
        versionID: config.voiceflowVersionId,
      },
    });

    console.log(`[voiceFlowApi] Response status: ${response.status}`);

    // Handle HTTP errors
    if (!response.ok) {
      throw new Error(`voiceflow api DELETE request failed for ${path}`)
    }

    console.log(`[voiceFlowApi] Request succeeded for path: ${path}`);
  } catch (error) {
    console.error("Error has occured while sending voiceflow api", error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

export async function voiceFlowDeleteApi(userId: string): Promise<void | { error: { message: string } }> {
  const path = `/state/user/${userId}`;
  console.log(`[voiceFlowDeleteApi] Called — userId: ${userId}`);

  try {
    const url = `${config.voiceflowBaseUrl}${path}`;
    console.log(`[voiceFlowDeleteApi] Sending PUT request to: ${url}`);

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: config.voiceflowApiKey,
        versionID: config.voiceflowVersionId,
      },
    });

    console.log(`[voiceFlowDeleteApi] Response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`voiceflow delete api DELETE request failed for user ${userId}`);
    }

    console.log(`[voiceFlowDeleteApi] Request succeeded for userId: ${userId}`);
  } catch (error) {
    console.error('Error has occurred while sending voiceflow delete api', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

export async function voiceFlowInteractApi(userId: string): Promise<void | { error: { message: string } }> {
  const path = `/state/user/${userId}/interact`;
  console.log(`[voiceFlowInteractApi] Called — userId: ${userId}`);

  try {
    const url = `${config.voiceflowBaseUrl}${path}`;
    const requestBody = { type: "launch" };
    console.log(`[voiceFlowInteractApi] Request — url: ${url}, body:`, JSON.stringify(requestBody));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: config.voiceflowApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseBodyText = await response.json();
    console.log(`[voiceFlowInteractApi] Response — status: ${response.status}, body:`, responseBodyText);

    if (!response.ok) {
      throw new Error(`voiceflow interact api POST request failed for user ${userId}`);
    }

    console.log(`[voiceFlowInteractApi] Request succeeded for userId: ${userId}`);
    return responseBodyText;
  } catch (error) {
    console.error('Error has occurred while sending voiceflow interact api', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}
