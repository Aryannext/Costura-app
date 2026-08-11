// src/services/cryptoService.js

// Funciones utilitarias para Base64
function bufferToBase64(buffer) {
    if (typeof window !== 'undefined' && window.btoa) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    } else {
        // Fallback para Node.js
        return Buffer.from(buffer).toString('base64');
    }
}

function base64ToBuffer(base64) {
    if (typeof window !== 'undefined' && window.atob) {
        const binary = window.atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    } else {
        // Fallback para Node.js
        const buf = Buffer.from(base64, 'base64');
        return new Uint8Array(buf).buffer;
    }
}

const cryptoProvider = typeof window !== 'undefined' && window.crypto ? window.crypto : globalThis.crypto;

export const cryptoService = {
    async deriveKey(password, salt, iterations) {
        const encoder = new TextEncoder();
        const keyMaterial = await cryptoProvider.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );

        return cryptoProvider.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: iterations,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    },

    async encryptBackup(jsonData, password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(jsonData);

        const salt = cryptoProvider.getRandomValues(new Uint8Array(16));
        const iv = cryptoProvider.getRandomValues(new Uint8Array(12));
        const iterations = 600000;

        const key = await this.deriveKey(password, salt, iterations);

        const ciphertextBuffer = await cryptoProvider.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            data
        );

        return JSON.stringify({
            version: 1,
            kdf: "PBKDF2-SHA256",
            iterations: iterations,
            cipher: "AES-256-GCM",
            salt: bufferToBase64(salt),
            iv: bufferToBase64(iv),
            ciphertext: bufferToBase64(ciphertextBuffer)
        }, null, 2);
    },

    async decryptBackup(encryptedObjString, password) {
        let envelope;
        try {
            envelope = JSON.parse(encryptedObjString);
        } catch (e) {
            throw new Error("Formato de archivo inválido. No es un JSON.");
        }

        if (envelope.version !== 1) {
            throw new Error("Versión de respaldo no soportada.");
        }
        if (envelope.cipher !== "AES-256-GCM") {
            throw new Error("Cifrado no soportado.");
        }

        const salt = base64ToBuffer(envelope.salt);
        const iv = base64ToBuffer(envelope.iv);
        const ciphertext = base64ToBuffer(envelope.ciphertext);
        const iterations = envelope.iterations || 600000;

        const key = await this.deriveKey(password, salt, iterations);

        let decryptedBuffer;
        try {
            decryptedBuffer = await cryptoProvider.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                ciphertext
            );
        } catch (e) {
            throw new Error("Contraseña incorrecta o archivo corrupto.");
        }

        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
    }
};
