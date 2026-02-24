package com.whatsapp.clone.data.local

import androidx.room.*
import java.util.*

@Entity(tableName = "messages")
data class MessageEntity(
    @PrimaryKey val id: String,
    val content: String,
    val senderId: String,
    val conversationId: String,
    val timestamp: Long,
    val status: String // SENT, DELIVERED, READ
)
