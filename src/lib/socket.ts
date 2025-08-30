import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(process.env.BACKEND_URL, {
      withCredentials: true,
    });
  }
  return socket;
}
