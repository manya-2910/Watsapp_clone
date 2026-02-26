package com.whatsapp.clone.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class UserDto(
    @SerialName("id") val id: String,
    @SerialName("name") val name: String? = null,
    @SerialName("avatar_url") val avatarUrl: String? = null,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class ChatDto(
    @SerialName("id") val id: String,
    @SerialName("created_at") val createdAt: String
)

@Serializable
data class ChatMemberDto(
    @SerialName("chat_id") val chatId: String,
    @SerialName("user_id") val userId: String
)

@Serializable
data class MessageDto(
    @SerialName("id") val id: String? = null,
    @SerialName("chat_id") val chatId: String,
    @SerialName("sender_id") val senderId: String,
    @SerialName("content") val content: String,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("read_at") val readAt: String? = null
)
