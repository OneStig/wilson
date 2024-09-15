'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Mic, MicOff, X } from 'lucide-react';

export default function Microphone() {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audioData, setAudioData] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);

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

      // Set up audio analyzer
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const animate = () => {
        analyser.getByteFrequencyData(dataArray);
        setAudioData(Array.from(dataArray));
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();
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
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setAudioData([]);
      analyserRef.current = null;
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxRadius = Math.min(centerX, centerY) - 10;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius, 0, 2 * Math.PI);
        ctx.fillStyle = isActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)';
        ctx.fill();

        if (audioData.length > 0) {
          const angleStep = (2 * Math.PI) / audioData.length;
          
          ctx.beginPath();
          audioData.forEach((value, index) => {
            const angle = index * angleStep;
            const radius = (value / 255) * maxRadius;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            if (index === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });
          ctx.closePath();
          ctx.fillStyle = isActive ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)';
          ctx.fill();
        }

        // Draw center circle (microphone button background)
        ctx.beginPath();
        ctx.arc(centerX, centerY, 24, 0, 2 * Math.PI);
        ctx.fillStyle = isActive ? '#ef4444' : '#3b82f6';
        ctx.fill();
      }
    }
  }, [audioData, isActive]);

  return (
    <div className="flex flex-col items-center p-4 space-y-4 w-64">
      <div className="relative w-64 h-48 border rounded bg-gray-100">
        <canvas ref={canvasRef} className="w-full h-full" width="256" height="192" />
        <button
          onClick={handleClick}
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-3 rounded-full transition-colors duration-300 ${
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
        {isActive && (
          <button
            onClick={stopRecording}
            className="absolute top-2 right-2 p-1 rounded-full bg-gray-200 hover:bg-gray-300"
            aria-label="Turn off app"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>
      <p className="text-sm text-center text-gray-600">
        {isActive ? 'Recording... Click to stop' : 'Click to start recording'}
      </p>
    </div>
  );
}