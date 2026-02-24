package com.whatsapp.clone.security

import android.util.Base64
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

object CryptoUtils {
    private const val AES_KEY_SIZE = 256
    private const val GCM_IV_LENGTH = 12
    private const val GCM_TAG_LENGTH = 128

    fun encrypt(plainText: String, secretKey: String): String {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val keySpec = SecretKeySpec(secretKey.toByteArray(), "AES")
        val iv = ByteArray(GCM_IV_LENGTH)
        SecureRandom().nextBytes(iv)
        val parameterSpec = GCMParameterSpec(GCM_TAG_LENGTH, iv)
        
        cipher.init(Cipher.ENCRYPT_MODE, keySpec, parameterSpec)
        val cipherText = cipher.doFinal(plainText.toByteArray())
        
        val combined = iv + cipherText
        return Base64.encodeToString(combined, Base64.DEFAULT)
    }

    fun decrypt(cipherText: String, secretKey: String): String {
        val decoded = Base64.decode(cipherText, Base64.DEFAULT)
        val iv = decoded.sliceArray(0 until GCM_IV_LENGTH)
        val encrypted = decoded.sliceArray(GCM_IV_LENGTH until decoded.size)
        
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val keySpec = SecretKeySpec(secretKey.toByteArray(), "AES")
        val parameterSpec = GCMParameterSpec(GCM_TAG_LENGTH, iv)
        
        cipher.init(Cipher.DECRYPT_MODE, keySpec, parameterSpec)
        return String(cipher.doFinal(encrypted))
    }
}
