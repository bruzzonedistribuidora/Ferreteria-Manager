import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { 
  DeliveryNoteWithDetails, 
  CreateDeliveryNoteRequest, 
  ClientWithPendingNotes,
  PreInvoiceWithDetails,
  CreatePreInvoiceRequest
} from "@shared/schema";

export function useDeliveryNotes(clientId?: number) {
  const queryKey = clientId 
    ? ['/api/delivery-notes', { clientId }] 
    : ['/api/delivery-notes'];
  
  return useQuery<DeliveryNoteWithDetails[]>({
    queryKey
  });
}

export function useDeliveryNote(id: number) {
  return useQuery<DeliveryNoteWithDetails>({
    queryKey: ['/api/delivery-notes', id],
    enabled: !!id
  });
}

export function usePendingNotesByClient() {
  return useQuery<ClientWithPendingNotes[]>({
    queryKey: ['/api/delivery-notes/pending-by-client']
  });
}

export function useCreateDeliveryNote() {
  return useMutation({
    mutationFn: (data: CreateDeliveryNoteRequest) => 
      apiRequest('/api/delivery-notes', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery-notes'] });
    }
  });
}

export function useUpdateDeliveryNoteStatus() {
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest(`/api/delivery-notes/${id}/status`, 'PATCH', { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery-notes'] });
    }
  });
}

export function usePreInvoices() {
  return useQuery<PreInvoiceWithDetails[]>({
    queryKey: ['/api/pre-invoices']
  });
}

export function usePreInvoice(id: number) {
  return useQuery<PreInvoiceWithDetails>({
    queryKey: ['/api/pre-invoices', id],
    enabled: !!id
  });
}

export function useCreatePreInvoice() {
  return useMutation({
    mutationFn: (data: CreatePreInvoiceRequest) =>
      apiRequest('/api/pre-invoices', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pre-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/delivery-notes'] });
    }
  });
}

export function useUpdatePreInvoiceStatus() {
  return useMutation({
    mutationFn: ({ id, status, adminNotes }: { id: number; status: string; adminNotes?: string }) =>
      apiRequest(`/api/pre-invoices/${id}/status`, 'PATCH', { status, adminNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pre-invoices'] });
    }
  });
}
