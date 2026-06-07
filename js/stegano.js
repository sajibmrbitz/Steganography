/**
 * STEGANO.JS
 * Handles LSB (Least Significant Bit) Steganography for audio files
 */

const SteganographyModule = (() => {
    const HEADER_SIZE = 32; // 4 bytes for message length (32-bit unsigned int)
    const MAGIC_NUMBER = 0xDEADBEEF; // 4-byte magic to validate extraction
    const BITS_PER_SAMPLE = 1; // Number of bits to use per audio sample

    /**
     * Reads a WAV file and extracts audio samples
     * @param {ArrayBuffer} arrayBuffer - The WAV file data
     * @returns {object} - Contains audioData (Float32Array), sampleRate, and channels
     */
    function readWAVFile(arrayBuffer) {
        try {
            const view = new DataView(arrayBuffer);
            
            console.log('Validating WAV file...');
            console.log('First 4 bytes (hex):', 
                '0x' + view.getUint8(0).toString(16).padStart(2, '0') +
                '0x' + view.getUint8(1).toString(16).padStart(2, '0') +
                '0x' + view.getUint8(2).toString(16).padStart(2, '0') +
                '0x' + view.getUint8(3).toString(16).padStart(2, '0')
            );

            // Check RIFF header (little-endian)
            const riffHeader = view.getUint32(0, true); // true = little-endian
            console.log('RIFF header read as:', '0x' + riffHeader.toString(16));
            
            if (riffHeader !== 0x46464952) { // 'RIFF' in little-endian
                console.error('Invalid RIFF header. Expected 0x46464952, got 0x' + riffHeader.toString(16));
                throw new Error('Not a valid WAV file - Invalid RIFF header');
            }

            console.log('✓ RIFF header valid');

            // Find the fmt chunk
            let fmtOffset = 12;
            let dataOffset = 0;
            let dataLength = 0;

            while (fmtOffset < arrayBuffer.byteLength) {
                const chunkId = view.getUint32(fmtOffset, true); // true = little-endian
                const chunkSize = view.getUint32(fmtOffset + 4, true);

                console.log('Chunk ID at offset', fmtOffset + ':', '0x' + chunkId.toString(16));

                if (chunkId === 0x20746d66) { // 'fmt ' in little-endian
                    console.log('✓ Found fmt chunk');
                    const audioFormat = view.getUint16(fmtOffset + 8, true);
                    const channels = view.getUint16(fmtOffset + 10, true);
                    const sampleRate = view.getUint32(fmtOffset + 12, true);
                    const byteRate = view.getUint32(fmtOffset + 16, true);
                    const blockAlign = view.getUint16(fmtOffset + 20, true);
                    const bitsPerSample = view.getUint16(fmtOffset + 22, true);

                    console.log('Audio format:', audioFormat, 'Channels:', channels, 'Sample rate:', sampleRate, 'Bits:', bitsPerSample);

                    if (audioFormat !== 1) {
                        throw new Error('Only PCM WAV files are supported');
                    }

                    // Extract audio samples
                    const samples = extractSamples(arrayBuffer, bitsPerSample, channels, blockAlign);

                    return {
                        samples,
                        sampleRate,
                        channels,
                        bitsPerSample,
                        arrayBuffer
                    };
                }

                fmtOffset += 8 + chunkSize;
            }

            throw new Error('Could not find fmt chunk in WAV file');
        } catch (error) {
            console.error('WAV read error:', error);
            throw new Error('Failed to read WAV file: ' + error.message);
        }
    }

    /**
     * Extracts audio samples from WAV file data
     * @param {ArrayBuffer} arrayBuffer - Raw WAV data
     * @param {number} bitsPerSample - Bits per sample (8, 16, 24, 32)
     * @param {number} channels - Number of channels
     * @param {number} blockAlign - Block alignment
     * @returns {Int32Array} - All samples as 32-bit integers
     */
    function extractSamples(arrayBuffer, bitsPerSample, channels, blockAlign) {
        const view = new DataView(arrayBuffer);
        let dataOffset = 0;

        // Find data chunk
        let offset = 12;
        while (offset < arrayBuffer.byteLength) {
            const chunkId = view.getUint32(offset, true); // true = little-endian
            const chunkSize = view.getUint32(offset + 4, true);

            console.log('Searching for data chunk. Found at offset', offset + ':', '0x' + chunkId.toString(16));

            if (chunkId === 0x61746164) { // 'data' in little-endian
                console.log('✓ Found data chunk at offset', offset);
                dataOffset = offset + 8;
                break;
            }

            offset += 8 + chunkSize;
        }

        if (dataOffset === 0) {
            throw new Error('Could not find data chunk in WAV file');
        }

        const numSamples = (arrayBuffer.byteLength - dataOffset) / blockAlign;
        console.log('Extracting', numSamples, 'samples');
        const samples = new Int32Array(numSamples * channels);
        let sampleIndex = 0;

        for (let i = 0; i < numSamples; i++) {
            for (let ch = 0; ch < channels; ch++) {
                const byteOffset = dataOffset + i * blockAlign + ch * (bitsPerSample / 8);

                let sample = 0;
                if (bitsPerSample === 8) {
                    sample = view.getUint8(byteOffset) - 128;
                } else if (bitsPerSample === 16) {
                    sample = view.getInt16(byteOffset, true);
                } else if (bitsPerSample === 24) {
                    sample = view.getInt8(byteOffset + 2) << 16 |
                            view.getUint8(byteOffset + 1) << 8 |
                            view.getUint8(byteOffset);
                } else if (bitsPerSample === 32) {
                    sample = view.getInt32(byteOffset, true);
                }

                samples[sampleIndex++] = sample;
            }
        }

        return samples;
    }

    /**
     * Encodes a message into audio samples using LSB steganography
     * Format: [4-byte magic] [4-byte length] [N-byte message]
     * @param {Int32Array} samples - Audio samples
     * @param {Uint8Array} messageData - Binary message data to hide
     * @returns {Int32Array} - Modified samples with hidden message
     */
    function encodeMessage(samples, messageData) {
        try {
            console.log('Starting message encoding...');
            console.log('Total samples:', samples.length);
            console.log('Message data size:', messageData.length, 'bytes');
            console.log('Message data preview:', Array.from(messageData.slice(0, 20)));

            // Create a copy of samples to avoid modifying original
            const modifiedSamples = new Int32Array(samples);
            
            // Prepare total data: magic (4) + length (4) + message (N)
            const messageLength = messageData.length;
            const totalBits = (64 + messageLength * 8); // 4 bytes magic + 4 bytes length + message

            console.log('Message length:', messageLength, 'bytes');
            console.log('Total bits to encode:', totalBits, '(magic + length + message)');
            console.log('Available bits:', modifiedSamples.length * BITS_PER_SAMPLE);

            // Check if message fits
            if (totalBits > modifiedSamples.length * BITS_PER_SAMPLE) {
                throw new Error(
                    `Message too large. Max size: ${Math.floor(modifiedSamples.length * BITS_PER_SAMPLE / 8) - 8} bytes`
                );
            }

            let bitIndex = 0;

            // Encode magic number (32-bit, 0xDEADBEEF)
            console.log('Encoding 32-bit magic number (0xDEADBEEF)...');
            for (let i = 31; i >= 0; i--) {
                const bit = (MAGIC_NUMBER >> i) & 1;
                setSampleBit(modifiedSamples, bitIndex, bit);
                bitIndex++;
            }

            // Encode message length (32-bit header)
            console.log('Encoding 32-bit message length header...');
            for (let i = 31; i >= 0; i--) {
                const bit = (messageLength >> i) & 1;
                setSampleBit(modifiedSamples, bitIndex, bit);
                bitIndex++;
            }

            // Encode message bytes
            console.log('Encoding', messageData.length, 'message bytes...');
            for (let i = 0; i < messageData.length; i++) {
                const byte = messageData[i];
                for (let j = 7; j >= 0; j--) {
                    const bit = (byte >> j) & 1;
                    setSampleBit(modifiedSamples, bitIndex, bit);
                    bitIndex++;
                }
            }

            console.log('✓ Message encoding complete. Total bits encoded:', bitIndex);
            return modifiedSamples;
        } catch (error) {
            console.error('Encoding error:', error);
            throw new Error('Failed to encode message: ' + error.message);
        }
    }

    /**
     * Decodes a message from audio samples using LSB steganography
     * Validates magic number to ensure proper extraction
     * @param {Int32Array} samples - Audio samples with hidden message
     * @returns {Uint8Array} - Extracted binary message data
     */
    function decodeMessage(samples) {
        try {
            console.log('Starting message decoding...');
            console.log('Total samples available:', samples.length);
            console.log('Available bits:', samples.length * BITS_PER_SAMPLE);

            let bitIndex = 0;

            // Decode and verify magic number (32-bit)
            console.log('Decoding 32-bit magic number...');
            let magicNumber = 0;
            for (let i = 0; i < 32; i++) {
                const bit = getSampleBit(samples, bitIndex);
                magicNumber = (magicNumber << 1) | bit;
                bitIndex++;
            }
            
            // Convert to unsigned 32-bit integer (JavaScript quirk: bitwise ops are signed)
            magicNumber = magicNumber >>> 0;

            console.log('Decoded magic number: 0x' + magicNumber.toString(16).toUpperCase());
            console.log('Expected magic number: 0x' + MAGIC_NUMBER.toString(16).toUpperCase());
            
            // Verify magic number (both as unsigned)
            const expectedMagic = MAGIC_NUMBER >>> 0;
            if (magicNumber !== expectedMagic) {
                console.error('❌ Magic number mismatch! Expected 0x' + expectedMagic.toString(16).toUpperCase() + ', got 0x' + magicNumber.toString(16).toUpperCase());
                throw new Error(`Invalid hidden message detected. Magic number mismatch (expected 0xDEADBEEF, got 0x${magicNumber.toString(16).toUpperCase()}). This file may not contain a valid hidden message or the extraction is corrupted.`);
            }

            console.log('✓ Magic number verified (0xDEADBEEF)');

            // Decode message length (32-bit header)
            console.log('Decoding 32-bit message length header...');
            let messageLength = 0;
            for (let i = 0; i < HEADER_SIZE; i++) {
                const bit = getSampleBit(samples, bitIndex);
                messageLength = (messageLength << 1) | bit;
                bitIndex++;
            }

            console.log('Decoded message length:', messageLength, 'bytes');

            // Validate message length
            if (messageLength < 1 || messageLength > 100000) {
                console.error('Invalid message length detected:', messageLength);
                throw new Error(`Invalid message length detected: ${messageLength}. The audio file may be corrupted or the password is incorrect.`);
            }

            console.log('Message length is valid. Proceeding to decode', messageLength, 'bytes...');

            // Decode message bytes
            const messageData = new Uint8Array(messageLength);
            for (let i = 0; i < messageLength; i++) {
                let byte = 0;
                for (let j = 0; j < 8; j++) {
                    const bit = getSampleBit(samples, bitIndex);
                    byte = (byte << 1) | bit;
                    bitIndex++;
                }
                messageData[i] = byte;
            }

            console.log('✓ Message decoding complete. Total bits decoded:', bitIndex);
            console.log('Message data preview:', Array.from(messageData.slice(0, 20)));

            return messageData;
        } catch (error) {
            console.error('Decoding error:', error);
            throw new Error('Failed to decode message: ' + error.message);
        }
    }

    /**
     * Sets a bit in a sample using LSB technique
     * @param {Int32Array} samples - Audio samples
     * @param {number} bitIndex - Global bit index
     * @param {number} bit - Bit value (0 or 1)
     */
    function setSampleBit(samples, bitIndex, bit) {
        const sampleIndex = Math.floor(bitIndex / BITS_PER_SAMPLE);
        
        if (sampleIndex >= samples.length) {
            throw new Error('Not enough samples to encode message');
        }

        // Clear the LSB and set it to our bit
        samples[sampleIndex] = (samples[sampleIndex] & ~1) | (bit & 1);
    }

    /**
     * Gets a bit from a sample using LSB technique
     * @param {Int32Array} samples - Audio samples
     * @param {number} bitIndex - Global bit index
     * @returns {number} - Bit value (0 or 1)
     */
    function getSampleBit(samples, bitIndex) {
        const sampleIndex = Math.floor(bitIndex / BITS_PER_SAMPLE);
        
        if (sampleIndex >= samples.length) {
            throw new Error('Not enough samples to decode message');
        }

        // Extract the LSB
        return samples[sampleIndex] & 1;
    }

    /**
     * Calculates maximum message size that can fit in audio
     * Accounts for: 4-byte magic + 4-byte length header
     * @param {Int32Array} samples - Audio samples
     * @returns {number} - Maximum message size in bytes
     */
    function getMaxMessageSize(samples) {
        // Reserve 64 bits for magic (32 bits) + length header (32 bits), rest for message
        const totalBits = samples.length * BITS_PER_SAMPLE;
        const availableBits = totalBits - 64; // 8 bytes reserved
        return Math.floor(availableBits / 8);
    }

    /**
     * Reconstructs a WAV file from modified samples
     * @param {object} wavData - Original WAV data from readWAVFile
     * @param {Int32Array} modifiedSamples - Modified audio samples
     * @returns {ArrayBuffer} - New WAV file as ArrayBuffer
     */
    function writeWAVFile(wavData, modifiedSamples) {
        try {
            const { arrayBuffer, channels, bitsPerSample } = wavData;
            const blockAlign = (bitsPerSample / 8) * channels;
            
            // Create a copy of the original array buffer
            const newArrayBuffer = arrayBuffer.slice(0);
            const view = new DataView(newArrayBuffer);

            // Find data chunk offset
            let dataOffset = 0;
            let offset = 12;
            while (offset < newArrayBuffer.byteLength) {
                const chunkId = view.getUint32(offset, true); // true = little-endian
                const chunkSize = view.getUint32(offset + 4, true);

                if (chunkId === 0x61746164) { // 'data' in little-endian
                    dataOffset = offset + 8;
                    break;
                }

                offset += 8 + chunkSize;
            }

            if (dataOffset === 0) {
                throw new Error('Could not find data chunk in WAV file');
            }

            // Write modified samples back
            let sampleIndex = 0;
            const numSamples = modifiedSamples.length / channels;

            for (let i = 0; i < numSamples; i++) {
                for (let ch = 0; ch < channels; ch++) {
                    const byteOffset = dataOffset + i * blockAlign + ch * (bitsPerSample / 8);
                    const sample = modifiedSamples[sampleIndex++];

                    if (bitsPerSample === 8) {
                        view.setUint8(byteOffset, sample + 128);
                    } else if (bitsPerSample === 16) {
                        view.setInt16(byteOffset, sample, true);
                    } else if (bitsPerSample === 24) {
                        view.setInt8(byteOffset + 2, (sample >> 16) & 0xFF);
                        view.setUint8(byteOffset + 1, (sample >> 8) & 0xFF);
                        view.setUint8(byteOffset, sample & 0xFF);
                    } else if (bitsPerSample === 32) {
                        view.setInt32(byteOffset, sample, true);
                    }
                }
            }

            return newArrayBuffer;
        } catch (error) {
            console.error('WAV write error:', error);
            throw new Error('Failed to write WAV file: ' + error.message);
        }
    }

    return {
        readWAVFile,
        encodeMessage,
        decodeMessage,
        getMaxMessageSize,
        writeWAVFile
    };
})();
