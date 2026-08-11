import { describe, it, expect } from 'vitest';
import { cryptoService } from '../cryptoService.js';

describe('cryptoService', () => {
    const testPassword = 'MySecretPassword123!';
    const testJson = JSON.stringify({ key: 'value', data: [1, 2, 3] });

    it('JSON -> cifrado -> descifrado = datos originales', async () => {
        const encryptedEnvelope = await cryptoService.encryptBackup(testJson, testPassword);
        const decryptedJson = await cryptoService.decryptBackup(encryptedEnvelope, testPassword);
        expect(decryptedJson).toBe(testJson);
    });

    it('Contraseña incorrecta -> rechazo', async () => {
        const encryptedEnvelope = await cryptoService.encryptBackup(testJson, testPassword);
        await expect(cryptoService.decryptBackup(encryptedEnvelope, 'WrongPassword')).rejects.toThrow('Contraseña incorrecta o archivo corrupto.');
    });

    it('Ciphertext alterado -> rechazo', async () => {
        const encryptedEnvelope = await cryptoService.encryptBackup(testJson, testPassword);
        const envelopeObj = JSON.parse(encryptedEnvelope);

        // Alter ciphertext (last character changed for base64 string)
        let modified = envelopeObj.ciphertext.substring(0, envelopeObj.ciphertext.length - 2) + (envelopeObj.ciphertext.endsWith('A=') ? 'B=' : 'A=');
        envelopeObj.ciphertext = modified;

        await expect(cryptoService.decryptBackup(JSON.stringify(envelopeObj), testPassword)).rejects.toThrow('Contraseña incorrecta o archivo corrupto.');
    });

    it('IV alterado -> rechazo', async () => {
        const encryptedEnvelope = await cryptoService.encryptBackup(testJson, testPassword);
        const envelopeObj = JSON.parse(encryptedEnvelope);

        // Alter IV predictably
        const iv = envelopeObj.iv;
        envelopeObj.iv = iv.substring(0, 5) + (iv[5] === 'A' ? 'B' : 'A') + iv.substring(6);

        await expect(cryptoService.decryptBackup(JSON.stringify(envelopeObj), testPassword)).rejects.toThrow('Contraseña incorrecta o archivo corrupto.');
    });

    it('Salt diferente -> no puede descifrar', async () => {
        const encryptedEnvelope = await cryptoService.encryptBackup(testJson, testPassword);
        const envelopeObj = JSON.parse(encryptedEnvelope);

        // Alter Salt predictably
        const salt = envelopeObj.salt;
        envelopeObj.salt = salt.substring(0, 5) + (salt[5] === 'A' ? 'B' : 'A') + salt.substring(6);

        await expect(cryptoService.decryptBackup(JSON.stringify(envelopeObj), testPassword)).rejects.toThrow('Contraseña incorrecta o archivo corrupto.');
    });

    it('Dos cifrados del mismo JSON con la misma contraseña -> ciphertext diferente', async () => {
        const encrypted1 = JSON.parse(await cryptoService.encryptBackup(testJson, testPassword));
        const encrypted2 = JSON.parse(await cryptoService.encryptBackup(testJson, testPassword));

        expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
        expect(encrypted1.iv).not.toBe(encrypted2.iv);
        expect(encrypted1.salt).not.toBe(encrypted2.salt);
    });

    it('Verificación de que se utilizan 600.000 iteraciones y el formato es compatible', async () => {
        const encryptedEnvelope = await cryptoService.encryptBackup(testJson, testPassword);
        const envelopeObj = JSON.parse(encryptedEnvelope);

        expect(envelopeObj.version).toBe(1);
        expect(envelopeObj.iterations).toBe(600000);
        expect(envelopeObj.cipher).toBe('AES-256-GCM');
        expect(envelopeObj.kdf).toBe('PBKDF2-SHA256');

        expect(envelopeObj.salt).toBeDefined();
        expect(envelopeObj.iv).toBeDefined();
        expect(envelopeObj.ciphertext).toBeDefined();
    });
});
