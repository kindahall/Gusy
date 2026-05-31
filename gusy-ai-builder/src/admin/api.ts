import apiFetch from '@wordpress/api-fetch';

export type GusyApiOptions = {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: unknown;
  headers?: Record<string, string>;
};

export function apiRequest<T>(options: GusyApiOptions): Promise<T> {
  return apiFetch<T>(options);
}

export default apiRequest;
