import { io, Socket } from "socket.io-client";
import { queryClient } from "./queryClient";

let socket: Socket | null = null;

export type DataChangeEvent =
  | "products"
  | "categories"
  | "brands"
  | "clients"
  | "suppliers"
  | "sales"
  | "delivery-notes"
  | "pre-invoices"
  | "stock-movements"
  | "cash-registers"
  | "checks"
  | "payment-methods"
  | "warehouses"
  | "loyalty-coupons"
  | "loyalty-offers"
  | "loyalty-payment-requests"
  | "price-lists"
  | "purchase-orders"
  | "staff-members";

const eventToQueryKeyMap: Record<DataChangeEvent, string[]> = {
  "products": ["/api/products"],
  "categories": ["/api/categories"],
  "brands": ["/api/brands"],
  "clients": ["/api/clients"],
  "suppliers": ["/api/suppliers"],
  "sales": ["/api/sales", "/api/stats/dashboard"],
  "delivery-notes": ["/api/delivery-notes"],
  "pre-invoices": ["/api/pre-invoices"],
  "stock-movements": ["/api/stock-movements"],
  "cash-registers": ["/api/cash-registers"],
  "checks": ["/api/checks"],
  "payment-methods": ["/api/payment-methods"],
  "warehouses": ["/api/warehouses"],
  "loyalty-coupons": ["/api/loyalty-coupons"],
  "loyalty-offers": ["/api/loyalty-offers"],
  "loyalty-payment-requests": ["/api/payment-requests"],
  "price-lists": ["/api/price-lists"],
  "purchase-orders": ["/api/purchase-orders"],
  "staff-members": ["/api/employees"],
};

export function initializeSocket(): Socket {
  if (socket?.connected) {
    return socket;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  
  socket = io(`${window.location.protocol}//${host}`, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on("connect", () => {
    console.log("[WebSocket] Conectado al servidor");
  });

  socket.on("disconnect", (reason) => {
    console.log("[WebSocket] Desconectado:", reason);
  });

  socket.on("connect_error", (error) => {
    console.log("[WebSocket] Error de conexión:", error.message);
  });

  socket.on("data-change", (payload: { type: DataChangeEvent; data?: any; timestamp: number }) => {
    console.log("[WebSocket] Cambio de datos recibido:", payload.type);
    
    const queryKeys = eventToQueryKeyMap[payload.type];
    if (queryKeys) {
      queryKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    }
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
