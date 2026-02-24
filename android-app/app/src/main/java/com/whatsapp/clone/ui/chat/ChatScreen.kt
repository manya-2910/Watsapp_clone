package com.whatsapp.clone.ui.chat

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.whatsapp.clone.data.local.MessageEntity

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(
    messages: List<MessageEntity>,
    onSendMessage: (String) -> Unit
) {
    var textState by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Chat") })
        },
        bottomBar = {
            Row(modifier = Modifier.padding(8.dp)) {
                TextField(
                    value = textState,
                    onValueChange = { textState = it },
                    modifier = Modifier.weight(1f)
                )
                Button(onClick = {
                    onSendMessage(textState)
                    textState = ""
                }) {
                    Text("Send")
                }
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
        ) {
            items(messages) { message ->
                MessageItem(message)
            }
        }
    }
}

@Composable
fun MessageItem(message: MessageEntity) {
    Card(
        modifier = Modifier
            .padding(8.dp)
            .fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(8.dp)) {
            Text(text = message.content)
            Text(
                text = message.status,
                style = MaterialTheme.typography.labelSmall
            )
        }
    }
}
