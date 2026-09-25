const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    credentials: "include",
    // Only set Content-Type when there's actually a body — Fastify's
    // built-in JSON parser rejects an empty body when this header is
    // present (FST_ERR_CTP_EMPTY_JSON_BODY, a 400), which every no-body
    // DELETE/PATCH call (e.g. cancelling an invitation, revoking a
    // membership) was hitting.
    headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}) as { error?: string; message?: string });
    throw new Error(body.message ?? body.error ?? `${path} failed with status ${response.status}`);
  }

  // A 204 (or any other empty-body response) has nothing to parse —
  // .json() would throw on it. Every current caller that cares about the
  // response body gets a non-empty one back.
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
