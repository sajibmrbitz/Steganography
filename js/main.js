/**
 * MAIN.JS
 * Main application logic orchestrating UI and steganography operations
 */

class AudioSteganographyApp {
    constructor() {
        this.encodeAudioFile = null;
        this.decodeAudioFile = null;
        this.encodeWAVData = null;
        this.decodeWAVData = null;
        
        this.initializeEventListeners();
    }

    /**
     * Initialize all event listeners
     */
    initializeEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.closest('.tab-btn')));
        });

        // ENCODE TAB
        const dragDropZone = document.getElementById('dragDropZone');
        dragDropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        dragDropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        dragDropZone.addEventListener('drop', (e) => this.handleDrop(e, 'encode'));
        dragDropZone.addEventListener('click', () => document.getElementById('audioFileInput').click());

        document.getElementById('audioFileInput').addEventListener('change', (e) => this.handleFileSelect(e, 'encode'));
        document.getElementById('changeFileBtn').addEventListener('click', () => document.getElementById('audioFileInput').click());

        // Use sample music button
        document.getElementById('useSampleBtn').addEventListener('click', () => this.loadSampleMusic('encode'));

        // Secret message input
        document.getElementById('secretMessage').addEventListener('input', (e) => this.updateCharCounter(e.target));

        // Password visibility toggles
        document.getElementById('toggleEncodePassword').addEventListener('click', () => 
            this.togglePasswordVisibility('encodePassword')
        );

        // Encode button
        document.getElementById('encodeBtn').addEventListener('click', () => this.performEncoding());

        // DECODE TAB
        const dragDropZoneDecode = document.getElementById('dragDropZoneDecode');
        dragDropZoneDecode.addEventListener('dragover', (e) => this.handleDragOver(e));
        dragDropZoneDecode.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        dragDropZoneDecode.addEventListener('drop', (e) => this.handleDrop(e, 'decode'));
        dragDropZoneDecode.addEventListener('click', () => document.getElementById('decodeAudioFileInput').click());

        document.getElementById('decodeAudioFileInput').addEventListener('change', (e) => this.handleFileSelect(e, 'decode'));
        document.getElementById('changeDecodeFileBtn').addEventListener('click', () => document.getElementById('decodeAudioFileInput').click());

        // Password visibility toggle for decode
        document.getElementById('toggleDecodePassword').addEventListener('click', () => 
            this.togglePasswordVisibility('decodePassword')
        );

        // Decode button
        document.getElementById('decodeBtn').addEventListener('click', () => this.performDecoding());

        // Copy and clear buttons
        document.getElementById('copyMessageBtn').addEventListener('click', () => this.copyToClipboard());
        document.getElementById('clearDecodeBtn').addEventListener('click', () => this.clearDecodeResults());
    }

    /**
     * Switch between tabs
     */
    switchTab(tabBtn) {
        // Remove active class from all tabs
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // Add active class to selected tab
        tabBtn.classList.add('active');
        const tabId = tabBtn.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    }

    /**
     * Handle drag over
     */
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        const zone = e.currentTarget;
        zone.classList.add('drag-over');
    }

    /**
     * Handle drag leave
     */
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        const zone = e.currentTarget;
        zone.classList.remove('drag-over');
    }

    /**
     * Handle file drop
     */
    handleDrop(e, mode) {
        e.preventDefault();
        e.stopPropagation();
        const zone = e.currentTarget;
        zone.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'audio/wav' || file.name.endsWith('.wav')) {
                this.processFile(file, mode);
            } else {
                this.showToast('Please drag a .wav file', 'error');
            }
        }
    }

    /**
     * Handle file selection from input
     */
    handleFileSelect(e, mode) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file, mode);
        }
    }

    /**
     * Process selected file
     * Strictly reads file as ArrayBuffer using FileReader API
     */
    processFile(file, mode) {
        // Validate file type
        if (file.type !== 'audio/wav' && !file.name.endsWith('.wav')) {
            this.showToast('Please select a valid .wav file', 'error');
            return;
        }

        // Use FileReader to convert File to ArrayBuffer
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                // Extract ArrayBuffer from FileReader result
                const arrayBuffer = event.target.result;
                console.log('File loaded as ArrayBuffer successfully');
                console.log('ArrayBuffer size:', arrayBuffer.byteLength, 'bytes');

                // Validate ArrayBuffer is not empty
                if (!arrayBuffer || arrayBuffer.byteLength === 0) {
                    throw new Error('File is empty or invalid');
                }

                // Parse WAV file
                const wavData = SteganographyModule.readWAVFile(arrayBuffer);
                console.log('WAV file parsed successfully');
                console.log('Samples:', wavData.samples.length, 'Sample Rate:', wavData.sampleRate, 'Channels:', wavData.channels);

                // Update UI only AFTER ArrayBuffer is fully processed
                if (mode === 'encode') {
                    this.encodeAudioFile = file;
                    this.encodeWAVData = wavData;

                    // Hide drag-drop, show file info
                    document.getElementById('dragDropZone').style.display = 'none';
                    document.getElementById('fileInfo').style.display = 'flex';
                    document.getElementById('fileName').textContent = file.name;
                    document.getElementById('fileSize').textContent = `${(file.size / 1024).toFixed(2)} KB`;

                    // Update max characters based on audio capacity
                    const maxSize = SteganographyModule.getMaxMessageSize(wavData.samples);
                    document.getElementById('maxChars').textContent = maxSize;
                    console.log('Max message size:', maxSize, 'bytes');

                    this.showToast(`✅ ${file.name} is ready! Max message: ${maxSize} bytes`, 'success');

                } else if (mode === 'decode') {
                    this.decodeAudioFile = file;
                    this.decodeWAVData = wavData;

                    // Hide drag-drop, show file info
                    document.getElementById('dragDropZoneDecode').style.display = 'none';
                    document.getElementById('decodeFileInfo').style.display = 'flex';
                    document.getElementById('decodeFileName').textContent = file.name;
                    document.getElementById('decodeFileSize').textContent = `${(file.size / 1024).toFixed(2)} KB`;
                    console.log('Max message size:', SteganographyModule.getMaxMessageSize(wavData.samples), 'bytes');

                    this.showToast(`✅ ${file.name} is ready!`, 'success');
                }

            } catch (error) {
                console.error('Error processing ArrayBuffer:', error);
                this.showToast('❌ Error: ' + error.message, 'error');
            }
        };

        reader.onerror = (error) => {
            console.error('FileReader error:', error);
            this.showToast('❌ Failed to read file', 'error');
        };

        reader.onabort = () => {
            console.warn('FileReader read aborted');
            this.showToast('⚠️ File reading was cancelled', 'warning');
        };

        // Start reading file as ArrayBuffer
        console.log('Starting FileReader for:', file.name);
        reader.readAsArrayBuffer(file);
    }

    /**
     * Load sample music demo file
     * Strictly uses fetch → arrayBuffer conversion (direct path)
     */
    loadSampleMusic(mode) {
        console.log('Loading sample music for mode:', mode);

        try {
            fetch('assets/demo1.wav')
                .then(response => {
                    console.log('Fetch response received. Status:', response.status);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    
                    // Convert response directly to ArrayBuffer
                    return response.arrayBuffer();
                })
                .then(arrayBuffer => {
                    console.log('✓ File loaded as ArrayBuffer successfully');
                    console.log('ArrayBuffer size:', arrayBuffer.byteLength, 'bytes');

                    // Validate ArrayBuffer
                    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
                        throw new Error('ArrayBuffer is empty or invalid');
                    }

                    // Parse WAV file
                    const wavData = SteganographyModule.readWAVFile(arrayBuffer);
                    console.log('✓ WAV file parsed successfully');
                    console.log('Samples:', wavData.samples.length, 'Sample Rate:', wavData.sampleRate, 'Channels:', wavData.channels);

                    // Store the parsed data directly
                    if (mode === 'encode') {
                        // Create minimal File object for reference only
                        const dummyFile = new File([], 'demo1.wav', { type: 'audio/wav' });
                        this.encodeAudioFile = dummyFile;
                        this.encodeWAVData = wavData;

                        // Hide drag-drop, show file info
                        document.getElementById('dragDropZone').style.display = 'none';
                        document.getElementById('fileInfo').style.display = 'flex';
                        document.getElementById('fileName').textContent = 'demo1.wav';
                        document.getElementById('fileSize').textContent = `${(arrayBuffer.byteLength / 1024).toFixed(2)} KB`;

                        // Update max characters
                        const maxSize = SteganographyModule.getMaxMessageSize(wavData.samples);
                        document.getElementById('maxChars').textContent = maxSize;
                        console.log('✓ Max message size:', maxSize, 'bytes');

                        this.showToast(`✅ demo1.wav is ready! Max message: ${maxSize} bytes`, 'success');
                    }
                })
                .catch(error => {
                    console.error('❌ Error loading sample music:', error);
                    this.showToast('❌ Failed to load sample music: ' + error.message, 'error');
                });
        } catch (error) {
            console.error('❌ Error in loadSampleMusic:', error);
            this.showToast('❌ Error: ' + error.message, 'error');
        }
    }

    /**
     * Update character counter
     */
    updateCharCounter(textarea) {
        const count = textarea.value.length;
        document.getElementById('charCount').textContent = count;
    }

    /**
     * Toggle password visibility
     */
    togglePasswordVisibility(inputId) {
        const input = document.getElementById(inputId);
        const btn = event.currentTarget;

        if (input.type === 'password') {
            input.type = 'text';
            btn.textContent = '🙈';
        } else {
            input.type = 'password';
            btn.textContent = '👁️';
        }
    }

    /**
     * Perform encoding operation
     */
    async performEncoding() {
        try {
            // Validate inputs
            if (!this.encodeAudioFile) {
                this.showToast('Please select an audio file', 'error');
                return;
            }

            const secretMessage = document.getElementById('secretMessage').value.trim();
            if (!secretMessage) {
                this.showToast('Please enter a secret message', 'error');
                return;
            }

            const password = document.getElementById('encodePassword').value;
            if (!password) {
                this.showToast('Please enter a password', 'error');
                return;
            }

            // Disable button during processing
            const encodeBtn = document.getElementById('encodeBtn');
            encodeBtn.disabled = true;

            // Show progress
            document.getElementById('encodeProgress').style.display = 'block';
            this.updateProgress('encodeProgressFill', 0);
            document.getElementById('encodeProgressText').textContent = 'Encrypting message...';

            // Encrypt the message
            await this.sleep(100);
            const encryptedMessage = CryptoModule.encryptMessage(secretMessage, password);
            this.updateProgress('encodeProgressFill', 30);

            // Convert to binary
            await this.sleep(100);
            document.getElementById('encodeProgressText').textContent = 'Converting to binary...';
            const binaryData = CryptoModule.textToBinary(encryptedMessage);
            this.updateProgress('encodeProgressFill', 50);

            // Encode into audio
            await this.sleep(100);
            document.getElementById('encodeProgressText').textContent = 'Hiding in audio...';
            const modifiedSamples = SteganographyModule.encodeMessage(this.encodeWAVData.samples, binaryData);
            this.updateProgress('encodeProgressFill', 70);

            // Generate new WAV file
            await this.sleep(100);
            document.getElementById('encodeProgressText').textContent = 'Generating WAV file...';
            const newWAVBuffer = SteganographyModule.writeWAVFile(this.encodeWAVData, modifiedSamples);
            this.updateProgress('encodeProgressFill', 100);

            // Download the file
            await this.sleep(200);
            this.downloadFile(newWAVBuffer, 'steganographed_' + this.encodeAudioFile.name);

            // Success message
            this.showToast('✨ Message hidden successfully! Download started.', 'success');

            // Reset form
            await this.sleep(500);
            this.resetEncodeForm();

        } catch (error) {
            console.error('Encoding error:', error);
            this.showToast(error.message, 'error');
        } finally {
            document.getElementById('encodeBtn').disabled = false;
            document.getElementById('encodeProgress').style.display = 'none';
        }
    }

    /**
     * Perform decoding operation
     */
    async performDecoding() {
        try {
            // Validate inputs
            if (!this.decodeAudioFile) {
                this.showToast('Please select an audio file', 'error');
                return;
            }

            const password = document.getElementById('decodePassword').value;
            if (!password) {
                this.showToast('Please enter a password', 'error');
                return;
            }

            // Disable button during processing
            const decodeBtn = document.getElementById('decodeBtn');
            decodeBtn.disabled = true;

            // Show progress
            document.getElementById('decodeProgress').style.display = 'block';
            this.updateProgress('decodeProgressFill', 0);
            document.getElementById('decodeProgressText').textContent = 'Extracting from audio...';

            // Extract binary data from audio
            console.log('=== DECODING START ===');
            await this.sleep(100);
            console.log('Decoding step 1: Extracting binary from LSB (with magic verification)...');
            const binaryData = SteganographyModule.decodeMessage(this.decodeWAVData.samples);
            console.log('✓ Binary extracted and verified. Length:', binaryData.length, 'bytes');
            this.updateProgress('decodeProgressFill', 40);

            // Validate extracted data
            if (!binaryData || binaryData.length === 0) {
                throw new Error('No hidden message found in the audio file');
            }

            // Convert binary to text
            await this.sleep(100);
            document.getElementById('decodeProgressText').textContent = 'Converting from binary...';
            console.log('Decoding step 2: Converting binary to encrypted text...');
            const encryptedMessage = CryptoModule.binaryToText(binaryData);
            console.log('✓ Text converted. Length:', encryptedMessage.length);
            console.log('Encrypted message preview:', encryptedMessage.substring(0, 50));
            this.updateProgress('decodeProgressFill', 70);

            // Validate encrypted message
            if (!encryptedMessage || encryptedMessage.length === 0) {
                throw new Error('Failed to recover encrypted message from audio');
            }

            // Decrypt the message
            await this.sleep(100);
            document.getElementById('decodeProgressText').textContent = 'Decrypting message...';
            console.log('Decoding step 3: Decrypting with password...');
            const secretMessage = CryptoModule.decryptMessage(encryptedMessage, password);
            console.log('✓ Message decrypted. Length:', secretMessage.length);
            console.log('Decrypted message preview:', secretMessage.substring(0, 50));
            console.log('=== DECODING SUCCESS ===');
            this.updateProgress('decodeProgressFill', 100);

            // Display extracted message
            await this.sleep(300);
            this.displayExtractedMessage(secretMessage);
            this.showToast('🔓 Message extracted successfully!', 'success');

        } catch (error) {
            console.error('❌ Decoding error:', error);
            console.log('=== DECODING FAILED ===');
            
            // Provide more specific error messages
            let userMessage = error.message;
            if (error.message.includes('Magic number')) {
                userMessage = '❌ This file does not contain a valid hidden message. Make sure you\'re uploading the correct steganographed file.';
            } else if (error.message.includes('Decryption failed')) {
                userMessage = '❌ Decryption failed. Please check that you entered the correct password.';
            }
            
            this.showToast(userMessage, 'error');
        } finally {
            document.getElementById('decodeBtn').disabled = false;
            document.getElementById('decodeProgress').style.display = 'none';
        }
    }

    /**
     * Display extracted message
     */
    displayExtractedMessage(message) {
        document.getElementById('extractedMessage').textContent = message;
        document.getElementById('extractedMessageContainer').style.display = 'block';
    }

    /**
     * Copy message to clipboard
     */
    copyToClipboard() {
        const message = document.getElementById('extractedMessage').textContent;
        navigator.clipboard.writeText(message).then(() => {
            this.showToast('Copied to clipboard!', 'success');
        }).catch(() => {
            this.showToast('Failed to copy', 'error');
        });
    }

    /**
     * Clear decode results
     */
    clearDecodeResults() {
        document.getElementById('extractedMessageContainer').style.display = 'none';
        document.getElementById('decodePassword').value = '';
        document.getElementById('extractedMessage').textContent = '';
        this.resetDecodeForm();
    }

    /**
     * Reset encode form
     */
    resetEncodeForm() {
        document.getElementById('secretMessage').value = '';
        document.getElementById('encodePassword').value = '';
        document.getElementById('charCount').textContent = '0';
        document.getElementById('audioFileInput').value = '';
        document.getElementById('dragDropZone').style.display = 'block';
        document.getElementById('fileInfo').style.display = 'none';
        this.encodeAudioFile = null;
        this.encodeWAVData = null;
    }

    /**
     * Reset decode form
     */
    resetDecodeForm() {
        document.getElementById('decodeAudioFileInput').value = '';
        document.getElementById('dragDropZoneDecode').style.display = 'block';
        document.getElementById('decodeFileInfo').style.display = 'none';
        this.decodeAudioFile = null;
        this.decodeWAVData = null;
    }

    /**
     * Download file as blob
     */
    downloadFile(arrayBuffer, filename) {
        const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Check if SweetAlert2 is available
        if (typeof Swal !== 'undefined') {
            const iconMap = {
                'success': 'success',
                'error': 'error',
                'warning': 'warning',
                'info': 'info'
            };

            Swal.fire({
                icon: iconMap[type] || 'info',
                title: message,
                toast: true,
                position: 'bottom-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                background: '#1a1f3a',
                color: '#e0e0ff',
                customClass: {
                    popup: 'custom-swal-toast',
                    title: 'custom-swal-title'
                }
            });
        } else {
            // Fallback to custom toast
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    /**
     * Update progress bar
     */
    updateProgress(elementId, percentage) {
        document.getElementById(elementId).style.width = percentage + '%';
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AudioSteganographyApp();
});
