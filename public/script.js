const socket = io();

/* ================== DOM ================== */
const startChatBtn = document.getElementById("startChat");
const chatDiv = document.getElementById("chat");
const messagesDiv = document.getElementById("messages");
const input = document.getElementById("input");
const typingIndicator = document.getElementById("typingIndicator");
const exitChatBtn = document.getElementById("exitChat");
const skipChatBtn = document.getElementById("skipChat");
const addFriendBtn = document.getElementById("addFriendBtn");
const friendsUl = document.getElementById("friendsUl");
const partnerNameEl = document.getElementById("partnerName");

/* ================== STATE ================== */
let partnerId = null;          // sirf call ke liye
let partnerName = "Stranger";
let typingTimeout = null;

/* ================== SOCKET CONNECT ================== */
socket.on("connect", () => {
  let code = localStorage.getItem("userCode");
  if (!code) {
    code = generateCode(12);
    localStorage.setItem("userCode", code);
  }
  socket.emit("set-code", code);
});

socket.on("your-code", code => {
  document.getElementById("yourCode").innerText = code;
});

/* ================== START CHAT ================== */
startChatBtn.addEventListener("click", () => {
  const gender = document.getElementById("gender").value;
  const searchCode = document.getElementById("searchCode").value.trim();

  if (!gender) {
    alert("Please select gender");
    return;
  }

  startChatBtn.style.display = "none";
  chatDiv.style.display = "flex";

  socket.emit("find-partner", { gender, searchCode });
});

/* ================== PARTNER FOUND ================== */
socket.on("partner-found", data => {
  partnerId = data.partnerId; // future calls
  partnerName = "Stranger";
  partnerNameEl.innerText = partnerName;

  systemMessage(`✅ Connected | Code: ${data.code}`);

  exitChatBtn.style.display =
    skipChatBtn.style.display =
    addFriendBtn.style.display = "block";

  typingIndicator.classList.add("hidden");
});

/* ================== SEND MESSAGE ================== */
function sendMessage() {
  const msg = input.value.trim();
  if (!msg) return;

  appendMessage("You", msg);
  socket.emit("send-message", msg); // ✅ only msg
  input.value = "";
}

/* ================== RECEIVE MESSAGE ================== */
socket.on("receive-message", msg => {
  appendMessage("Stranger", msg);
});

/* ================== TYPING ================== */
input.addEventListener("input", () => {
  socket.emit("typing", true);

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit("typing", false);
  }, 800);
});

socket.on("typing", ({ status }) => {
  typingIndicator.classList.toggle("hidden", !status);
  if (status) {
    typingIndicator.innerText = `${partnerName} is typing...`;
  }
});

/* ================== UI HELPERS ================== */
function appendMessage(user, text) {
  const isYou = user === "You";

  const div = document.createElement("div");
  div.className = `flex ${isYou ? "justify-end" : "justify-start"} my-1`;

  div.innerHTML = `
    <div class="max-w-xs px-3 py-2 rounded-lg text-sm shadow
      ${isYou ? "bg-green-500 text-white" : "bg-white text-gray-800"}">
      ${text}
      <div class="text-[10px] opacity-70 text-right mt-1">${time()}</div>
    </div>
  `;

  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function systemMessage(text) {
  const div = document.createElement("div");
  div.className = "text-center text-gray-500 text-xs my-2";
  div.innerText = text;
  messagesDiv.appendChild(div);
}

/* ================== SKIP & EXIT ================== */
skipChatBtn.addEventListener("click", () => {
  socket.emit("skip-partner");
  messagesDiv.innerHTML = "";
  partnerId = null;
  partnerNameEl.innerText = "Searching...";
  systemMessage("🔄 Searching new partner...");
});

exitChatBtn.addEventListener("click", () => {
  location.reload();
});

/* ================== FRIEND SYSTEM ================== */
addFriendBtn.addEventListener("click", () => {
  socket.emit("add-friend");
});

socket.on("friend-added", code => {
  if ([...friendsUl.children].some(li => li.innerText === code)) return;
  const li = document.createElement("li");
  li.innerText = code;
  friendsUl.appendChild(li);
});

/* ================== PARTNER DISCONNECTED ================== */
socket.on("partner-disconnected", () => {
  systemMessage("⚠️ Partner disconnected");
  partnerId = null;
  partnerNameEl.innerText = "Not connected";
});

/* ================== UTILS ================== */
function time() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function generateCode(len) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
