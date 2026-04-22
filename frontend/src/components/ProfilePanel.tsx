import React from 'react';
import { User, Shield, Search, Power, Heart, X } from 'lucide-react';
import type { UserState } from '../types/chat';

interface ProfilePanelProps {
  userState: UserState;
  setUserState: React.Dispatch<React.SetStateAction<UserState>>;
  friends: string[];
  onStartChat: (searchCode?: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ProfilePanel: React.FC<ProfilePanelProps> = ({
  userState,
  setUserState,
  friends,
  onStartChat,
  isOpen,
  onClose
}) => {
  const [searchCode, setSearchCode] = React.useState('');

  return (
    <div className={`fixed inset-y-0 left-0 z-40 w-80 bg-indigo-700 text-white p-6 shadow-2xl transition-transform duration-300 lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex justify-between items-center mb-8 lg:hidden">
        <h2 className="text-xl font-bold">Menu</h2>
        <button onClick={onClose} className="p-2 hover:bg-indigo-600 rounded-full transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full border-4 border-white/50 overflow-hidden mb-4 shadow-xl group-hover:border-white transition-all">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userState.name}`} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div className="absolute bottom-4 right-0 bg-green-500 w-5 h-5 rounded-full border-2 border-indigo-700"></div>
        </div>
        <h3 className="text-xl font-bold">{userState.name}</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">Your Name</label>
          <div className="relative mt-1">
            <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              value={userState.name}
              onChange={(e) => setUserState(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your name"
              className="w-full bg-white text-gray-900 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-green-400 outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">Gender</label>
          <select
            value={userState.gender}
            onChange={(e) => setUserState(prev => ({ ...prev, gender: e.target.value }))}
            className="w-full mt-1 bg-white text-gray-900 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-400 outline-none transition-all appearance-none"
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">Search Code (Optional)</label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Find a friend..."
              className="w-full bg-white text-gray-900 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-green-400 outline-none transition-all"
            />
          </div>
        </div>

        <div className="bg-indigo-800/50 rounded-xl p-4 mt-6 border border-indigo-600">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={14} className="text-green-400" />
            <span className="text-xs font-semibold text-indigo-200 uppercase">Your Access Code</span>
          </div>
          <p className="font-mono text-xl text-green-300 tracking-wider">
            {userState.code || 'GENERATING...'}
          </p>
        </div>

        <button
          onClick={() => onStartChat(searchCode)}
          disabled={userState.partnerId !== null}
          className="w-full mt-8 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-green-900/20 transform active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Power size={20} />
          Start Chatting
        </button>
      </div>

      <div className="mt-auto pt-8">
        <div className="flex items-center gap-2 mb-4">
          <Heart size={18} className="text-red-400" />
          <h4 className="font-bold">Friends ({friends.length})</h4>
        </div>
        <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2 pr-2">
          {friends.length === 0 ? (
            <p className="text-xs text-indigo-300 italic">No friends added yet.</p>
          ) : (
            friends.map((code) => (
              <div key={code} className="bg-indigo-800/30 hover:bg-indigo-800/50 px-3 py-2 rounded-lg text-sm font-mono border border-indigo-600/50 transition-colors cursor-pointer flex justify-between items-center group">
                {code}
                <button onClick={() => onStartChat(code)} className="opacity-0 group-hover:opacity-100 text-xs bg-green-500 px-2 py-1 rounded text-white font-sans transition-opacity">Chat</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
