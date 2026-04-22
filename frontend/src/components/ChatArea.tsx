import React, { useEffect, useRef, useState } from 'react';
import { Send, Mic, Video, SkipForward, LogOut, Heart, User } from 'lucide-react';
import type { Message } from '../types/chat';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatAreaProps {
  messages: Message[];
  partnerName: string | null;
  partnerTyping: boolean;
  onSendMessage: (text: string) => void;
  onSendTyping: (status: boolean) => void;
  onSkip: () => void;
  onExit: () => void;
  onAddFriend: () => void;
  onStartCall: (video: boolean) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  partnerName,
  partnerTyping,
  onSendMessage,
  onSendTyping,
  onSkip,
  onExit,
  onAddFriend,
  onStartCall
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, partnerTyping]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
      onSendTyping(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    onSendTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onSendTyping(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  if (!partnerName) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md"
        >
          <div className="w-20 h-20 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <User size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Ready to meet someone new?</h2>
          <p className="mb-0">Fill in your profile and hit "Start Chatting" to begin a random encounter.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-100 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
            {partnerName === 'Searching...' ? '?' : partnerName[0].toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-800 leading-tight">{partnerName}</p>
            <p className="text-xs text-green-500 font-medium">
              {partnerName === 'Searching...' ? 'Waiting for match...' : 'Connected'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {partnerName !== 'Searching...' && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onAddFriend}
              className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="Add Friend"
            >
              <Heart size={24} fill="#ef4444" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50">
        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: msg.from === 'You' ? 20 : -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                className={`flex ${msg.from === 'You' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl shadow-sm text-sm ${
                    msg.from === 'You'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                  }`}
                >
                  <div className="flex justify-between items-baseline gap-4 mb-1">
                    <span className={`font-bold text-[10px] uppercase tracking-wider ${msg.from === 'You' ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {msg.from}
                    </span>
                    <span className={`text-[10px] ${msg.from === 'You' ? 'text-indigo-300' : 'text-slate-400'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Typing Indicator */}
      <div className="h-6 px-6 bg-slate-50/50">
        {partnerTyping && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-slate-400 italic"
          >
            {partnerName} is typing...
          </motion.p>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <div className="flex items-end gap-2 max-w-5xl mx-auto">
          <div className="flex-1 bg-slate-100 rounded-2xl flex items-end p-2 focus-within:ring-2 focus-within:ring-indigo-200 transition-all">
            <input
              type="text"
              value={inputText}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-none outline-none p-2 text-slate-800 placeholder:text-slate-400"
              disabled={partnerName === 'Searching...'}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || partnerName === 'Searching...'}
              className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              <Send size={20} />
            </button>
          </div>

          <div className="flex gap-1 mb-1">
            <button
              onClick={() => onStartCall(false)}
              disabled={partnerName === 'Searching...'}
              className="p-3 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-50"
              title="Voice Call"
            >
              <Mic size={20} />
            </button>
            <button
              onClick={() => onStartCall(true)}
              disabled={partnerName === 'Searching...'}
              className="p-3 text-purple-600 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors disabled:opacity-50"
              title="Video Call"
            >
              <Video size={20} />
            </button>
            <button
              onClick={onSkip}
              className="p-3 text-amber-600 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors"
              title="Next Person"
            >
              <SkipForward size={20} />
            </button>
            <button
              onClick={onExit}
              className="p-3 text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors"
              title="Exit Chat"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
