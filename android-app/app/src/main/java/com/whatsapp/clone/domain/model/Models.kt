package com.whatsapp.clone.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class User(
    val id: String,
    val name: String?,
    val avatarUrl: String?,
    val createdAt: String? = null
)

@Serializable
data class Chat(
    val id: String,
    val createdAt: String,
    val lastMessage: Message? = null,
    val otherUser: User? = null
)

@Serializable
data class Message(
    val id: String,
    val chatId: String,
    val senderId: String,
    val content: String,
    val createdAt: String,
    val readAt: String? = null,
    val isFromMe: Boolean = false
)
