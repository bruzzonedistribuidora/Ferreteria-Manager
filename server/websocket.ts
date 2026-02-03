import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import { log } from "./index";

let io: SocketServer | null = null;

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

export function setupWebSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    path: "/socket.io"
  });

  io.on("connection", (socket: Socket) => {
    log(`Cliente conectado: ${socket.id}`, "websocket");

    socket.on("disconnect", () => {
      log(`Cliente desconectado: ${socket.id}`, "websocket");
    });

    socket.on("subscribe", (channel: string) => {
      socket.join(channel);
      log(`${socket.id} se suscribió a: ${channel}`, "websocket");
    });

    socket.on("unsubscribe", (channel: string) => {
      socket.leave(channel);
      log(`${socket.id} se desuscribió de: ${channel}`, "websocket");
    });
  });

  log("WebSocket server initialized", "websocket");
  return io;
}

export function emitDataChange(event: DataChangeEvent, data?: any): void {
  if (!io) {
    console.warn("WebSocket server not initialized");
    return;
  }
  
  io.emit("data-change", { type: event, data, timestamp: Date.now() });
  log(`Emitido cambio de datos: ${event}`, "websocket");
}

export function getIO(): SocketServer | null {
  return io;
}
