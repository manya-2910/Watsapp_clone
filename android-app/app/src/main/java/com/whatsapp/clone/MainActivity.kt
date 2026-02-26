package com.whatsapp.clone

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.whatsapp.clone.ui.auth.AuthViewModel
import com.whatsapp.clone.ui.auth.LoginScreen
import com.whatsapp.clone.ui.chat.ChatScreen
import com.whatsapp.clone.ui.chat.ChatViewModel
import com.whatsapp.clone.ui.chatlist.ChatListScreen
import com.whatsapp.clone.ui.chatlist.ChatListViewModel
import com.whatsapp.clone.ui.theme.NHAPPTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            NHAPPTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    val authViewModel: AuthViewModel = hiltViewModel()

                    val currentUser by authViewModel.currentUser.collectAsState(initial = null)

                    NavHost(
                        navController = navController,
                        startDestination = if (currentUser == null) "login" else "chat_list"
                    ) {
                        composable("login") {
                            LoginScreen(
                                viewModel = authViewModel,
                                onAuthenticated = {
                                    navController.navigate("chat_list") {
                                        popUpTo("login") { inclusive = true }
                                    }
                                }
                            )
                        }

                        composable("chat_list") {
                            val chatListViewModel: ChatListViewModel = hiltViewModel()
                            ChatListScreen(
                                viewModel = chatListViewModel,
                                onChatClick = { chatId ->
                                    navController.navigate("chat/$chatId")
                                },
                                onLogout = {
                                    authViewModel.logout()
                                    navController.navigate("login") {
                                        popUpTo(0)
                                    }
                                }
                            )
                        }

                        composable("chat/{chatId}") { backStackEntry ->
                            val chatId = backStackEntry.arguments?.getString("chatId") ?: ""
                            val chatViewModel: ChatViewModel = hiltViewModel()
                            ChatScreen(
                                chatId = chatId,
                                viewModel = chatViewModel,
                                onBack = { navController.popBackStack() }
                            )
                        }
                    }
                }
            }
        }
    }
}
