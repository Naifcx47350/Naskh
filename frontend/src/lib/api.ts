export const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);
  if (!response.ok) {
    const text = await response.text();
    try {
      const parsed = JSON.parse(text);
      throw new Error(parsed.detail ?? text);
    } catch {
      throw new Error(text || "Request failed");
    }
  }
  return response.json() as Promise<T>;
}
