"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL || "https://ride-app-g57x.onrender.com", {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
  }

  return socket;
}