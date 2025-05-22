const socket = io();
const startChatBtn = document.getElementById("startChat");
const chatDiv = document.getElementById("chat");
const messagesDiv = document.getElementById("messages");
const input = document.getElementById("input");
const typingIndicator = document.getElementById("typingIndicator");
const exitChatBtn = document.getElementById("exitChat");
const skipChatBtn = document.getElementById("skipChat");

let partnerId = null;
let typingTimeout;

socket.on("connect", () => {
    const storedCode = localStorage.getItem("userCode");
    if (storedCode) {
        socket.emit("set-code", storedCode);
    } else {
        socket.emit("request-code");
    }
});

socket.on("your-code", (code) => {
    localStorage.setItem("userCode", code);
    document.getElementById("yourCode").innerText = code; // Update UI with your code
});

startChatBtn.addEventListener("click", () => {
    const gender = document.getElementById("gender").value;
    const searchCode = document.getElementById("searchCode").value.trim();

    if (!gender) {
        alert("Please select your gender first.");
        return;
    }

    startChatBtn.style.display = "none";
    chatDiv.style.display = "block";

    socket.emit("find-partner", { gender, searchCode });
});

// socket.on("partner-found", (data) => {
//     partnerId = data.partnerId;
//     document.getElementById("status").innerText = `Connected to a ${data.gender} | Code: ${data.code}`;
//     exitChatBtn.style.display = "block";
// });
// socket.on("partner-found", (data) => {
//     partnerId = data.partnerId;
//     partnerName = data.gender ? `${data.gender.charAt(0).toUpperCase() + data.gender.slice(1)}` : "Stranger";
//     document.getElementById("status").innerText = `Connected to a ${data.gender} | Code: ${data.code}`;
//     exitChatBtn.style.display = "block";
//     skipChatBtn.style.display = "block";

//     typingIndicator.classList.add("hidden");
// });

socket.on("receive-message", (message) => {
    appendMessage("Stranger", message);
});

function sendMessage() {
    const message = input.value.trim();
    if (message && partnerId) {
        appendMessage("You", message);
        socket.emit("send-message", message);
        input.value = "";
    }
}

function appendMessage(sender, message) {
    const messageWrapper = document.createElement("div");
    const isYou = sender === "You";
    const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    messageWrapper.className = `flex ${isYou ? "justify-end" : "justify-start"}`;

    messageWrapper.innerHTML = `
      <div class="flex items-end gap-2 ${isYou ? "flex-row-reverse" : ""}">
        <!-- Avatar -->
        <div class="w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold text-white ${isYou ? "bg-green-500" : "bg-gray-500"
        }">
  ${isYou ? "Y" : "S"}
</div>


        <!-- Message Bubble -->
        <div class="max-w-xs p-3 rounded-xl ${isYou ? "bg-green-500 text-white" : "bg-white text-gray-800"
        } shadow">
          <div class="text-sm leading-tight">${message}</div>
          <div class="text-right text-xs mt-1 text-gray-300">${time}</div>
        </div>
      </div>
    `;

    document.getElementById("messages").appendChild(messageWrapper);
    document.getElementById("messages").scrollTop =
        document.getElementById("messages").scrollHeight;
}

socket.on("partner-disconnected", () => {
    appendMessage(
        "System",
        "Your partner disconnected. Searching for a new one..."
    );
    document.getElementById("status").innerText =
        "Searching for a new partner...";
    socket.emit("find-partner", {});
});

input.addEventListener("keypress", () => {
    socket.emit("typing", true);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => socket.emit("typing", false), 1000);
});

socket.on("typing", (status) => {
    typingIndicator.classList.toggle("hidden", !status);
});

exitChatBtn.addEventListener("click", () => {
    sessionStorage.removeItem("chatMessages");
    location.reload();
});

skipChatBtn.addEventListener("click", () => {
    sessionStorage.removeItem("chatMessages");
    socket.emit("find-partner", {
        gender: document.getElementById("gender").value,
        searchCode: document.getElementById("searchCode").value.trim(),
    });
    messagesDiv.innerHTML = "";
    document.getElementById("status").innerText =
        "Searching for a new partner...";
    exitChatBtn.style.display = "none";
    skipChatBtn.style.display = "none";
});

// Show Skip button when partner found
// socket.on("partner-found", (data) => {
//     partnerId = data.partnerId;
//     document.getElementById("status").innerText = `Connected to a ${data.gender} | Code: ${data.code}`;
//     exitChatBtn.style.display = "block";
//     skipChatBtn.style.display = "block";   // Show skip button
// });

// Skip chat event handler
skipChatBtn.addEventListener("click", () => {
    if (partnerId) {
        socket.emit("skip-partner"); // Notify server to disconnect current partner and find new one
        clearChat();
        document.getElementById("status").innerText =
            "Searching for a new partner...";
        skipChatBtn.style.display = "none"; // Hide skip while searching
        exitChatBtn.style.display = "none"; // Hide exit while searching
    }
});

function clearChat() {
    messagesDiv.innerHTML = "";
    partnerId = null;
}
// On partner found, store partner name or label for typing indicator
let partnerName = "Stranger"; // Default

socket.on("partner-found", (data) => {
    partnerId = data.partnerId;
    partnerName = data.gender
        ? `${data.gender.charAt(0).toUpperCase() + data.gender.slice(1)}`
        : "Stranger";
    document.getElementById(
        "status"
    ).innerText = `Connected to a ${partnerName} | Code: ${data.code}`;
    exitChatBtn.style.display = "block";
    skipChatBtn.style.display = "block";
    typingIndicator.classList.add("hidden");
});

// Listen for typing events from partner
socket.on("typing", (status) => {
    if (status) {
        typingIndicator.innerText = `${partnerName} is typing...`;
        typingIndicator.classList.remove("hidden");
    } else {
        typingIndicator.classList.add("hidden");
    }
});

function appendMessage(user, text, messageId, isSeen = false) {
    const div = document.createElement("div");
    div.id = messageId;

    if (user === "You") {
        div.className = "sent-message";
        if (isSeen) div.classList.add("seen-message");
    } else {
        div.className = "received-message";
    }

    const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
    div.innerHTML = `<strong>${user}:</strong> ${text} <span class="time">${time}</span>`;

    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    // Notify partner message is seen if this message is from partner
    if (user !== "You") {
        socket.emit("message-seen", messageId);
    }
}

function saveMessageToStorage(message) {
    let messages = JSON.parse(sessionStorage.getItem("chatMessages")) || [];
    messages.push(message);
    sessionStorage.setItem("chatMessages", JSON.stringify(messages));
}

function loadMessagesFromStorage() {
    let messages = JSON.parse(sessionStorage.getItem("chatMessages")) || [];
    messagesDiv.innerHTML = "";
    messages.forEach(({ user, text, time, isSystem }) => {
        const div = document.createElement("div");
        if (isSystem) {
            div.innerHTML = `<em>${text}</em> <span class="text-xs text-gray-500 ml-2">${time}</span>`;
            div.classList.add("text-gray-500", "italic");
        } else {
            div.innerHTML = `<strong>${user}:</strong> ${text} <span class="text-xs text-gray-500 ml-2">${time}</span>`;
        }
        messagesDiv.appendChild(div);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}