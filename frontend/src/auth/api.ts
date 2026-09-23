import { API_BASE_URL } from "../config";

export type Provider = "google" | "apple" | "github";

async function parseJsonOrEmpty(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init
  });
  const body = await parseJsonOrEmpty(response);
  if (!response.ok) {
    throw new Error(body.error ?? "Request failed");
  }
  return body as T;
}

export async function login(provider: Provider) {
  return json<{ ok: boolean; requires_username: boolean }>(`${API_BASE_URL}/api/auth/${provider}`, {
    method: "POST",
    body: JSON.stringify({
      provider_user_id: `${provider}-demo-user`,
      email: `${provider}.player@space-mission.local`
    })
  });
}

export async function logout() {
  return json<{ ok: boolean }>(`${API_BASE_URL}/api/auth/logout`, { method: "POST" });
}

export async function getMe() {
  return json<any>(`${API_BASE_URL}/api/user/me`);
}

export async function setUsername(username: string) {
  return json<{ ok: boolean; username: string }>(`${API_BASE_URL}/api/user/username`, {
    method: "POST",
    body: JSON.stringify({ username })
  });
}

export async function getMissions() {
  return json<any[]>(`${API_BASE_URL}/api/missions`);
}

export async function saveProgress(payload: any) {
  return json<{ ok: boolean }>(`${API_BASE_URL}/api/progress`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function completeMission(missionId: number) {
  return json<{ ok: boolean }>(`${API_BASE_URL}/api/mission/${missionId}/complete`, {
    method: "POST"
  });
}
