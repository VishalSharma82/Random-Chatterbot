# 🚀 Random Chatterbot

A modern, real-time random text and video chat platform built for seamless interaction. Connect anonymously with strangers or use unique user codes to build a friend list and stay in touch.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)
![Tech Stack](https://img.shields.io/badge/stack-Node.js%20%7C%20Socket.io%20%7C%20WebRTC-orange.svg)

## ✨ Features

- **🌐 Anonymous Random Matching**: Instantly find and chat with strangers worldwide with one click.
- **🤝 Friend Code System**: Share your unique user code to connect directly with friends or add strangers to your persistent friend list.
- **📹 Video & Voice Calls**: High-quality P2P audio/video communication powered by WebRTC.
- **💬 Real-Time Messaging**: Low-latency text chat with typing indicators and automated system messages.
- **🗃️ Persistent Friend List**: Securely save your connections to a MongoDB database.
- **📱 Responsive UI**: A clean, modern interface that works beautifully on both desktop and mobile devices.

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3 (Tailwind-style styling), Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Real-time**: Socket.io
- **P2P/Video**: WebRTC (Google STUN servers)
- **Database**: MongoDB & Mongoose
- **Configuration**: Dotenv for environment management

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) (Local or Atlas instance)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/VishalSharma82/Random-Chatterbot.git
   cd Random-Chatterbot
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (one has been initialized for you) and add your MongoDB connection string:
   ```env
   PORT=3000
   MONGO_URI=your_mongodb_connection_uri
   ```

4. **Start the server**:
   ```bash
   node server.js
   ```

5. **Open the app**:
   Navigate to `http://localhost:3000` in your browser.

## 📂 Project Structure

```
Random-Chatterbot/
├── models/             # Database schemas (Mongoose)
│   └── User.js         # User model for friends list
├── public/             # Frontend assets
│   ├── index.html      # Main UI
│   ├── script.js       # Client-side logic & WebRTC
│   └── style.css       # Custom styling
├── .env                # Environment variables
├── package.json        # Project dependencies
└── server.js           # Express/Socket.io server logic
```

## 🔐 Security & Privacy

- **No Registration Required**: Chat instantly without creating an account.
- **Local Storage**: User IDs are stored locally on your device for persistence.
- **P2P Connections**: Video/Voice data is transmitted directly between users (Peer-to-Peer) for maximum privacy.

## 📝 License

This project is licensed under the **ISC License**.

---
Built with ❤️ for real-time communication.
