import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  const headers: HeadersInit = {};

  if (data) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

function buildUrl(queryKey: readonly unknown[]): string {
  const pathParts: string[] = [];
  let queryParams: Record<string, unknown> | null = null;

  for (const part of queryKey) {
    if (typeof part === "string") {
      pathParts.push(part);
    } else if (part && typeof part === "object" && !Array.isArray(part)) {
      queryParams = part as Record<string, unknown>;
    }
  }

  let url = pathParts.join("/").replaceAll(/\/+/g, "/");

  if (queryParams) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null && typeof value !== "object") {
        params.append(key, String(value));
      }
    }
    const paramString = params.toString();
    if (paramString) {
      url = `${url}?${paramString}`;
    }
  }

  return url;
}

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = buildUrl(queryKey);

    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      // 60 seconds default; override per-query for ticket details (30 s) or
      // slow-changing config data (5 min) as needed.
      staleTime: 60 * 1000,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
