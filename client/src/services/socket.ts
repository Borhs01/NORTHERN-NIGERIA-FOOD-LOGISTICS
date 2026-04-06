import io from 'socket.io-client';

const socketUrl = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : '';

const socket = io(socketUrl || 'http://localhost:5000', {
  withCredentials: true,
});

export default socket;
