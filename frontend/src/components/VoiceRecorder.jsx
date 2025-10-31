import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Square, Play, Pause, Upload, Loader } from 'lucide-react';

const VoiceRecorder = ({ 
  onRecordingComplete, 
  userId, 
  isRecording, 
  onRecordingChange, 
  disabled = false,
  customButton = false,
  buttonClassName = "",
  iconClassName = "w-5 h-5"
}) => {
  const [internalIsRecording, setInternalIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Use external isRecording state if provided, otherwise use internal
  const currentIsRecording = isRecording !== undefined ? isRecording : internalIsRecording;

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Auto-process audio when recording stops (for custom button mode)
  useEffect(() => {
    if (audioURL && customButton && onRecordingComplete) {
      // Convert blob URL to actual blob and process
      fetch(audioURL)
        .then(response => response.blob())
        .then(blob => {
          onRecordingComplete(blob);
          // Reset after processing
          setAudioURL(null);
          setRecordingTime(0);
          audioChunksRef.current = [];
        })
        .catch(error => {
          console.error('Error processing audio:', error);
        });
    }
  }, [audioURL, customButton, onRecordingComplete]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
      };

      mediaRecorder.start();
      if (onRecordingChange) {
        onRecordingChange(true);
      } else {
        setInternalIsRecording(true);
      }
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please grant permission and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && currentIsRecording) {
      mediaRecorderRef.current.stop();
      if (onRecordingChange) {
        onRecordingChange(false);
      } else {
        setInternalIsRecording(false);
      }
      setIsPaused(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && currentIsRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        clearInterval(timerRef.current);
      }
      setIsPaused(!isPaused);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleUpload = async () => {
    if (!audioURL) {
      alert('Please record audio first');
      return;
    }

    setIsUploading(true);
    try {
      // Convert blob URL to actual blob
      const response = await fetch(audioURL);
      const blob = await response.blob();
      
      // Call parent callback with the audio blob
      await onRecordingComplete(blob);
      
      // Reset
      setAudioURL(null);
      setRecordingTime(0);
      audioChunksRef.current = [];
    } catch (error) {
      console.error('Error uploading audio:', error);
      alert('Failed to upload audio. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const resetRecording = () => {
    setAudioURL(null);
    setRecordingTime(0);
    setIsPlaying(false);
    audioChunksRef.current = [];
  };

  const handleButtonClick = () => {
    if (disabled) return;
    
    if (currentIsRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // If custom button mode, just return the button
  if (customButton) {
    return (
      <button
        onClick={handleButtonClick}
        disabled={disabled}
        className={`${buttonClassName} ${
          currentIsRecording 
            ? 'bg-red-100 text-red-600' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {currentIsRecording ? (
          <MicOff className={iconClassName} />
        ) : (
          <Mic className={iconClassName} />
        )}
      </button>
    );
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">🎙️ Voice Recording Tips:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Speak clearly and at a moderate pace</li>
          <li>• Mention: What happened, where, when, and affected area</li>
          <li>• Example: "High severity pest attack in Field F_001, aphids on wheat, 2.5 acres affected"</li>
        </ul>
      </div>

      {/* Recording Display */}
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <div className="flex items-center justify-center mb-6">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center ${
            currentIsRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
          }`}>
            <Mic className={`w-16 h-16 ${currentIsRecording ? 'text-white' : 'text-gray-600'}`} />
          </div>
        </div>

        <div className="text-4xl font-mono font-bold text-gray-700 mb-6">
          {formatTime(recordingTime)}
        </div>

        {/* Recording Controls */}
        <div className="flex items-center justify-center space-x-4">
          {!currentIsRecording && !audioURL && (
            <button
              onClick={startRecording}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition shadow-lg"
            >
              <Mic className="w-5 h-5" />
              <span>Start Recording</span>
            </button>
          )}

          {currentIsRecording && (
            <>
              <button
                onClick={pauseRecording}
                className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
              
              <button
                onClick={stopRecording}
                className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                <Square className="w-5 h-5" />
                <span>Stop</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Audio Playback */}
      {audioURL && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={playAudio}
                className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full transition"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              <div>
                <p className="font-semibold text-green-900">Recording Ready</p>
                <p className="text-sm text-green-700">Duration: {formatTime(recordingTime)}</p>
              </div>
            </div>
            
            <button
              onClick={resetRecording}
              className="text-sm text-green-700 hover:text-green-900 underline"
            >
              Record Again
            </button>
          </div>

          <audio
            ref={audioRef}
            src={audioURL}
            onEnded={() => setIsPlaying(false)}
            className="w-full"
          />

          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Processing with AI...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Upload & Extract Data</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;

