const express = require("express");
const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");

const io = new Server(http, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static("public"));

/* ================= DATA ================= */
const users = new Map();        // socket.id => user
const queue = [];
const friends = new Map();      // code => [codes]
const codeToSocket = new Map(); // code => socket.id

/* ================= SOCKET ================= */
io.on("connection", socket => {

  /* ---- USER OBJECT ---- */
  const user = {
    socketId: socket.id,
    socket,
    code: null,
    name: null,
    partner: null
  };

  users.set(socket.id, user);

  /* ---------- SET CODE ---------- */
  socket.on("set-code", code => {
    user.code = code;
    user.name = `User-${code.slice(0, 4)}`;

    friends.set(code, friends.get(code) || []);
    codeToSocket.set(code, socket.id);

    socket.emit("your-code", code);
    socket.emit("friends-list", friends.get(code));
  });

  /* ---------- FIND PARTNER ---------- */
  socket.on("find-partner", ({ searchCode }) => {
    removeFromQueue(user);
    user.partner = null;

    // ---- Friend code based connect ----
    if (searchCode) {
      const targetSocket = codeToSocket.get(searchCode);
      const target = users.get(targetSocket);

      if (target && !target.partner && target.socketId !== socket.id) {
        return match(user, target);
      } else {
        socket.emit("friend-offline");
        return;
      }
    }

    // ---- Random match ----
    const waiting = queue.find(
      u => !u.partner && u.socketId !== socket.id
    );

    if (waiting) {
      removeFromQueue(waiting);
      match(user, waiting);
    } else {
      queue.push(user);
    }
  });

  /* ---------- CHAT ---------- */
  socket.on("send-message", text => {
    if (user.partner) {
      users.get(user.partner)?.socket.emit("receive-message", {
        from: user.name,
        text
      });
    }
  });

  socket.on("typing", status => {
    if (user.partner) {
      users.get(user.partner)?.socket.emit("typing", { status });
    }
  });

  /* ---------- FRIEND ADD ---------- */
  socket.on("add-friend", () => {
    if (!user.partner) return;

    const me = user.code;
    const other = users.get(user.partner).code;

    if (!friends.get(me).includes(other))
      friends.get(me).push(other);

    if (!friends.get(other).includes(me))
      friends.get(other).push(me);

    socket.emit("friend-added", other);
    users.get(user.partner).socket.emit("friend-added", me);
  });

  /* ---------- WEBRTC SIGNALING (FIXED) ---------- */
  socket.on("call-offer", ({ to, offer, video, name }) => {
    io.to(to).emit("call-offer", {
      from: socket.id,
      name: user.name,
      offer,
      video
    });
  });

  socket.on("call-answer", ({ to, answer }) => {
    io.to(to).emit("call-answer", { answer });
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    io.to(to).emit("ice-candidate", { candidate });
  });

  socket.on("call-rejected", ({ to }) => {
    io.to(to).emit("call-rejected");
  });

  /* ---------- SKIP ---------- */
  socket.on("skip-partner", () => {
    disconnectPartner(user);
    queue.push(user);
  });

  /* ---------- DISCONNECT ---------- */
  socket.on("disconnect", () => {
    disconnectPartner(user);
    removeFromQueue(user);
    users.delete(socket.id);
    codeToSocket.delete(user.code);
  });
});

/* ================= HELPERS ================= */
function match(a, b) {
  a.partner = b.socketId;
  b.partner = a.socketId;

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

function disconnectPartner(user) {
  if (user.partner) {
    const other = users.get(user.partner);
    if (other) {
      other.partner = null;
      other.socket.emit("partner-disconnected");
    }
    user.partner = null;
  }
}

function removeFromQueue(user) {
  const i = queue.indexOf(user);
  if (i !== -1) queue.splice(i, 1);
}

/* ================= SERVER ================= */
const PORT = process.env.PORT || 3000;
http.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);
