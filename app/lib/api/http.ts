import { type ApiErrorBody, type ApiResponse } from '../../types/api';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: ApiErrorBody | null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function assertApiConfigured() {
  getApiBaseUrl();
}

export function getApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new ApiError('NEXT_PUBLIC_API_BASE_URL is required when mock data is disabled.', 0);
  }

  return API_BASE_URL;
}

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  const body = await readApiResponse<T>(response);

  if (!response.ok) {
    throw new ApiError(body.error?.message ?? `API request failed: ${response.status}`, response.status, body.error);
  }

  if (!body.success) {
    throw new ApiError(body.error?.message ?? 'API request failed.', response.status, body.error);
  }

  return body.data;
}

async function readApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      data: undefined as T,
      error: {
        code: 'INVALID_RESPONSE',
        message: 'API response is not valid JSON.',
      },
    };
  }
}
