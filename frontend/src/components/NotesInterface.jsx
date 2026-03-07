// frontend/src/components/NotesInterface.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Send, Image as ImageIcon, X, Trash2, Mic } from 'lucide-react';
import api from '../services/api';
import VoiceRecorder from './VoiceRecorder';
import { supabase } from '../lib/supabase';

const NotesInterface = ({ relatedType, relatedId }) => {
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
    if (relatedType && relatedId) {
      loadNotes();
    }
  }, [relatedType, relatedId]);

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
      const response = await api.get(`/notes/${relatedType}/${relatedId}`);
      setNotes(response.data);
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  };

  const compressImage = async (file) => {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const MAX_WIDTH = 1600;
    const scale = Math.min(MAX_WIDTH / bitmap.width, 1);
    canvas.width = bitmap.width * scale;
    canvas.height = bitmap.height * scale;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.7);
    });
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

    if (!newNote.trim() && !selectedImage) return;

    if (!relatedType || !relatedId) {
      alert('Missing context for note');
      return;
    }

    setLoading(true);

    try {
      let mediaUrl = null;

      if (selectedImage) {
        if (!supabase) {
          alert('Image upload is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
          setLoading(false);
          return;
        }
        const compressed = await compressImage(selectedImage);
        const sanitized = (selectedImage.name || 'image').replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `notes/${Date.now()}_${sanitized}.jpg`;
        const { error } = await supabase.storage
          .from('images')
          .upload(filePath, compressed, { contentType: 'image/jpeg' });
        if (error) {
          alert('Image upload failed: ' + error.message);
          setLoading(false);
          return;
        }
        const { data } = supabase.storage.from('images').getPublicUrl(filePath);
        mediaUrl = data.publicUrl;
      }

      const params = new URLSearchParams();
      params.set('related_type', relatedType);
      params.set('related_id', relatedId);
      params.set('text', newNote.trim() || '');
      if (mediaUrl != null) params.set('media_url', mediaUrl);
      if (selectedImage) params.set('media_type', 'image');

      await api.post(`/notes/?${params.toString()}`, {});

      setNewNote('');
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      loadNotes();
    } catch (error) {
      console.error('Failed to create note:', error);
      alert('Failed to create note');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceRecordingComplete = async () => {
    // Voice transcription is context-specific; no universal endpoint here.
    // Kept for UI; can be wired to a generic transcript API later.
    setNewNote((prev) => (prev + ' [Voice note]').trim());
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Delete this note?')) return;

    try {
      await api.delete(`/notes/${noteId}`);
      loadNotes();
    } catch (error) {
      console.error('Delete failed:', error);
      alert(error?.response?.data?.detail || 'Delete failed');
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
            const isCurrentUser = currentUser && note.author_id === currentUser.user_id;

            return (
              <div
                key={note.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-4 ${
                    isCurrentUser
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {/* User info - optional if backend returns author */}
                  {!isCurrentUser && note.author_id && (
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-semibold">
                        U
                      </div>
                      <span className="text-xs font-semibold">User</span>
                    </div>
                  )}

                  {/* Image */}
                  {note.media_url && (
                    <div className="mb-2">
                      <img
                        src={note.media_url}
                        alt="attachment"
                        className="mt-2 rounded-md max-h-60 object-contain cursor-pointer hover:opacity-90 transition"
                        onClick={() => window.open(note.media_url, '_blank')}
                      />
                    </div>
                  )}

                  {/* Content */}
                  <p className="text-sm whitespace-pre-wrap break-words">{note.text}</p>

                  {/* Footer */}
                  <div className={`flex items-center justify-between mt-2 text-xs ${
                    isCurrentUser ? 'text-primary-100' : 'text-gray-500'
                  }`}>
                    <span>{formatDate(note.created_at)}</span>

                    {isCurrentUser && (
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="ml-2 hover:text-red-300 transition"
                        title="Delete note"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
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


