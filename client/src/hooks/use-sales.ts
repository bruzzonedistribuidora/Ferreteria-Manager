import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type CreateSaleRequest } from "@shared/schema";

export function useSales() {
  return useQuery({
    queryKey: [api.sales.list.path],
    queryFn: async () => {
      const res = await fetch(api.sales.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch sales");
      return api.sales.list.responses[200].parse(await res.json());
    },
  });
}

export function useSale(id: number) {
  return useQuery({
    queryKey: [api.sales.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.sales.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch sale details");
      return api.sales.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSaleRequest) => {
      const validated = api.sales.create.input.parse(data);
      const res = await fetch(api.sales.create.path, {
        method: api.sales.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to complete sale");
      return api.sales.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.sales.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.dashboard.path] });
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] }); // Update stock
    },
  });
}
