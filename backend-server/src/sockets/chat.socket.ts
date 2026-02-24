import { Server, Socket } from 'socket.io';
import prisma from '../utils/prisma';

interface ConnectedUser {
    socketId: string;
    userId: string;
}

const connectedUsers = new Map<string, string>(); // userId -> socketId

export const setupSockets = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log('A user connected:', socket.id);

        socket.on('join', async (userId: string) => {
            connectedUsers.set(userId, socket.id);
            socket.join(userId);

            // Update session in DB
            await prisma.session.upsert({
                where: { userId },
                update: { socketId: socket.id, isActive: true },
                create: { userId, socketId: socket.id, isActive: true }
            });

            console.log(`User ${userId} is online with socket ${socket.id}`);
        });

        socket.on('send_message', async (data: {
            content: string;
            receiverId: string;
            senderId: string;
            conversationId: string;
        }) => {
            const { content, receiverId, senderId, conversationId } = data;

            try {
                // Persist message to DB
                const message = await prisma.message.create({
                    data: {
                        content,
                        senderId,
                        conversationId,
                        status: 'SENT'
                    }
                });

                // Send to receiver if online
                const receiverSocketId = connectedUsers.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('receive_message', message);

                    // Update status to DELIVERED
                    await prisma.message.update({
                        where: { id: message.id },
                        data: { status: 'DELIVERED' }
                    });

                    io.to(senderId).emit('message_status', {
                        messageId: message.id,
                        status: 'DELIVERED'
                    });
                }

                // Send back to sender for confirmation
                io.to(senderId).emit('message_sent', message);

            } catch (error) {
                console.error('Error sending message:', error);
            }
        });

        socket.on('disconnect', async () => {
            let disconnectedUserId: string | null = null;
            for (const [userId, socketId] of connectedUsers.entries()) {
                if (socketId === socket.id) {
                    disconnectedUserId = userId;
                    break;
                }
            }

            if (disconnectedUserId) {
                connectedUsers.delete(disconnectedUserId);
                await prisma.session.updateMany({
                    where: { socketId: socket.id },
                    data: { isActive: false, socketId: null }
                });
                console.log(`User ${disconnectedUserId} disconnected`);
            }
        });
    });
};
