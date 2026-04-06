declare module 'socket.io-client' {
  import { Socket } from 'socket.io-client';
  export * from 'socket.io-client';
  export default function io(uri?: string, opts?: any): Socket;
}