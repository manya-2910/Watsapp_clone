package com.whatsapp.clone.ui.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.whatsapp.clone.domain.model.Message
import com.whatsapp.clone.domain.repository.ChatRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val repository: ChatRepository
) : ViewModel() {

    private val _messages = MutableStateFlow<List<Message>>(emptyList())
    val messages: StateFlow<List<Message>> = _messages.asStateFlow()

    fun loadMessages(chatId: String) {
        viewModelScope.launch {
            repository.getMessages(chatId).collect {
                _messages.value = it
            }
        }
    }

    fun sendMessage(chatId: String, content: String) {
        if (content.isBlank()) return
        viewModelScope.launch {
            repository.sendMessage(chatId, content)
        }
    }
}
