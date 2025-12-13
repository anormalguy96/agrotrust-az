export async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || `Request failed (${res.status})`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Expected JSON but got:\n${text.slice(0, 200)}`
    );
  }
}
