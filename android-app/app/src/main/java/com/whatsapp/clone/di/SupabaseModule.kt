package com.whatsapp.clone.di

import com.whatsapp.clone.BuildConfig
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import io.github.jan_tennert.supabase.SupabaseClient
import io.github.jan_tennert.supabase.createSupabaseClient
import io.github.jan_tennert.supabase.gotrue.Auth
import io.github.jan_tennert.supabase.postgrest.Postgrest
import io.github.jan_tennert.supabase.realtime.Realtime
import io.github.jan_tennert.supabase.storage.Storage
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object SupabaseModule {

    @Provides
    @Singleton
    fun provideSupabaseClient(): SupabaseClient {
        return createSupabaseClient(
            supabaseUrl = BuildConfig.SUPABASE_URL,
            supabaseKey = BuildConfig.SUPABASE_ANON_KEY
        ) {
            install(Postgrest)
            install(Auth)
            install(Realtime)
            install(Storage)
        }
    }

    @Provides
    @Singleton
    fun provideSupabaseAuth(client: SupabaseClient): Auth = client.pluginManager.getPlugin(Auth)

    @Provides
    @Singleton
    fun provideSupabasePostgrest(client: SupabaseClient): Postgrest = client.pluginManager.getPlugin(Postgrest)

    @Provides
    @Singleton
    fun provideSupabaseRealtime(client: SupabaseClient): Realtime = client.pluginManager.getPlugin(Realtime)

    @Provides
    @Singleton
    fun provideSupabaseStorage(client: SupabaseClient): Storage = client.pluginManager.getPlugin(Storage)

    @Provides
    @Singleton
    fun provideAuthRepository(
        auth: Auth,
        postgrest: Postgrest
    ): com.whatsapp.clone.domain.repository.AuthRepository = 
        com.whatsapp.clone.data.repository.AuthRepositoryImpl(auth, postgrest)

    @Provides
    @Singleton
    fun provideChatRepository(
        auth: Auth,
        postgrest: Postgrest,
        realtime: Realtime
    ): com.whatsapp.clone.domain.repository.ChatRepository = 
        com.whatsapp.clone.data.repository.ChatRepositoryImpl(auth, postgrest, realtime)
}

