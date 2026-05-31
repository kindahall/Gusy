declare module '@wordpress/api-fetch' {
  type ApiFetchOptions = {
    path?: string;
    url?: string;
    method?: string;
    data?: unknown;
    headers?: Record<string, string>;
  };

  type ApiFetch = {
    <T = unknown>(options: ApiFetchOptions): Promise<T>;
    use: (middleware: unknown) => void;
    createNonceMiddleware: (nonce: string) => unknown;
  };

  const apiFetch: ApiFetch;
  export default apiFetch;
}

declare module '@wordpress/element' {
  export * from 'react';
}

declare module '@wordpress/i18n' {
  export function __(text: string, domain?: string): string;
}
