import { useQuery } from "@tanstack/react-query";

export function useStableQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>
) {
  return useQuery({
    queryKey,
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
}