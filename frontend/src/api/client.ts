const BASE_URL = '/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/** 统一处理 response 状态码，抛出可读错误 */
async function handleResponse(response: Response): Promise<Response> {
  if (response.ok) return response;

  if (response.status === 429) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(429, data.message || '请求过于频繁，请稍后再试');
  }

  throw new ApiError(response.status, `服务器错误 (${response.status})`);
}

/** POST JSON 请求，返回解析后的 JSON */
export async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  await handleResponse(response);
  return response.json();
}

/** POST 请求，返回原始 Response（用于 SSE 流） */
export async function postRaw(path: string, body: Record<string, unknown>): Promise<Response> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse(response);
}
