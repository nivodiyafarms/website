import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Bot, User, X, Loader2 } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';
import { chatbotAPI } from '../services/api';

const ChatbotPopup = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [language, setLanguage] = useState('en');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Initialize with welcome message
      const welcomeMessage = {
        id: Date.now().toString(),
        type: 'bot',
        content: 'Hello! I\'m your AI assistant. I can help you create crop cycles, tasks, and work orders, or answer questions about your farm data. How can I help you today?',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      setConversationId(null);
      setLanguage('en');
      
      // Focus input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (type, content, metadata = null) => {
    const newMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      content,
      timestamp: new Date(),
      metadata
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    addMessage('user', userMessage);

    setIsLoading(true);

    try {
      const response = await chatbotAPI.sendMessage(userMessage, conversationId);
      
      // Update conversation ID
      if (response.conversation_id) {
        setConversationId(response.conversation_id);
      }
      
      // Update language
      if (response.language) {
        setLanguage(response.language);
      }
      
      // Add bot response
      addMessage('bot', response.bot_message, {
        action_taken: response.action_taken,
        created_item: response.created_item
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Sorry, I encountered an error. Please try again.';
      addMessage('bot', errorMessage, {
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceRecording = async (audioBlob) => {
    setIsRecording(false);
    setIsLoading(true);
    
    // Show a temporary message indicating voice is being processed
    addMessage('user', '[Voice message...]', { type: 'voice' });
    
    try {
      const response = await chatbotAPI.sendVoice(audioBlob, conversationId);
      
      // Remove the temporary message and add the actual response
      setMessages(prev => prev.slice(0, -1));
      
      // Update conversation ID
      if (response.conversation_id) {
        setConversationId(response.conversation_id);
      }
      
      // Update language
      if (response.language) {
        setLanguage(response.language);
      }
      
      // Add bot response
      addMessage('bot', response.bot_message, {
        action_taken: response.action_taken,
        created_item: response.created_item
      });
      
    } catch (error) {
      console.error('Error processing voice:', error);
      // Remove the temporary message
      setMessages(prev => prev.slice(0, -1));
      const errorMessage = error.response?.data?.detail || error.message || 'Sorry, I had trouble processing your voice input. Please try again.';
      addMessage('bot', errorMessage, {
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearContext = async () => {
    if (conversationId) {
      try {
        await chatbotAPI.clearContext(conversationId);
        setConversationId(null);
        setMessages([{
          id: Date.now().toString(),
          type: 'bot',
          content: 'Conversation context cleared. How can I help you?',
          timestamp: new Date()
        }]);
      } catch (error) {
        console.error('Error clearing context:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl z-50 flex flex-col border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5" />
          <h3 className="font-semibold">AI Assistant</h3>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
            {language === 'hi' ? 'हिंदी' : 'English'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleClearContext}
            className="text-xs hover:underline"
            title="Clear conversation"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-1 rounded transition"
            aria-label="Close chatbot"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.type === 'bot' && <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                {message.type === 'user' && <User className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.metadata?.created_item && (
                    <div className="mt-2 pt-2 border-t border-gray-300 text-xs">
                      <p className="font-semibold">✅ Created:</p>
                      <pre className="mt-1 text-xs overflow-x-auto">
                        {JSON.stringify(message.metadata.created_item, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 px-3 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4" />
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-3 bg-white rounded-b-lg">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder={language === 'hi' ? 'संदेश टाइप करें...' : 'Type your message...'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
              disabled={isLoading}
            />
          </div>
          <VoiceRecorder
            onRecordingComplete={handleVoiceRecording}
            isRecording={isRecording}
            onRecordingChange={setIsRecording}
            disabled={isLoading}
            customButton={true}
            buttonClassName={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            iconClassName="w-5 h-5"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            className="flex items-center justify-center w-10 h-10 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        {isRecording && (
          <div className="mt-2 flex items-center justify-center space-x-2 text-red-600 text-xs">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span>Recording... Click microphone to stop</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatbotPopup;

