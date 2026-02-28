import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Mic, MicOff, Bot, User, CheckCircle } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';

const ChatbotModal = ({ 
  isOpen, 
  onClose, 
  formType, 
  cropCycleId, 
  workers, 
  onFormComplete 
}) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [formData, setFormData] = useState({});
  const [isComplete, setIsComplete] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [conversationMemory, setConversationMemory] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      // Initialize chat with welcome message
      setMessages([{
        id: (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type: 'bot',
        content: `Hello! I'll help you create a ${formType === 'work_order' ? 'work order' : 'task'}. Please tell me what you need to do.`,
        timestamp: new Date()
      }]);
      setFormData({});
      setIsComplete(false);
      setShowPreview(false);
      setPreviewData(null);
      setConversationMemory({});
    }
  }, [isOpen, formType]);

  const addMessage = (type, content, metadata = null) => {
    const newMessage = {
      id: (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
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
      const response = await fetch(`/api/chatbot/${formType}/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          user_input: userMessage,
          crop_cycle_id: cropCycleId,
          existing_data: conversationMemory
        })
      });

      if (!response.ok) {
        throw new Error('Failed to parse input');
      }

      const data = await response.json();
      
      // Update form data with parsed information
      const updatedFormData = { ...formData, ...data.parsed_data };
      setFormData(updatedFormData);
      
      // Update conversation memory
      setConversationMemory(data.parsed_data);

      if (data.is_complete) {
        setIsComplete(true);
        addMessage('bot', "Great! I have all the information I need. Let me show you a preview of the form before we create it.", {
          type: 'form_complete',
          formData: updatedFormData
        });
      } else {
        addMessage('bot', data.follow_up_question || "Please provide more details.", {
          type: 'follow_up',
          missingFields: data.parsed_data.missing_fields
        });
      }
    } catch (error) {
      addMessage('bot', "Sorry, I had trouble understanding that. Could you please try again?", {
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceRecording = async (audioBlob) => {
    setIsLoading(true);
    setIsRecording(false); // Stop recording state
    
    try {
      // Convert blob to file
      const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
      
      // Upload audio file
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('form_type', formType);
      formData.append('crop_cycle_id', cropCycleId);
      formData.append('existing_data', JSON.stringify(conversationMemory));
      formData.append('language', 'hi');
      
      const response = await fetch('/api/chatbot/voice/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to process voice input');
      }

      const data = await response.json();
      
      // Add transcript as user message
      addMessage('user', data.transcript, { type: 'voice' });
      
      // Update form data
      const updatedFormData = { ...formData, ...data.parsed_data };
      setFormData(updatedFormData);
      
      // Update conversation memory
      setConversationMemory(data.parsed_data);

      if (data.is_complete) {
        setIsComplete(true);
        addMessage('bot', "Perfect! I understood your voice input. Let me show you a preview of the form.", {
          type: 'form_complete',
          formData: updatedFormData
        });
      } else {
        addMessage('bot', data.follow_up_question || "I need a bit more information. Could you tell me more?", {
          type: 'follow_up',
          missingFields: data.parsed_data.missing_fields
        });
      }
    } catch (error) {
      addMessage('bot', "Sorry, I had trouble processing your voice input. Could you please try again?", {
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceButtonClick = () => {
    if (isRecording) {
      // Stop recording - this will be handled by VoiceRecorder component
      setIsRecording(false);
    } else {
      // Start recording
      setIsRecording(true);
    }
  };

  const handleShowPreview = async () => {
    try {
      const response = await fetch(`/api/chatbot/${formType}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          form_data: formData,
          crop_cycle_id: cropCycleId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }

      const data = await response.json();
      setPreviewData(data);
      setShowPreview(true);
    } catch (error) {
      addMessage('bot', "Sorry, I couldn't generate the preview. Please try again.", {
        type: 'error'
      });
    }
  };

  const handleCreateForm = async () => {
    try {
      const response = await fetch(`/api/chatbot/${formType}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          form_data: formData,
          crop_cycle_id: cropCycleId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create form');
      }

      const data = await response.json();
      
      addMessage('bot', `✅ ${data.message}`, {
        type: 'success',
        createdId: data[`${formType}_id`]
      });

      // Call the parent callback
      if (onFormComplete) {
        onFormComplete(data);
      }

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      addMessage('bot', "Sorry, I couldn't create the form. Please try again.", {
        type: 'error'
      });
    }
  };

  const handleEditForm = () => {
    setShowPreview(false);
    setIsComplete(false);
    addMessage('bot', "What would you like to change?", {
      type: 'edit_mode'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Bot className="w-6 h-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              AI Assistant - {formType === 'work_order' ? 'Work Order' : 'Task'} Creation
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {!showPreview ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.type === 'bot' && <Bot className="w-4 h-4 mt-1 flex-shrink-0" />}
                        {message.type === 'user' && <User className="w-4 h-4 mt-1 flex-shrink-0" />}
                        <div className="flex-1">
                          <p className="text-sm">{message.content}</p>
                          {message.metadata?.type === 'form_complete' && (
                            <button
                              onClick={handleShowPreview}
                              className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            >
                              Show Preview
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t p-4">
                <div className="flex items-center space-x-3">
                  {/* Text Input */}
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your message..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none pr-12"
                      disabled={isLoading}
                    />
                    {/* Send Button */}
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputText.trim() || isLoading}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-primary-600 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Voice Recording Button */}
                  <VoiceRecorder
                    onRecordingComplete={handleVoiceRecording}
                    isRecording={isRecording}
                    onRecordingChange={setIsRecording}
                    disabled={isLoading}
                    customButton={true}
                    buttonClassName={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
                      isRecording
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    iconClassName="w-6 h-6"
                  />
                </div>
                
                {/* Recording Status */}
                {isRecording && (
                  <div className="mt-3 flex items-center justify-center space-x-2 text-red-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Recording... Tap microphone to stop</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Preview Area */
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto">
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {formType === 'work_order' ? 'Work Order' : 'Task'} Preview
                  </h3>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-gray-700">
                      {previewData?.preview}
                    </pre>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleEditForm}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleCreateForm}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Create {formType === 'work_order' ? 'Work Order' : 'Task'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatbotModal;
