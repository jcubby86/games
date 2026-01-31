import { io } from 'socket.io-client';

// Use Vite env injected at build time in the browser. If undefined,
// the socket.io client will derive the host from `window.location`.
const URL = import.meta.env.VITE_NGINX_BACKEND_ADDRESS as string | undefined;

export const socket = io(URL, { autoConnect: false });
