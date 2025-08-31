import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { addCustomerModeToUrl } from "@/utils/customer-mode";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  method: string,
  data?: unknown | undefined,
): Promise<Response> {
  const finalUrl = addCustomerModeToUrl(url);

  const res = await fetch(finalUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = addCustomerModeToUrl(queryKey.join("/") as string);
    
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
      // Removed global queryFn to prevent conflicts with useDemoApi
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 15, // 15 minutes aggressive caching
      gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
      retry: 1,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchIntervalInBackground: false,
      notifyOnChangeProps: ['data', 'error'], // Only notify on data/error changes
    },
    mutations: {
      retry: false,
    },
  },
});

// Query optimizer temporarily disabled due to conflicts with useDemoApi
// TODO: Re-implement query optimization without conflicting with custom query functions
