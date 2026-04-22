import { useState } from 'react';
import { useChat } from './hooks/useChat';
import { ProfilePanel } from './components/ProfilePanel';
import { ChatArea } from './components/ChatArea';
import { CallOverlay } from './components/CallOverlay';
import { Menu } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const {
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
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    incomingCall,
    callActive,
    isCalling,
    localStream,
    remoteStream,
    switchRequest,
    requestVideoSwitch,
    respondVideoSwitch,
  } = useChat();

  const handleStartChat = (searchCode?: string) => {
    findPartner(searchCode);
    setIsSidebarOpen(false);
  };

  const handleExit = () => {
    window.location.reload();
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-900 border-indigo-500/20 border">
      <AnimatePresence>
        <CallOverlay
          incomingCall={incomingCall}
          callActive={callActive}
          isCalling={isCalling}
          localStream={localStream}
          remoteStream={remoteStream}
          switchRequest={switchRequest}
          onAccept={acceptCall}
          onReject={rejectCall}
          onEnd={endCall}
          onSwitchToVideo={requestVideoSwitch}
          onRespondSwitch={respondVideoSwitch}
        />
      </AnimatePresence>

      <ProfilePanel
        userState={userState}
        setUserState={setUserState}
        friends={friends}
        onStartChat={handleStartChat}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden absolute top-4 left-4 z-20 p-2 bg-indigo-600 text-white rounded-lg shadow-lg"
        >
          <Menu size={20} />
        </button>

        <ChatArea
          messages={messages}
          partnerName={userState.partnerName}
          partnerTyping={partnerTyping}
          onSendMessage={sendMessage}
          onSendTyping={sendTyping}
          onSkip={skipPartner}
          onExit={handleExit}
          onAddFriend={addFriend}
          onStartCall={startCall}
          isPartnerFriend={friends.includes(userState.partnerId || '')}
        />
      </main>

      {/* Decorative background elements */}
      <div className="fixed -top-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-24 -right-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}

export default App;
