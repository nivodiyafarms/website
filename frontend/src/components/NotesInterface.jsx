import React, { useState, useEffect, useRef } from 'react';
import { Send, Image as ImageIcon, X, Trash2, Mic } from 'lucide-react';
import api from '../services/api';
import VoiceRecorder from './VoiceRecorder';

const NotesInterface = ({ cropCycleId }) => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const notesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(user);
    loadNotes();
  }, [cropCycleId]);

  // Track previous notes length to detect new notes
  const prevNotesLengthRef = useRef(0);
  
  useEffect(() => {
    // Only auto-scroll when a new note is added (length increases)
    if (notes.length > prevNotesLengthRef.current) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      prevNotesLengthRef.current = notes.length;
      return () => clearTimeout(timer);
    } else {
      prevNotesLengthRef.current = notes.length;
    }
  }, [notes]);

  const scrollToBottom = () => {
    notesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadNotes = async () => {
    try {
      const response = await api.get(`/crop-cycle-notes/${cropCycleId}/notes`);
      setNotes(response.data);
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newNote.trim() && !selectedImage) {
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('content', newNote.trim() || 'Image');
      formData.append('source', 'web');
      
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      await api.post(`/crop-cycle-notes/${cropCycleId}/notes`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setNewNote('');
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      loadNotes();
    } catch (error) {
      console.error('Failed to create note:', error);
      alert('Failed to create note');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceRecordingComplete = async (blob) => {
    try {
      const formData = new FormData();
      formData.append('file', blob, 'recording.wav');
      
      // Use the voice upload endpoint to transcribe
      const response = await fetch('http://localhost:8000/crop-cycle-incidents/' + cropCycleId + '/tasks/voice/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (result.transcript) {
        // Append transcript to the existing text in the field
        setNewNote(prev => (prev + ' ' + result.transcript).trim());
      }
    } catch (error) {
      console.error('Failed to process voice recording:', error);
      alert('Failed to process voice recording. Please try again.');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      await api.delete(`/crop-cycle-notes/${cropCycleId}/notes/${noteId}`);
      loadNotes();
    } catch (error) {
      console.error('Failed to delete note:', error);
      alert('Failed to delete note');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    // Adjust this based on your backend configuration
    return `http://localhost:8000/${imagePath}`;
  };

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-[600px]">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <h3 className="text-xl font-bold text-gray-900">Notes</h3>
        <p className="text-sm text-gray-600 mt-1">
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
        </p>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {notes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No notes yet. Start the conversation!</p>
          </div>
        ) : (
          notes.map((note) => {
            const isCurrentUser = currentUser && note.user_id === currentUser.user_id;
            
            return (
              <div
                key={note.note_id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-4 ${
                    isCurrentUser
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {/* User info */}
                  {!isCurrentUser && (
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-semibold">
                        {note.user_name ? note.user_name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="text-xs font-semibold">{note.user_name || 'Unknown'}</span>
                    </div>
                  )}

                  {/* Image */}
                  {note.image_path && (
                    <div className="mb-2">
                      <img
                        src={getImageUrl(note.image_path)}
                        alt="Note attachment"
                        className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition"
                        onClick={() => window.open(getImageUrl(note.image_path), '_blank')}
                      />
                    </div>
                  )}

                  {/* Content */}
                  <p className="text-sm whitespace-pre-wrap break-words">{note.content}</p>

                  {/* Footer */}
                  <div className={`flex items-center justify-between mt-2 text-xs ${
                    isCurrentUser ? 'text-primary-100' : 'text-gray-500'
                  }`}>
                    <span>{formatDate(note.created_at)}</span>
                    
                    {isCurrentUser && (
                      <button
                        onClick={() => handleDeleteNote(note.note_id)}
                        className="ml-2 hover:text-red-300 transition"
                        title="Delete note"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Source badge */}
                  {note.source === 'app' && (
                    <div className={`mt-2 text-xs ${
                      isCurrentUser ? 'text-primary-200' : 'text-gray-600'
                    }`}>
                      <span className="italic">From mobile app</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={notesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4 bg-gray-50">
        <form onSubmit={handleSubmit}>
          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-3 relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-20 w-20 object-cover rounded-lg border-2 border-primary-500"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Input Row */}
          <div className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Type a note..."
                rows="2"
                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                disabled={loading}
              />
              <VoiceRecorder
                onRecordingComplete={handleVoiceRecordingComplete}
                customButton={true}
                buttonClassName="absolute top-2 right-2 p-2 rounded-lg transition"
                iconClassName="w-5 h-5"
                disabled={loading}
              />
            </div>

            <div className="flex space-x-2">
              {/* Image Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
                disabled={loading}
                title="Attach image"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={loading || (!newNote.trim() && !selectedImage)}
                className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Send note"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NotesInterface;


