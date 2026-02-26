package com.whatsapp.clone.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.whatsapp.clone.domain.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val repository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    val currentUser = repository.currentUser

    fun sendOtp(email: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            repository.loginWithEmail(email)
                .onSuccess { _uiState.value = AuthUiState.OtpSent(email) }
                .onFailure { _uiState.value = AuthUiState.Error(it.message ?: "Unknown error") }
        }
    }

    fun verifyOtp(email: String, otp: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            repository.verifyOtp(email, otp)
                .onSuccess { _uiState.value = AuthUiState.Authenticated }
                .onFailure { _uiState.value = AuthUiState.Error(it.message ?: "Invalid OTP") }
        }
    }

    fun logout() {
        viewModelScope.launch {
            repository.logout()
        }
    }
}

sealed class AuthUiState {
    object Idle : AuthUiState()
    object Loading : AuthUiState()
    data class OtpSent(val email: String) : AuthUiState()
    object Authenticated : AuthUiState()
    data class Error(val message: String) : AuthUiState()
}
