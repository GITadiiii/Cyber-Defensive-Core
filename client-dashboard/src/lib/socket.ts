"use client";

import { io, type Socket } from "socket.io-client";
import type { ThreatBroadcastPayload } from "./types";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

let socket: Socket | null = null;

/**
 * Returns a singleton socket.io client connected to Payal's gateway.
 * Lazily created so this is safe to import in server components too
 * (the connection itself only happens when a client component calls this).
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });
  }
  return socket;
}

/**
 * Subscribes to the 'threat-broadcast' event and returns an unsubscribe fn.
 * Payload shape matches Payal's io.emit('threat-broadcast', ...) comment
 * in server.js — fired when psti_composite > 81.
 */
export function onThreatBroadcast(
  callback: (payload: ThreatBroadcastPayload) => void
): () => void {
  const s = getSocket();
  s.on("threat-broadcast", callback);
  return () => s.off("threat-broadcast", callback);
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
