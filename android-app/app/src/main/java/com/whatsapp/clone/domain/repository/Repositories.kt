package com.whatsapp.clone.domain.repository

import com.whatsapp.clone.domain.model.Chat
import com.whatsapp.clone.domain.model.Message
import com.whatsapp.clone.domain.model.User
import kotlinx.coroutines.flow.Flow

interface AuthRepository {
    suspend fun loginWithEmail(email: String): Result<Unit>
    suspend fun verifyOtp(email: String, otp: String): Result<Unit>
    suspend fun logout()
    val currentUser: Flow<User?>
}

interface ChatRepository {
    fun getChats(): Flow<List<Chat>>
    fun getMessages(chatId: String): Flow<List<Message>>
    suspend fun sendMessage(chatId: String, content: String): Result<Unit>
    suspend fun createChat(otherUserId: String): Result<String>
    suspend fun getUserProfile(userId: String): Result<User>
    suspend fun updatePresence(isOnline: Boolean)
}
