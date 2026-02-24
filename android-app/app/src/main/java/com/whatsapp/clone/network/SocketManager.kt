package com.whatsapp.clone.network

import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject
import java.net.URISyntaxException

class SocketManager(private val baseUrl: String) {
    private var socket: Socket? = null

    fun connect(userId: String) {
        try {
            socket = IO.socket(baseUrl)
            socket?.connect()

            socket?.on(Socket.EVENT_CONNECT) {
                socket?.emit("join", userId)
            }

            socket?.on("receive_message") { args ->
                val data = args[0] as JSONObject
                // Handle received message (callback or Flow)
            }
        } catch (e: URISyntaxException) {
            e.printStackTrace()
        }
    }

    fun sendMessage(senderId: String, receiverId: String, content: String, conversationId: String) {
        val messageData = JSONObject().apply {
            put("senderId", senderId)
            put("receiverId", receiverId)
            put("content", content)
            put("conversationId", conversationId)
        }
        socket?.emit("send_message", messageData)
    }

    fun disconnect() {
        socket?.disconnect()
        socket?.off()
    }
}
