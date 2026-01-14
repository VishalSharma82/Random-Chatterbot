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

/* ---- CALL UI ---- */
const voiceBtn = document.getElementById("voiceBtn");
const videoBtn = document.getElementById("videoBtn");
const callOverlay = document.getElementById("callOverlay");
const callTitle = document.getElementById("callTitle");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const acceptBtn = document.getElementById("acceptCallBtn");
const rejectBtn = document.getElementById("rejectCallBtn");
const endBtn = document.getElementById("endCallBtn");

/* ================== STATE ================== */
let partnerId = null;
let partnerName = "";
let typingTimeout = null;

let pc = null;
let localStream = null;
let incomingCall = null;
let callActive = false;

/* ================== SOCKET CONNECT ================== */
socket.on("connect", () => {
  let code = localStorage.getItem("userCode");
  if (!code) {
    code = generateCode(8);
    localStorage.setItem("userCode", code);
  }
  socket.emit("set-code", code);
});

/* ================== START CHAT ================== */
startChatBtn.onclick = () => {
  const searchCode = document.getElementById("searchCode").value.trim();
  startChatBtn.style.display = "none";
  chatDiv.style.display = "flex";
  socket.emit("find-partner", { searchCode });
};

/* ================== PARTNER FOUND ================== */
socket.on("partner-found", data => {
  partnerId = data.partnerId;
  partnerName = data.name;
  partnerNameEl.innerText = partnerName;

  systemMessage(`✅ Connected with ${partnerName}`);

  exitChatBtn.style.display =
    skipChatBtn.style.display =
    addFriendBtn.style.display = "block";
});

/* ================== CHAT ================== */
function sendMessage() {
  if (!partnerId) return alert("❌ No partner connected");

  const msg = input.value.trim();
  if (!msg) return;

  appendMessage("You", msg);
  socket.emit("send-message", msg);
  input.value = "";
}

socket.on("receive-message", data => {
  appendMessage(data.from, data.text);
});

/* ================== TYPING ================== */
input.oninput = () => {
  if (!partnerId) return;
  socket.emit("typing", true);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => socket.emit("typing", false), 600);
};

socket.on("typing", ({ status }) => {
  typingIndicator.classList.toggle("hidden", !status);
  if (status) typingIndicator.innerText = `${partnerName} is typing...`;
});

/* ================== UI HELPERS ================== */
function appendMessage(user, text) {
  const isYou = user === "You";
  const div = document.createElement("div");
  div.className = `flex ${isYou ? "justify-end" : "justify-start"} my-1`;
  div.innerHTML = `
    <div class="max-w-xs px-3 py-2 rounded-lg text-sm shadow
      ${isYou ? "bg-green-500 text-white" : "bg-white text-gray-800"}">
      <b>${user}</b><br>${text}
      <div class="text-[10px] opacity-60 text-right mt-1">${time()}</div>
    </div>`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function systemMessage(text) {
  const div = document.createElement("div");
  div.className = "text-center text-gray-500 text-xs my-2";
  div.innerText = text;
  messagesDiv.appendChild(div);
}

/* ================== SKIP / EXIT ================== */
skipChatBtn.onclick = () => {
  socket.emit("skip-partner");
  messagesDiv.innerHTML = "";
  partnerId = null;
  partnerNameEl.innerText = "Searching...";
};

exitChatBtn.onclick = () => location.reload();

/* ================== FRIEND ================== */
addFriendBtn.onclick = () => socket.emit("add-friend");

socket.on("friend-added", code => {
  if ([...friendsUl.children].some(li => li.innerText === code)) return;
  const li = document.createElement("li");
  li.innerText = code;
  friendsUl.appendChild(li);
});

/* ================== PARTNER DISCONNECT ================== */
socket.on("partner-disconnected", () => {
  systemMessage("⚠️ Partner disconnected");
  closeCall();
  partnerId = null;
  partnerNameEl.innerText = "Not connected";
});

/* ================== WEBRTC ================== */
const rtcConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

async function initMedia(video) {
  localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video
  });
  localVideo.srcObject = localStream;
}

function createPeer(to) {
  pc = new RTCPeerConnection(rtcConfig);

  localStream.getTracks().forEach(track =>
    pc.addTrack(track, localStream)
  );

  pc.ontrack = e => (remoteVideo.srcObject = e.streams[0]);

  pc.onicecandidate = e => {
    if (e.candidate)
      socket.emit("ice-candidate", { to, candidate: e.candidate });
  };
}

/* ================== START CALL ================== */
async function startCall(video) {
  if (!partnerId) return alert("❌ No partner connected");

  callActive = true;
  showOutgoingCallUI(video);

  await initMedia(video);
  createPeer(partnerId);

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  socket.emit("call-offer", { to: partnerId, offer, video });
}

voiceBtn.onclick = () => startCall(false);
videoBtn.onclick = () => startCall(true);

/* ================== INCOMING CALL ================== */
socket.on("call-offer", data => {
  incomingCall = data;
  callActive = true;
  showIncomingCallUI(data.name);
});

acceptBtn.onclick = async () => {
  const { from, offer, video } = incomingCall;

  await initMedia(video);
  createPeer(from);

  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  socket.emit("call-answer", { to: from, answer });
  showInCallUI();
};

rejectBtn.onclick = () => {
  socket.emit("call-rejected", { to: incomingCall.from });
  closeCall();
};

endBtn.onclick = () => {
  socket.emit("call-rejected", { to: partnerId });
  closeCall();
};

socket.on("call-answer", async ({ answer }) => {
  await pc.setRemoteDescription(answer);
  showInCallUI();
});

socket.on("ice-candidate", ({ candidate }) => {
  pc?.addIceCandidate(candidate);
});

socket.on("call-rejected", closeCall);

/* ================== CALL UI STATES ================== */
function showOutgoingCallUI(video) {
  callOverlay.classList.remove("hidden");
  callTitle.innerText = video
    ? `Calling ${partnerName}...`
    : `Voice calling ${partnerName}...`;

  acceptBtn.style.display = "none";
  rejectBtn.style.display = "none";
  endBtn.style.display = "inline-block";
}

function showIncomingCallUI(name) {
  callOverlay.classList.remove("hidden");
  callTitle.innerText = `${name} is calling...`;

  acceptBtn.style.display = "inline-block";
  rejectBtn.style.display = "inline-block";
  endBtn.style.display = "none";
}

function showInCallUI() {
  acceptBtn.style.display = "none";
  rejectBtn.style.display = "none";
  endBtn.style.display = "inline-block";
}

/* ================== END CALL ================== */
function closeCall() {
  callActive = false;
  incomingCall = null;

  pc?.close();
  pc = null;

  localStream?.getTracks().forEach(t => t.stop());
  localStream = null;

  callOverlay.classList.add("hidden");
}

/* ================== UTILS ================== */
function time() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function generateCode(len) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++)
    out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
