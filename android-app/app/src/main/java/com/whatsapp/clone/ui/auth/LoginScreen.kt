package com.whatsapp.clone.ui.auth

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun LoginScreen(
    viewModel: AuthViewModel,
    onAuthenticated: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var email by remember { mutableStateOf("") }
    var otp by remember { mutableStateOf("") }

    LaunchedEffect(uiState) {
        if (uiState is AuthUiState.Authenticated) {
            onAuthenticated()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Welcome to NHAPP",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.height(32.dp))

        when (val state = uiState) {
            is AuthUiState.Idle, is AuthUiState.Error -> {
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Enter Email") },
                    modifier = Modifier.fillMaxWidth()
                )
                if (state is AuthUiState.Error) {
                    Text(text = state.message, color = MaterialTheme.colorScheme.error)
                }
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = { viewModel.sendOtp(email) },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Get Started")
                }
            }
            is AuthUiState.OtpSent -> {
                Text("Enter OTP sent to ${state.email}")
                Spacer(modifier = Modifier.height(16.dp))
                OutlinedTextField(
                    value = otp,
                    onValueChange = { otp = it },
                    label = { Text("OTP") },
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = { viewModel.verifyOtp(state.email, otp) },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Verify")
                }
            }
            is AuthUiState.Loading -> {
                CircularProgressIndicator()
            }
            else -> {}
        }
    }
}
