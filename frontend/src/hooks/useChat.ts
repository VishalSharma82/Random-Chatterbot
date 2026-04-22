import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { Message, UserState } from "../types/chat";

const RTC_CONFIG = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function useChat() {
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);

  const [connected, setConnected] = useState(false);
  const [userState, setUserState] = useState<UserState>({
    code: null,
    name: "Stranger",
    gender: "",
    partnerId: null,
    partnerName: null,
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  const [partnerTyping, setPartnerTyping] = useState(false);

  const [incomingCall, setIncomingCall] = useState<{
    from: string;
    offer: RTCSessionDescriptionInit;
    video: boolean;
    name: string;
  } | null>(null);
  const [callActive, setCallActive] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    // In production (Vercel), we use the absolute URL of the Render backend.
    // In local development, the Vite proxy handles the '/' redirect.
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "/";
    const socket = io(backendUrl);
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      let code = localStorage.getItem("userCode");
      if (!code) {
        code = Math.random().toString(36).substring(2, 10);
        localStorage.setItem("userCode", code);
      }
      socket.emit("set-code", code);
      setUserState((prev) => ({ ...prev, code }));
    });

    socket.on("your-code", (code) => {
      setUserState((prev) => ({ ...prev, code }));
    });

    socket.on("partner-found", (data) => {
      setUserState((prev) => ({
        ...prev,
        partnerId: data.partnerId,
        partnerName: data.name,
      }));
      setMessages([]);
    });

    socket.on("receive-message", (data) => {
      appendMessage(data.from, data.text);
    });

    socket.on("typing", ({ status }) => {
      setPartnerTyping(status);
    });

    socket.on("friend-added", (code) => {
      setFriends((prev) => (prev.includes(code) ? prev : [...prev, code]));
    });

    socket.on("partner-disconnected", () => {
      setUserState((prev) => ({ ...prev, partnerId: null, partnerName: null }));
      closeCall();
    });

    /* WebRTC Signaling */
    socket.on("call-offer", (data) => {
      setIncomingCall(data);
    });

    socket.on("call-answer", async ({ answer }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallActive(true);
        setIsCalling(false);
        // Process queued ice candidates
        iceCandidatesQueue.current.forEach(cand => pcRef.current?.addIceCandidate(new RTCIceCandidate(cand)));
        iceCandidatesQueue.current = [];
      }
    });

    socket.on("ice-candidate", ({ candidate }) => {
      if (pcRef.current && pcRef.current.remoteDescription) {
        pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        iceCandidatesQueue.current.push(candidate);
      }
    });

    socket.on("call-rejected", () => {
      closeCall();
    });

    socket.on("video-switch-request", () => {
      // Logic handled via UI prompt or auto-accept based on preference
      // For now, we'll expose this via a state
      setSwitchRequest(true);
    });

    socket.on("video-switch-response", async ({ accepted }) => {
      if (accepted) {
        await upgradeToVideo();
      } else {
        alert("Partner declined to switch to video.");
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const [switchRequest, setSwitchRequest] = useState(false);

  const appendMessage = (from: string, text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        from,
        text,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  const findPartner = (searchCode?: string) => {
    socketRef.current?.emit("set-name", userState.name);
    socketRef.current?.emit("find-partner", { searchCode });
    setUserState((prev) => ({ ...prev, partnerName: "Searching..." }));
  };

  const sendMessage = (text: string) => {
    if (!userState.partnerId) return;
    appendMessage("You", text);
    socketRef.current?.emit("send-message", text);
  };

  const sendTyping = (status: boolean) => {
    if (!userState.partnerId) return;
    socketRef.current?.emit("typing", status);
  };

  const addFriend = () => {
    socketRef.current?.emit("add-friend");
  };

  const skipPartner = () => {
    socketRef.current?.emit("skip-partner");
    setUserState((prev) => ({ ...prev, partnerId: null, partnerName: "Searching..." }));
    setMessages([]);
  };

  /* WebRTC Functions */
  const initMedia = async (video: boolean) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  };

  const createPeer = (to: string) => {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current?.emit("ice-candidate", { to, candidate: e.candidate });
      }
    };

    pc.onnegotiationneeded = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current?.emit("call-offer", {
          to: userState.partnerId,
          offer,
          video: localStreamRef.current?.getVideoTracks().length! > 0,
          name: userState.name
        });
      } catch (err) {
        console.error("Negotiation error:", err);
      }
    };

    return pc;
  };

  const startCall = async (video: boolean) => {
    if (!userState.partnerId) return;
    setIsCalling(true);
    await initMedia(video);
    const pc = createPeer(userState.partnerId);
    
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    socketRef.current?.emit("call-offer", { 
      to: userState.partnerId, 
      offer, 
      video,
      name: userState.name 
    });
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    const { from, offer, video } = incomingCall;
    
    await initMedia(video);
    const pc = createPeer(from);
    
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    socketRef.current?.emit("call-answer", { to: from, answer });
    setIncomingCall(null);
    setCallActive(true);
    // Process queued ice candidates
    iceCandidatesQueue.current.forEach(cand => pc.addIceCandidate(new RTCIceCandidate(cand)));
    iceCandidatesQueue.current = [];
  };

  const rejectCall = () => {
    if (incomingCall) {
      socketRef.current?.emit("call-rejected", { to: incomingCall.from });
    }
    closeCall();
  };

  const endCall = () => {
    if (userState.partnerId) {
      socketRef.current?.emit("call-rejected", { to: userState.partnerId });
    }
    closeCall();
  };

  const closeCall = () => {
    setCallActive(false);
    setIsCalling(false);
    setIncomingCall(null);
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
  };

  const upgradeToVideo = async () => {
    if (!pcRef.current || !userState.partnerId) return;

    try {
      const stream = await initMedia(true);
      const videoTrack = stream.getVideoTracks()[0];
      
      // Check if track already added
      const senders = pcRef.current.getSenders();
      const videoSender = senders.find(s => s.track?.kind === 'video');
      
      if (videoSender) {
        await videoSender.replaceTrack(videoTrack);
      } else {
        pcRef.current.addTrack(videoTrack, stream);
      }
    } catch (err) {
      console.error("Upgrade to video error:", err);
    }
  };

  const requestVideoSwitch = () => {
    if (!userState.partnerId) return;
    socketRef.current?.emit("video-switch-request", { to: userState.partnerId });
  };

  const respondVideoSwitch = async (accepted: boolean) => {
    setSwitchRequest(false);
    if (!userState.partnerId) return;
    
    socketRef.current?.emit("video-switch-response", { 
      to: userState.partnerId, 
      accepted 
    });

    if (accepted) {
      await upgradeToVideo();
    }
  };

  return {
    connected,
    userState,
    setUserState,
    messages,
    friends,
    partnerTyping,
    sendMessage,
    sendTyping,
    findPartner,
    addFriend,
    skipPartner,
    /* Call state/actions */
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    incomingCall,
    callActive,
    isCalling,
    localStream,
    remoteStream,
    /* Switch actions */
    switchRequest,
    requestVideoSwitch,
    respondVideoSwitch,
  };
}
