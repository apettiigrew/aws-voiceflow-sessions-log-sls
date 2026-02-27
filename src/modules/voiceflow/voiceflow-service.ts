import { config } from "../../util/config";

const VOICEFLOW_BASE_URL = "https://general-runtime.voiceflow.com";

export type VoiceflowApiResponse = {
  ok: true;
} | {
  ok: false;
  status: number;
  body: string;
};

async function voiceflowRequest(
  method: "DELETE",
  path: string,
): Promise<VoiceflowApiResponse> {
  const res = await fetch(`${VOICEFLOW_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: config.voiceflowApiKey,
    },
  });

  if (!res.ok) {
    return { ok: false, status: res.status, body: await res.text() };
  }

  return { ok: true };
}

export async function deleteUserState(userId: string): Promise<void> {
  const result = await voiceflowRequest("DELETE", `/state/user/${encodeURIComponent(userId)}`);

  if (!result.ok) {
    throw new Error(
      `Voiceflow deleteUserState failed for user "${userId}": ${result.status} ${result.body}`,
    );
  }
}
