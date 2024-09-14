'use client';

import React, { useState, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';

export default function Microphone() {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event: BlobEvent) => {
        setAudioChunks(chunks => [...chunks, event.data]);
      };

      recorder.onstop = () => {
        const audioBlob: Blob = new Blob(audioChunks, { type: 'audio/wav' });
        handleAudioCapture(audioBlob);
        setAudioChunks([]);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsActive(true);
      console.log('Recording started');
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }, [audioChunks]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsActive(false);
      setMediaRecorder(null);
      console.log('Recording stopped');
    }
  }, [mediaRecorder]);

  const handleClick = () => {
    if (isActive) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleAudioCapture = (audioBlob: Blob) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();
    console.log('Audio captured and playing');
  };

  return (
    <button
      onClick={handleClick}
      className={`p-3 rounded-full transition-colors duration-300 ${
        isActive 
          ? 'bg-red-500 hover:bg-red-600' 
          : 'bg-blue-500 hover:bg-blue-600'
      }`}
      aria-label={isActive ? 'Stop recording' : 'Start recording'}
    >
      {isActive ? (
        <MicOff className="w-6 h-6 text-white" />
      ) : (
        <Mic className="w-6 h-6 text-white" />
      )}
    </button>
  );
}
