# 🚀 Random Chatterbot (Modern Edition)

A premium, real-time random text and video chat platform. This project has been completely modernized with a **React.js** frontend and a robust **Node.js** backend, featuring a professional project structure and state-of-the-art UI/UX.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)

## ✨ Features

- **🌐 Anonymous Matching**: Connect with strangers instantly using a smart random queuing system.
- **🤝 Private Code Chat**: Share your unique "Access Code" to connect directly with friends.
- **📹 WebRTC Video/Voice Calls**: High-quality, peer-to-peer audio and video communication.
- **💬 Real-Time Messaging**: Liquid-smooth chat with typing indicators and automated transitions.
- **🎨 Glassmorphic UI**: A stunning, modern interface built with Tailwind CSS and Framer Motion.
- **🗃️ Persistent Friend System**: Securely add partners to your friend list (stored in MongoDB).
- **📱 Responsive Design**: Fully optimized for mobile, tablet, and desktop experiences.

## 📂 Project Structure

```
Random-Chatterbot/
├── backend/            # Express.js & Socket.io Server
│   ├── models/         # Mongoose Schemas
│   ├── .env            # Server Configuration
│   └── server.js       # Main Entry Point
├── frontend/           # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/ # Modular UI Components
│   │   ├── hooks/      # Custom useChat hook (WebRTC + Sockets)
│   │   └── types/      # TypeScript Definitions
│   └── vite.config.ts  # Development Proxy Configuration
└── README.md
```

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **MongoDB** (Local or Atlas)

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend/` folder:
```env
PORT=3000
MONGO_URI=your_mongodb_uri
```
Start the backend:
```bash
npm start
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Production Build
To build the project for production, run:
```bash
cd frontend
npm run build
```
The backend is already configured to serve the production build from `frontend/dist`.

## 🔐 Security & Privacy
- **P2P Communication**: Video and audio data are transmitted directly between peers (not stored on server).
- **Anonymous Session**: No user tracking or registration required for basic chat.

## 🌐 Deployment Guide (Vercel + Render)

To deploy this project across two platforms (Split Deployment), follow these steps:

### 1. Backend (Render)
1. Create a new **Web Service** on Render.
2. Link your repository.
3. Set **Root Directory** to `backend`.
4. Set **Build Command** to `npm install`.
5. Set **Start Command** to `node server.js`.
6. Add **Environment Variables**:
   - `PORT`: 10000 (standard for Render)
   - `MONGO_URI`: Your MongoDB connection string.

### 2. Frontend (Vercel)
1. Create a new **Project** on Vercel.
2. Link your repository.
3. Set **Root Directory** to `frontend`.
4. Vercel will automatically detect **Vite**.
5. Add **Environment Variables**:
   - `VITE_BACKEND_URL`: The URL of your Render backend (e.g., `https://your-app.onrender.com`).

> [!IMPORTANT]
> Always ensure `VITE_BACKEND_URL` does **not** have a trailing slash (e.g., use `...onrender.com` instead of `...onrender.com/`).

---
Built with ❤️ for real-time communication.
