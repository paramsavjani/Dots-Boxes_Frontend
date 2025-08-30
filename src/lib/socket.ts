import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(username?: string) {
  if (!socket) {


    socket = io(process.env.NEXT_PUBLIC_BACKEND_URL as string, {
      withCredentials: true,
      query: username ? { username: username } : undefined,
    });
  }
  return socket;
}
