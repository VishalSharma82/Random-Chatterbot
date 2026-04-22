import React, { useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video, Mic, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CallOverlayProps {
  incomingCall: { from: string; name: string; video: boolean } | null;
  callActive: boolean;
  isCalling: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
}

export const CallOverlay: React.FC<CallOverlayProps> = ({
  incomingCall,
  callActive,
  isCalling,
  localStream,
  remoteStream,
  onAccept,
  onReject,
  onEnd
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!incomingCall && !callActive && !isCalling) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-950/95 flex flex-col items-center justify-center z-50 p-4"
    >
      <div className="relative w-full max-w-4xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
        {/* Remote Stream Display */}
        {remoteStream && remoteStream.getVideoTracks().length > 0 ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900">
            <div className="w-32 h-32 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4 border-2 border-indigo-500/20 shadow-2xl">
              <User size={64} className="text-indigo-500" />
            </div>
            <p className="text-2xl font-bold text-white tracking-wide">
              {incomingCall ? incomingCall.name : callActive ? "Voice Session" : "Connecting..."}
            </p>
            {callActive && <p className="text-sm text-green-500 mt-2 font-medium">Secure Audio Channel Active</p>}
          </div>
        )}

        {/* Local Stream (Floating) */}
        <motion.div
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          className="absolute bottom-6 right-6 w-32 md:w-48 aspect-video bg-slate-800 rounded-xl overflow-hidden border-2 border-white/20 shadow-xl"
        >
          {localStream && localStream.getVideoTracks().length > 0 ? (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-700">
              <Mic size={24} className="text-white mb-1" />
              <span className="text-[10px] text-white/50 uppercase font-bold tracking-tighter">You (Audio)</span>
            </div>
          )}
        </motion.div>

        {/* Call Status Overlay */}
        <div className="absolute inset-x-0 top-0 p-8 flex justify-center pointer-events-none">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 text-white font-medium flex items-center gap-3"
          >
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            {callActive ? "Live Session" : isCalling ? "Initiating Call..." : "Incoming Request"}
          </motion.div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-12 flex items-center gap-6">
        <AnimatePresence mode="wait">
          {incomingCall && !callActive ? (
            <motion.div
              key="incoming"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex items-center gap-6"
            >
              <button
                onClick={onAccept}
                className="w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-500/20 transition-transform active:scale-90"
              >
                <Phone size={32} />
              </button>
              <button
                onClick={onReject}
                className="w-16 h-16 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-rose-500/20 transition-transform active:scale-90"
              >
                <PhoneOff size={32} />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="active"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex items-center gap-4"
            >
              <button
                className="w-14 h-14 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-colors"
              >
                <Mic size={24} />
              </button>
              <button
                className="w-14 h-14 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-colors"
              >
                <Video size={24} />
              </button>
              <button
                onClick={onEnd}
                className="w-16 h-16 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-rose-500/20 transition-transform active:scale-90"
              >
                <PhoneOff size={32} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
