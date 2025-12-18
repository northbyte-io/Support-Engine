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
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {};
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
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

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Build URL from queryKey
    // Supports: ['/api/tickets'], ['/api/tickets', id], ['/api/tickets', { limit: 5 }]
    const pathParts: string[] = [];
    let queryParams: Record<string, unknown> | null = null;

    for (const part of queryKey) {
      if (typeof part === "string") {
        pathParts.push(part);
      } else if (part && typeof part === "object" && !Array.isArray(part)) {
        queryParams = part as Record<string, unknown>;
      }
    }

    let url = pathParts.join("/").replace(/\/+/g, "/");

    if (queryParams) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(queryParams)) {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      }
      const paramString = params.toString();
      if (paramString) {
        url = `${url}?${paramString}`;
      }
    }
    
    const res = await fetch(url, {
      credentials: "include",
      headers: getAuthHeaders(),
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
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
