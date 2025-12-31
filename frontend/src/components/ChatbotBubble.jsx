import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import ChatbotPopup from './ChatbotPopup';

const ChatbotBubble = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
          isOpen
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-primary-600 hover:bg-primary-700'
        } text-white hover:scale-110`}
        aria-label="Open chatbot"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>

      {/* Chatbot Popup */}
      {isOpen && (
        <ChatbotPopup isOpen={isOpen} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
};

export default ChatbotBubble;

