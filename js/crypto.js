/**
 * CRYPTO.JS
 * Handles AES-256 encryption/decryption using CryptoJS
 */

const CryptoModule = (() => {
    /**
     * Encrypts text using AES-256 with CryptoJS
     * @param {string} plaintext - The text to encrypt
     * @param {string} password - The password for encryption
     * @returns {string} - Base64 encoded encrypted data
     */
    function encryptMessage(plaintext, password) {
        try {
            if (!plaintext || !password) {
                throw new Error('Text and password are required');
            }

            console.log('Encrypting message with password...');
            console.log('Plaintext length:', plaintext.length);

            // Encrypt using CryptoJS with AES
            const encrypted = CryptoJS.AES.encrypt(plaintext, password);
            const encryptedStr = encrypted.toString();
            
            console.log('✓ Message encrypted successfully');
            console.log('Encrypted text length:', encryptedStr.length);
            console.log('Encrypted preview:', encryptedStr.substring(0, 50));

            // Return the encrypted text as a string
            return encryptedStr;
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Encryption failed: ' + error.message);
        }
    }

    /**
     * Decrypts text using AES-256 with CryptoJS
     * @param {string} encryptedText - The encrypted text (Base64)
     * @param {string} password - The password for decryption
     * @returns {string} - The decrypted plaintext
     */
    function decryptMessage(encryptedText, password) {
        try {
            if (!encryptedText || !password) {
                throw new Error('Encrypted text and password are required');
            }

            console.log('Decrypting message with password...');
            console.log('Encrypted text length:', encryptedText.length);
            console.log('Encrypted preview:', encryptedText.substring(0, 50));

            // Decrypt using CryptoJS
            const decrypted = CryptoJS.AES.decrypt(encryptedText, password);
            
            // Convert from WordArray to UTF-8 string
            const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
            
            console.log('Decryption attempted. Result length:', plaintext.length);

            // Check if decryption was successful (empty result usually means wrong password)
            if (!plaintext) {
                throw new Error('Decryption failed - wrong password or corrupted data');
            }
            
            console.log('✓ Message decrypted successfully');
            console.log('Plaintext preview:', plaintext.substring(0, 50));

            return plaintext;
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Decryption failed: ' + error.message);
        }
    }

    /**
     * Converts encrypted string to binary representation for hiding
     * Uses Latin1 encoding for lossless byte preservation
     * @param {string} encryptedText - The encrypted text (Base64 string from CryptoJS)
     * @returns {Uint8Array} - Binary data to hide
     */
    function textToBinary(encryptedText) {
        try {
            console.log('Converting encrypted text to binary...');
            console.log('Encrypted text length:', encryptedText.length);
            console.log('Encrypted text preview:', encryptedText.substring(0, 50));

            // Use Latin1 encoding to preserve each character as a single byte
            // This is lossless for Base64 strings
            const bytes = new Uint8Array(encryptedText.length);
            for (let i = 0; i < encryptedText.length; i++) {
                bytes[i] = encryptedText.charCodeAt(i) & 0xFF; // Keep only lowest 8 bits
            }
            
            console.log('✓ Binary conversion complete. Byte array length:', bytes.length);
            console.log('First 20 bytes:', Array.from(bytes.slice(0, 20)));
            
            return bytes;
        } catch (error) {
            console.error('Text to binary conversion error:', error);
            throw new Error('Text conversion failed: ' + error.message);
        }
    }

    /**
     * Converts binary data back to string
     * Reverses the Latin1 encoding used in textToBinary
     * @param {Uint8Array} binaryData - The binary data
     * @returns {string} - The encrypted string (Base64)
     */
    function binaryToText(binaryData) {
        try {
            console.log('Converting binary back to text...');
            console.log('Binary data length:', binaryData.length);
            console.log('First 20 bytes:', Array.from(binaryData.slice(0, 20)));

            // Convert bytes back to Latin1 string
            let text = '';
            for (let i = 0; i < binaryData.length; i++) {
                text += String.fromCharCode(binaryData[i]);
            }
            
            console.log('✓ Text conversion complete. Text length:', text.length);
            console.log('Text preview:', text.substring(0, 50));
            
            return text;
        } catch (error) {
            console.error('Binary to text conversion error:', error);
            throw new Error('Binary conversion failed: ' + error.message);
        }
    }

    /**
     * Generates a hash of a string (for metadata verification)
     * @param {string} text - Text to hash
     * @returns {string} - Hex hash
     */
    function generateHash(text) {
        return CryptoJS.SHA256(text).toString();
    }

    return {
        encryptMessage,
        decryptMessage,
        textToBinary,
        binaryToText,
        generateHash
    };
})();
