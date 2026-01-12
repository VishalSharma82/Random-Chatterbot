const express = require("express");
const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const { v4: uuidv4 } = require("uuid");

app.use(express.static("public"));

/* ------------------ DATA ------------------ */
const users = new Map(); // socket.id => user
const queue = [];
const friends = new Map();

/* ------------------ SOCKET ------------------ */
io.on("connection", socket => {
  const user = {
    socket,
    socketId: socket.id,
    code: uuidv4().slice(0, 8),
    gender: "",
    partner: null,
    name: "Stranger"
  };

  users.set(socket.id, user);
  if (!friends.has(user.code)) friends.set(user.code, []);

  socket.emit("your-code", user.code);

  /* ---------- SET CODE ---------- */
  socket.on("set-code", code => {
    user.code = code;
    if (!friends.has(code)) friends.set(code, []);
    socket.emit("your-code", code);
    socket.emit("friends-list", friends.get(code));
  });

  /* ---------- FIND PARTNER ---------- */
  socket.on("find-partner", ({ gender, searchCode }) => {
    user.gender = gender;
    user.partner = null;
    removeFromQueue(user);

    if (searchCode) {
      const target = [...users.values()].find(
        u => u.code === searchCode && !u.partner && u.socketId !== socket.id
      );
      if (target) return match(user, target);
    }

    const waiting = queue.find(u => !u.partner && u.socketId !== socket.id);
    if (waiting) {
      removeFromQueue(waiting);
      match(user, waiting);
    } else {
      queue.push(user);
      socket.emit("status", "Searching...");
    }
  });

  /* ---------- CHAT (FIXED) ---------- */
  socket.on("send-message", msg => {
    if (user.partner) {
      user.partner.socket.emit("receive-message", msg);
    }
  });

  socket.on("typing", status => {
    if (user.partner) {
      user.partner.socket.emit("typing", { status });
    }
  });

  /* ---------- FRIEND ---------- */
  socket.on("add-friend", () => {
    if (!user.partner) return;

    const a = user.code;
    const b = user.partner.code;

    if (!friends.get(a).includes(b)) friends.get(a).push(b);
    if (!friends.get(b).includes(a)) friends.get(b).push(a);

    socket.emit("friend-added", b);
    user.partner.socket.emit("friend-added", a);
  });

  socket.on("get-friends", () => {
    socket.emit("friends-list", friends.get(user.code) || []);
  });

  /* ---------- SKIP ---------- */
  socket.on("skip-partner", () => {
    if (user.partner) {
      user.partner.partner = null;
      user.partner.socket.emit("partner-disconnected");
    }
    user.partner = null;
    removeFromQueue(user);
    queue.push(user);
  });

  /* ---------- DISCONNECT ---------- */
  socket.on("disconnect", () => {
    removeFromQueue(user);
    if (user.partner) {
      user.partner.partner = null;
      user.partner.socket.emit("partner-disconnected");
    }
    users.delete(socket.id);
  });

  /* ---------- WEBRTC ---------- */
  socket.on("call-offer", ({ to, offer, video }) => {
    users.get(to)?.socket.emit("call-offer", {
      from: socket.id,
      offer,
      video
    });
  });

  socket.on("call-answer", ({ to, answer }) => {
    users.get(to)?.socket.emit("call-answer", { answer });
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    users.get(to)?.socket.emit("ice-candidate", { candidate });
  });

  socket.on("call-rejected", ({ to }) => {
    users.get(to)?.socket.emit("call-rejected");
  });
});

/* ------------------ MATCH ------------------ */
function match(a, b) {
  a.partner = b;
  b.partner = a;

  a.socket.emit("partner-found", {
    partnerId: b.socketId,
    name: b.name,
    code: b.code
  });

  b.socket.emit("partner-found", {
    partnerId: a.socketId,
    name: a.name,
    code: a.code
  });
}

function removeFromQueue(user) {
  const i = queue.indexOf(user);
  if (i !== -1) queue.splice(i, 1);
}

/* ------------------ SERVER ------------------ */
const PORT = process.env.PORT || 3000;
http.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);
