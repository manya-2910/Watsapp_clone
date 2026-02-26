package com.whatsapp.clone.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.Material3Theme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = LightGreen,
    secondary = DarkGreen,
    tertiary = BlueLink,
    background = DarkBackground,
    surface = DarkSurface,
    onBackground = DarkText,
    onSurface = DarkText
)

private val LightColorScheme = lightColorScheme(
    primary = DarkGreen,
    secondary = LightGreen,
    tertiary = BlueLink,
    background = White,
    surface = White,
    onBackground = Black,
    onSurface = Black
)

@Composable
fun NHAPPTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    androidx.compose.material3.MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
