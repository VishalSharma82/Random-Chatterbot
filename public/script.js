const socket = io();

// ------------------ DOM ELEMENTS ------------------
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

// ------------------ CALL OVERLAY ------------------
const callOverlay = document.getElementById("callOverlay");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const callTitle = document.getElementById("callTitle");
const acceptCallBtn = document.getElementById("acceptCallBtn");
const rejectCallBtn = document.getElementById("rejectCallBtn");
const endCallBtn = document.getElementById("endCallBtn");
const voiceBtn = document.getElementById("voiceBtn");
const videoBtn = document.getElementById("videoBtn");

let partnerId = null;
let partnerName = "Stranger";
let typingTimeout;
let peerConnection;
let localStream;
let incomingCall = null;

// ------------------ SOCKET CONNECTION ------------------
socket.on("connect", () => {
  let storedCode = localStorage.getItem("userCode");
  if (!storedCode) {
    storedCode = generateCode(12);
    localStorage.setItem("userCode", storedCode);
  }
  socket.emit("set-code", storedCode);
});

socket.on("your-code", (code) => {
  localStorage.setItem("userCode", code);
  document.getElementById("yourCode").innerText = code;
});

// ------------------ START CHAT ------------------
startChatBtn.addEventListener("click", () => {
  const gender = document.getElementById("gender").value;
  const searchCode = document.getElementById("searchCode").value.trim();
  if (!gender) return alert("Please select your gender first.");
  startChatBtn.style.display = "none";
  chatDiv.style.display = "flex";
  socket.emit("find-partner", { gender, searchCode });
});

// ------------------ PARTNER FOUND ------------------
socket.on("partner-found", (data) => {
  partnerId = data.partnerId;
  partnerName = data.gender ? data.gender.charAt(0).toUpperCase() + data.gender.slice(1) : "Stranger";
  partnerNameEl.innerText = partnerName;
  showSystemMessage(`✅ Connected to ${partnerName} | Code: ${data.code}`);
  exitChatBtn.style.display = skipChatBtn.style.display = addFriendBtn.style.display = "block";
  typingIndicator.classList.add("hidden");
  loadMessagesFromStorage();
});

// ------------------ CHAT ------------------
socket.on("receive-message", (msg) => {
  appendMessage("Stranger", msg);
  saveMessageToStorage({ user: "Stranger", text: msg, time: getTime(), isSystem: false });
});

input.addEventListener("keypress", () => {
  socket.emit("typing", true);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => socket.emit("typing", false), 1000);
});

socket.on("typing", (status) => {
  if (status) {
    typingIndicator.innerText = `${partnerName} is typing...`;
    typingIndicator.classList.remove("hidden");
  } else {
    typingIndicator.classList.add("hidden");
  }
});

function sendMessage() {
  const msg = input.value.trim();
  if (!msg || !partnerId) return;
  appendMessage("You", msg);
  saveMessageToStorage({ user: "You", text: msg, time: getTime(), isSystem: false });
  socket.emit("send-message", msg);
  input.value = "";
}

