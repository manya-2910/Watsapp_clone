package com.whatsapp.clone.data.repository

import com.whatsapp.clone.data.model.ChatDto
import com.whatsapp.clone.data.model.ChatMemberDto
import com.whatsapp.clone.data.model.MessageDto
import com.whatsapp.clone.data.model.UserDto
import com.whatsapp.clone.domain.model.Chat
import com.whatsapp.clone.domain.model.Message
import com.whatsapp.clone.domain.model.User
import com.whatsapp.clone.domain.repository.ChatRepository
import io.github.jan_tennert.supabase.gotrue.Auth
import io.github.jan_tennert.supabase.postgrest.Postgrest
import io.github.jan_tennert.supabase.postgrest.query.Columns
import io.github.jan_tennert.supabase.postgrest.query.Order
import io.github.jan_tennert.supabase.realtime.PostgresAction
import io.github.jan_tennert.supabase.realtime.Realtime
import io.github.jan_tennert.supabase.realtime.channel
import io.github.jan_tennert.supabase.realtime.postgresChangeFlow
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.onStart
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ChatRepositoryImpl @Inject constructor(
    private val auth: Auth,
    private val postgrest: Postgrest,
    private val realtime: Realtime
) : ChatRepository {

    override fun getChats(): Flow<List<Chat>> = flow {
        val currentUserId = auth.currentUserOrNull()?.id ?: return@flow
        
        // 1. Get all chat IDs the user belongs to
        val userChats = postgrest["chat_members"].select {
            filter {
                eq("user_id", currentUserId)
            }
        }.decodeList<ChatMemberDto>()
        
        val chatIds = userChats.map { it.chatId }
        
        if (chatIds.isEmpty()) {
            emit(emptyList())
            return@flow
        }

        // 2. Get chat details and other members
        val chats = postgrest["chats"].select {
            filter {
                isIn("id", chatIds)
            }
        }.decodeList<ChatDto>().map { chatDto ->
            // Find the other member in this chat
            val otherMember = postgrest["chat_members"].select {
                filter {
                    eq("chat_id", chatDto.id)
                    neq("user_id", currentUserId)
                }
            }.decodeSingle<ChatMemberDto>()
            
            val otherUserDto = postgrest["users"].select {
                filter {
                    eq("id", otherMember.userId)
                }
            }.decodeSingle<UserDto>()

            Chat(
                id = chatDto.id,
                createdAt = chatDto.createdAt,
                otherUser = User(otherUserDto.id, otherUserDto.name, otherUserDto.avatarUrl)
            )
        }
        
        emit(chats)
    }

    override fun getMessages(chatId: String): Flow<List<Message>> = callbackFlow {
        val currentUserId = auth.currentUserOrNull()?.id ?: ""
        
        // Initial fetch
        val initialMessages = postgrest["messages"].select {
            filter {
                eq("chat_id", chatId)
            }
            order("created_at", Order.ASCENDING)
        }.decodeList<MessageDto>().map { it.toDomain(currentUserId) }
        
        var currentMessages = initialMessages.toMutableList()
        trySend(currentMessages)

        // Realtime subscription
        val channel = realtime.channel("chat:$chatId")
        val changeFlow = channel.postgresChangeFlow<PostgresAction>(schema = "public") {
            table = "messages"
            filter = "chat_id=eq.$chatId"
        }

        channel.subscribe()

        changeFlow.collect { action ->
            when (action) {
                is PostgresAction.Insert -> {
                    val newMessageDto = action.decodeRecord<MessageDto>()
                    currentMessages.add(newMessageDto.toDomain(currentUserId))
                    trySend(currentMessages.toList())
                }
                else -> {} // Handle Update/Delete if needed
            }
        }

        awaitClose {
            channel.unsubscribe()
        }
    }

    override suspend fun sendMessage(chatId: String, content: String): Result<Unit> = runCatching {
        val currentUserId = auth.currentUserOrNull()?.id ?: throw Exception("Not logged in")
        val messageDto = MessageDto(
            chat_id = chatId,
            sender_id = currentUserId,
            content = content
        )
        postgrest["messages"].insert(messageDto)
    }

    override suspend fun createChat(otherUserId: String): Result<String> = runCatching {
        val currentUserId = auth.currentUserOrNull()?.id ?: throw Exception("Not logged in")
        
        // 1. Create chat
        val chatDto = postgrest["chats"].insert(emptyMap<String, String>()) {
            select()
        }.decodeSingle<ChatDto>()
        
        // 2. Add members
        postgrest["chat_members"].insert(listOf(
            ChatMemberDto(chatDto.id, currentUserId),
            ChatMemberDto(chatDto.id, otherUserId)
        ))
        
        chatDto.id
    }

    override suspend fun getUserProfile(userId: String): Result<User> = runCatching {
        val userDto = postgrest["users"].select {
            filter { eq("id", userId) }
        }.decodeSingle<UserDto>()
        User(userDto.id, userDto.name, userDto.avatarUrl)
    }

    override suspend fun updatePresence(isOnline: Boolean) {
        // Implementation using Supabase Realtime Presence
        // For MVP, we'll implement this later in the UI layer with a dedicated service
    }

    private fun MessageDto.toDomain(currentUserId: String) = Message(
        id = id ?: "",
        chatId = chatId,
        senderId = senderId,
        content = content,
        createdAt = createdAt ?: "",
        readAt = readAt,
        isFromMe = senderId == currentUserId
    )
}
