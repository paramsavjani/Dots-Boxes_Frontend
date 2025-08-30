import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io("https://slop-dsc.duckdns.org", {
      withCredentials: true,
    });
  }
  return socket;
}
