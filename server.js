const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const { v4: uuidv4 } = require("uuid");

app.use(express.static("public")); // assuming your frontend files are in a folder named public

const users = new Map();
const queue = [];

io.on("connection", (socket) => {
  let userId = uuidv4();
  users.set(socket.id, { id: userId, socket, gender: "", partner: null });

  socket.emit("your-code", userId);

  socket.on("set-code", (code) => {
  users.set(socket.id, { id: code, socket, gender: "", partner: null });
  socket.emit("your-code", code);
});


  socket.on("find-partner", ({ gender, searchCode }) => {
    const currentUser = users.get(socket.id);
    if (!currentUser) return;

    currentUser.gender = gender;
    currentUser.partner = null;

    // Direct match if searching for specific code
    if (searchCode) {
      const targetUser = Array.from(users.values()).find(
        (u) => u.id === searchCode && u.socket.id !== socket.id && !u.partner
      );
      if (targetUser) {
        matchUsers(currentUser, targetUser);
        return;
      }
    }

    // Search for random partner
    const partner = queue.find(
      (u) => u.socket.id !== socket.id && !u.partner
    );

    if (partner) {
      queue.splice(queue.indexOf(partner), 1);
      matchUsers(currentUser, partner);
    } else {
      queue.push(currentUser);
      socket.emit("status", "Searching for a partner...");
    }
  });

  socket.on("send-message", (msg) => {
    const user = users.get(socket.id);
    if (user && user.partner) {
      user.partner.socket.emit("receive-message", msg);
    }
  });

  socket.on("typing", (status) => {
    const user = users.get(socket.id);
    if (user && user.partner) {
      user.partner.socket.emit("typing", status);
    }
  });

  socket.on("skip-partner", () => {
    const user = users.get(socket.id);
    if (user && user.partner) {
      const partner = user.partner;
      user.partner = null;
      partner.partner = null;

      partner.socket.emit("partner-disconnected");
    }
    queue.push(user);
    socket.emit("status", "Searching for a new partner...");
  });

  socket.on("disconnect", () => {
    const user = users.get(socket.id);
    if (!user) return;

    // Remove from queue
    const index = queue.findIndex((u) => u.socket.id === socket.id);
    if (index !== -1) queue.splice(index, 1);

    // Inform partner
    if (user.partner) {
      user.partner.socket.emit("partner-disconnected");
      user.partner.partner = null;
    }

    users.delete(socket.id);
  });
});

function matchUsers(user1, user2) {
  user1.partner = user2;
  user2.partner = user1;

  user1.socket.emit("partner-found", {
    partnerId: user2.socket.id,
    gender: user2.gender,
    code: user2.id,
  });

  user2.socket.emit("partner-found", {
    partnerId: user1.socket.id,
    gender: user1.gender,
    code: user1.id,
  });
}
function clearChat() {
  messagesDiv.innerHTML = "";
  typingIndicator.classList.add("hidden");
}


const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
