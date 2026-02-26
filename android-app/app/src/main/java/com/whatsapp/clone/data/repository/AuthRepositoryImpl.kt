package com.whatsapp.clone.data.repository

import com.whatsapp.clone.data.model.UserDto
import com.whatsapp.clone.domain.model.User
import com.whatsapp.clone.domain.repository.AuthRepository
import io.github.jan_tennert.supabase.gotrue.Auth
import io.github.jan_tennert.supabase.gotrue.SessionStatus
import io.github.jan_tennert.supabase.gotrue.otp.OtpType
import io.github.jan_tennert.supabase.gotrue.providers.builtin.OTP
import io.github.jan_tennert.supabase.postgrest.Postgrest
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val auth: Auth,
    private val postgrest: Postgrest
) : AuthRepository {

    override suspend fun loginWithEmail(email: String): Result<Unit> = runCatching {
        auth.signInWith(OTP) {
            this.email = email
            createUser = true
        }
    }

    override suspend fun verifyOtp(email: String, otp: String): Result<Unit> = runCatching {
        auth.verifyOtpByType(
            type = OtpType.Email.MAGIC_LINK, // Or OtpType.Email.OTP depending on Supabase config
            email = email,
            token = otp
        )
    }

    override suspend fun logout() {
        auth.signOut()
    }

    override val currentUser: Flow<User?> = auth.sessionStatus.map { status ->
        when (status) {
            is SessionStatus.Authenticated -> {
                val user = status.session.user
                User(
                    id = user?.id ?: "",
                    name = user?.userMetadata?.get("name")?.toString(),
                    avatarUrl = user?.userMetadata?.get("avatar_url")?.toString()
                )
            }
            else -> null
        }
    }
}
