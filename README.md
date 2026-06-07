# 🎧 StealthAudio: Hidden text in Plain Sight

<div align="center">
  <img src="https://img.shields.io/badge/Status-Live-00f3ff?style=for-the-badge&logoColor=white" alt="Live Status">
  <img src="https://img.shields.io/badge/100%25-Client_Side-0d1117?style=for-the-badge&color=00f3ff" alt="Zero Cloud">
  <img src="https://img.shields.io/badge/Security-AES_Encryption-0d1117?style=for-the-badge&color=00f3ff" alt="AES">
</div>

<br>

**StealthAudio** is a pure client-side web application that allows you to hide secret text messages inside `.wav` audio files using the **Least Significant Bit (LSB)** steganography technique, secured with **AES Cryptography**. 

>No servers. No cloud uploads. Complete privacy right in your browser with a sleek Cyber Blue aesthetic.

### 🔗 [Try the Live Demo Here!](https://[তোমার-ইউজারনেম].github.io/[তোমার-রিপোর-নাম]/)



## Features

* **Zero-Cloud Architecture:** All file processing and encryption happen locally in your browser memory via the `ArrayBuffer` API.
* **AES-256 Encryption:** Your secret message is encrypted with a custom password using `CryptoJS` before being embedded into the audio.
* **LSB Steganography:** Alters the least significant bits of the uncompressed 16-bit PCM `.wav` data, making the hidden message completely inaudible to the human ear.
* **Drag-and-Drop Interface:** Modern, neon cyber-themed UI for seamless user experience.
* **Sample Testing:** Built-in "Use Sample Music" feature with Fetch API for instant testing without manual file uploads.

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3, Vanilla JavaScript
* **Cryptography:** CryptoJS (AES)
* **File Processing:** HTML5 FileReader API, JavaScript DataView, Fetch API

##  How to Use

### Hiding a Message (Encode)
1. Drop a `16-bit PCM .wav` file into the designated zone (or click "Use Sample Music").
2. Type your highly secret message.
3. Set a strong password.
4. Click **Encode**. The app will generate and download a `stego_audio.wav` file. The audio will sound completely normal!

### Extracting a Message (Decode)
1. Upload the modified `stego_audio.wav` file.
2. Enter the correct password you used during encoding.
3. Click **Decode** to reveal the hidden text!

>ENJOY AND LET ME KNOW YOUR FEEDBACK!
