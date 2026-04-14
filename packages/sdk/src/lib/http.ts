export class SDKError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "SDKError";
  }
}

export interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

export const request = async <T>(
  apiUrl: string,
  path: string,
  options: RequestOptions = {}
): Promise<T> => {
  const response = await fetch(`${apiUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    let message = "Unexpected Relay API error";

    try {
      const payload = (await response.json()) as { message?: string };
      if (payload.message) {
        message = payload.message;
      }
    } catch {
      message = response.statusText || message;
    }

    throw new SDKError(message, response.status);
  }

  return (await response.json()) as T;
};
