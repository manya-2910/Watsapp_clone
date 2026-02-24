package com.whatsapp.clone

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import com.whatsapp.clone.ui.chat.ChatScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface {
                    ChatScreen(
                        messages = emptyList(),
                        onSendMessage = { /* Logic to send message via SocketManager */ }
                    )
                }
            }
        }
    }
}
