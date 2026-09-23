import { API_BASE_URL } from "../config";
async function json(url, init) {
    const response = await fetch(url, {
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
        ...init
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Request failed");
    }
    return response.json();
}
export async function login(provider) {
    return json(`${API_BASE_URL}/api/auth/${provider}`, {
        method: "POST",
        body: JSON.stringify({
            provider_user_id: `${provider}-demo-user`,
            email: `${provider}.player@space-mission.local`
        })
    });
}
export async function logout() {
    return json(`${API_BASE_URL}/api/auth/logout`, { method: "POST" });
}
export async function getMe() {
    return json(`${API_BASE_URL}/api/user/me`);
}
export async function setUsername(username) {
    return json(`${API_BASE_URL}/api/user/username`, {
        method: "POST",
        body: JSON.stringify({ username })
    });
}
export async function getMissions() {
    return json(`${API_BASE_URL}/api/missions`);
}
export async function saveProgress(payload) {
    return json(`${API_BASE_URL}/api/progress`, {
        method: "POST",
        body: JSON.stringify(payload)
    });
}
export async function completeMission(missionId) {
    return json(`${API_BASE_URL}/api/mission/${missionId}/complete`, {
        method: "POST"
    });
}