// ------------------ MESSAGES ------------------
function appendMessage(user, text) {
  const isYou = user === "You";
  const wrapper = document.createElement("div");
  wrapper.className = `flex ${isYou ? "justify-end" : "justify-start"}`;
  wrapper.innerHTML = `
    <div class="flex items-end gap-2 ${isYou ? "flex-row-reverse" : ""}">
        <div class="w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold text-white ${isYou ? "bg-green-500" : "bg-gray-500"}">
            ${isYou ? "Y" : "S"}
        </div>
        <div class="max-w-xs p-3 rounded-xl ${isYou ? "bg-green-500 text-white" : "bg-white text-gray-800"} shadow break-words">
            <div class="text-sm leading-tight">${text}</div>
            <div class="text-right text-xs mt-1 text-gray-300">${getTime()}</div>
        </div>
    </div>
  `;
  messagesDiv.appendChild(wrapper);
  // Scroll to bottom
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function showSystemMessage(text) {
  const div = document.createElement("div");
  div.className = "text-gray-500 italic text-center text-sm my-1 break-words";
  div.innerText = text;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  saveMessageToStorage({ user: "System", text, time: getTime(), isSystem: true });
}

// ------------------ EXIT & SKIP ------------------
exitChatBtn.addEventListener("click", () => { sessionStorage.removeItem("chatMessages"); location.reload(); });
skipChatBtn.addEventListener("click", () => {
  if (!partnerId) return;
  socket.emit("skip-partner");
  clearChat();
  showSystemMessage("Searching for a new partner...");
  skipChatBtn.style.display = exitChatBtn.style.display = addFriendBtn.style.display = "none";
});

function clearChat() {
  messagesDiv.innerHTML = "";
  partnerId = null;
}

// ------------------ FRIEND SYSTEM ------------------
addFriendBtn.addEventListener("click", () => {
  if (!partnerId) return alert("Connect to a partner first!");
  socket.emit("add-friend");
});

socket.on("friend-added", code => {
  showSystemMessage(`❤️ Added ${code} as a friend!`);
  addFriendToUI(code);
});

socket.on("friends-list", list => {
  friendsUl.innerHTML = "";
  list.forEach(code => addFriendToUI(code));
});

function addFriendToUI(code) {
  if ([...friendsUl.children].some(li => li.innerText === code)) return;
  const li = document.createElement("li");
  li.innerText = code;
  friendsUl.appendChild(li);
}

// ------------------ SESSION STORAGE ------------------
function saveMessageToStorage(message) {
  let messages = JSON.parse(sessionStorage.getItem("chatMessages")) || [];
  messages.push(message);
  sessionStorage.setItem("chatMessages", JSON.stringify(messages));
}

function loadMessagesFromStorage() {
  const messages = JSON.parse(sessionStorage.getItem("chatMessages")) || [];
  messagesDiv.innerHTML = "";
  messages.forEach(({ user, text, isSystem }) => {
    if (isSystem) showSystemMessage(text);
    else appendMessage(user, text);
  });
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// ------------------ UTILS ------------------
function getTime() { return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
function generateCode(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < length; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

// ------------------ PARTNER DISCONNECTED ------------------
socket.on("partner-disconnected", () => {
  showSystemMessage("⚠️ Your partner disconnected. Searching for a new one...");
  partnerNameEl.innerText = "Not Connected";
  partnerId = null;
});

// ------------------ WEBRTC CALLS ------------------
async function startCall(isVideo) {
  if (!partnerId) return alert("Connect to a partner first!");
  if (peerConnection) return alert("Call already in progress!");
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
    localVideo.srcObject = localStream;
    peerConnection = new RTCPeerConnection();
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    peerConnection.ontrack = e => { remoteVideo.srcObject = e.streams[0]; };
    peerConnection.onicecandidate = e => { if (e.candidate) socket.emit("ice-candidate", { candidate: e.candidate, to: partnerId }); };
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("call-offer", { offer, to: partnerId, isVideo });
    showCallOverlay(isVideo ? "Video Call" : "Voice Call", false);
  } catch (err) { console.error(err); alert("Error accessing media devices."); }
}

socket.on("call-offer", ({ offer, from, isVideo }) => {
  if (peerConnection) {
    socket.emit("call-rejected", { to: from });
    return;
  }
  incomingCall = { offer, from, isVideo };
  showCallOverlay("Incoming Call", true);
});

acceptCallBtn.addEventListener("click", async () => {
  if (!incomingCall) return;
  const { offer, from, isVideo } = incomingCall;
  incomingCall = null;
  callOverlay.classList.remove("hidden");
  callTitle.innerText = isVideo ? "Video Call" : "Voice Call";
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
    localVideo.srcObject = localStream;
    peerConnection = new RTCPeerConnection();
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    peerConnection.ontrack = e => { remoteVideo.srcObject = e.streams[0]; };
    peerConnection.onicecandidate = e => { if (e.candidate) socket.emit("ice-candidate", { candidate: e.candidate, to: from }); };
    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("call-answer", { answer, to: from });
  } catch (err) { console.error(err); }
});

rejectCallBtn.addEventListener("click", () => {
  incomingCall = null;
  callOverlay.classList.add("hidden");
  socket.emit("call-rejected", { to: partnerId });
});

socket.on("call-answer", async ({ answer }) => { if (peerConnection) await peerConnection.setRemoteDescription(answer); });
socket.on("ice-candidate", async ({ candidate }) => { if (peerConnection) await peerConnection.addIceCandidate(candidate); });

endCallBtn.addEventListener("click", () => {
  endCall();
});

function endCall() {
  callOverlay.classList.add("hidden");
  peerConnection?.close();
  localStream?.getTracks().forEach(t => t.stop());
  peerConnection = null;
  localStream = null;
}

function showCallOverlay(title, showAcceptReject) {
  callOverlay.classList.remove("hidden");
  callTitle.innerText = title;
  acceptCallBtn.style.display = rejectCallBtn.style.display = showAcceptReject ? "inline-block" : "none";
  endCallBtn.style.display = showAcceptReject ? "none" : "inline-block";
}

// ------------------ CALL BUTTONS ------------------
voiceBtn.addEventListener("click", () => startCall(false));
videoBtn.addEventListener("click", () => startCall(true));