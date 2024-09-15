'use client'
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Mic, MicOff, X } from 'lucide-react';

export default function Microphone() {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [audioData, setAudioData] = useState<number[]>([]);
  const [wpm, setWpm] = useState<number>(0);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const speechSegmentsRef = useRef<{start: number, end: number}[]>([]);
  const lastSpeechEndRef = useRef<number>(0);
  const silenceThresholdRef = useRef<number>(0);
  const calibrationSamplesRef = useRef<number[]>([]);

  const CALIBRATION_DURATION = 1000; // 1 second for calibration
  const SPEECH_THRESHOLD = 1.5; // How many times above the silence level to consider as speech
  const MIN_SPEECH_DURATION = 100; // Minimum duration (ms) to consider as a speech segment
  const MAX_PAUSE_DURATION = 300; // Maximum pause (ms) to consider as part of the same speech segment
  const AVERAGING_WINDOW = 5000; // Window for WPM calculation (ms)

  const detectSpeechActivity = useCallback((audioData: number[], time: number) => {
    const averageAmplitude = audioData.reduce((sum, value) => sum + value, 0) / audioData.length;

    if (calibrationSamplesRef.current.length < CALIBRATION_DURATION / 50) { // 20 samples per second
      calibrationSamplesRef.current.push(averageAmplitude);
      silenceThresholdRef.current = Math.max(...calibrationSamplesRef.current) * SPEECH_THRESHOLD;
      return;
    }

    if (averageAmplitude > silenceThresholdRef.current) {
      if (speechSegmentsRef.current.length === 0 || time - lastSpeechEndRef.current > MAX_PAUSE_DURATION) {
        speechSegmentsRef.current.push({ start: time, end: time });
      } else {
        speechSegmentsRef.current[speechSegmentsRef.current.length - 1].end = time;
      }
      lastSpeechEndRef.current = time;
    }

    // Remove old segments
    const cutoffTime = time - AVERAGING_WINDOW;
    speechSegmentsRef.current = speechSegmentsRef.current.filter(segment => segment.end > cutoffTime);

  }, []);

  const calculateWPM = useCallback(() => {
    const now = Date.now();
    const recentSegments = speechSegmentsRef.current.filter(segment => segment.end > now - AVERAGING_WINDOW);

    if (recentSegments.length === 0) return 0;

    const totalSpeechDuration = recentSegments.reduce((sum, segment) => {
      return sum + Math.min(segment.end, now) - Math.max(segment.start, now - AVERAGING_WINDOW);
    }, 0);

    // Assuming an average of 150 words per minute of continuous speech
    const estimatedWords = (totalSpeechDuration / 1000 / 60) * 150;

    return Math.round((estimatedWords / (AVERAGING_WINDOW / 1000 / 60)));
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      calibrationSamplesRef.current = [];
      speechSegmentsRef.current = [];
      lastSpeechEndRef.current = 0;

      const animate = () => {
        const now = Date.now();
        analyser.getByteFrequencyData(dataArray);
        const audioDataArray = Array.from(dataArray);
        setAudioData(audioDataArray);
        detectSpeechActivity(audioDataArray, now);
        const currentWpm = calculateWPM();
        setWpm(currentWpm);
        setDebugInfo(`Current WPM: ${currentWpm}\nSilence Threshold: ${silenceThresholdRef.current.toFixed(2)}\nSpeech Segments: ${speechSegmentsRef.current.length}`);
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();

      setIsActive(true);
      console.log('Recording started');
      setDebugInfo('Recording started. Calibrating...');

    } catch (error) {
      console.error('Error accessing microphone:', error);
      setDebugInfo(`Error: ${error.message}`);
    }
  }, [detectSpeechActivity, calculateWPM]);

  const stopRecording = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsActive(false);
    setAudioData([]);
    analyserRef.current = null;
    speechSegmentsRef.current = [];
    setWpm(0);
    setDebugInfo('Recording stopped');
  }, []);

  useEffect(() => {
    return () => {
      if (isActive) {
        stopRecording();
      }
    };
  }, [isActive, stopRecording]);

  const handleClick = () => {
    if (isActive) {
      stopRecording();
    } else {
      startRecording();
    }
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

        // Draw background circle (now transparent)
        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fill();

        if (isActive && audioData.length > 0) {
          const smoothedData = smoothArray(audioData, 8); // Smooth the data
          const angleStep = (2 * Math.PI) / smoothedData.length;

          ctx.beginPath();
          smoothedData.forEach((value, index) => {
            const angle = index * angleStep;
            const radius = (value / 255) * maxRadius * 0.8 + maxRadius * 0.2; // Add a minimum radius
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            if (index === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });
          ctx.closePath();
          ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
          ctx.fill();
        }

        // Draw center circle (microphone button background)
        ctx.beginPath();
        ctx.arc(centerX, centerY, 24, 0, 2 * Math.PI);
        ctx.fillStyle = isActive ? '#ef4444' : '#3b82f6';
        ctx.fill();

        // Draw WPM text
        ctx.font = '16px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(`${wpm} WPM`, centerX, canvas.height - 10);
      }
    }
  }, [audioData, isActive, wpm]);

  const smoothArray = (arr: number[], windowSize: number) => {
    const result = [];
    for (let i = 0; i < arr.length; i++) {
      const slice = arr.slice(Math.max(0, i - windowSize), i + 1);
      let avg = slice.reduce((a, b) => a + b, 0) / slice.length;

      // Apply 1/x curve reduction to the first 10 elements
      if (i < 360) {
        const x = i + 1; // Avoid division by zero
        const factor = Math.min(3, 1 + (10 / x)); // y = 1 + (10/x) curve, capped at 10
        avg /= factor;
      }

      result.push(avg);
    }
    return result;
  };

  return (
    <div className="flex flex-col items-center p-4 space-y-4 w-64">
      <div className="relative w-64 h-48 rounded">
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
      <div className="mt-4 p-2 bg-gray-100 rounded text-xs whitespace-pre-wrap">
        {debugInfo}
      </div>
    </div>
  );
}
