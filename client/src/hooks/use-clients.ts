import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertClient } from "@shared/schema";
import { z } from "zod";

type ClientListParams = z.infer<Exclude<typeof api.clients.list.input, undefined>>;

export function useClients(params?: ClientListParams) {
  const queryKey = params ? [api.clients.list.path, params] : [api.clients.list.path];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = params 
        ? `${api.clients.list.path}?${new URLSearchParams(params as Record<string, string>)}`
        : api.clients.list.path;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch clients");
      return api.clients.list.responses[200].parse(await res.json());
    },
  });
}

export function useClient(id: number) {
  return useQuery({
    queryKey: [api.clients.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.clients.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch client");
      return api.clients.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertClient) => {
      const validated = api.clients.create.input.parse(data);
      const res = await fetch(api.clients.create.path, {
        method: api.clients.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create client");
      return api.clients.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.clients.list.path] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertClient>) => {
      const validated = api.clients.update.input.parse(data);
      const url = buildUrl(api.clients.update.path, { id });
      const res = await fetch(url, {
        method: api.clients.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update client");
      return api.clients.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.clients.list.path] });
    },
  });
}
