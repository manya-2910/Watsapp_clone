import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
    private socket: Socket | null = null;

    connect(token: string) {
        if (this.socket) return;

        this.socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
        });

        this.socket.on('connect', () => {
            console.log('Connected to WebSocket');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from WebSocket');
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    on(event: string, callback: (...args: any[]) => void) {
        this.socket?.on(event, callback);
    }

    emit(event: string, data: any) {
        this.socket?.emit(event, data);
    }
}

export const socketService = new SocketService();
