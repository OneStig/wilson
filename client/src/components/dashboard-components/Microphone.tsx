"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { Mic, MicOff, X } from "lucide-react";

export default function Microphone() {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioData, setAudioData] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [transcription, setTranscription] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioBufferRef = useRef<Float32Array[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const context = new AudioContext();
      setAudioContext(context);

      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      source.connect(processor);
      processor.connect(context.destination);

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        audioBufferRef.current.push(new Float32Array(inputData));
        setAudioData(Array.from(inputData));

        if (audioBufferRef.current.length >= 15) { // Approximately 3 seconds of audio
          const audioToSend = concatenateAudioBuffers(audioBufferRef.current);
          sendAudioChunk(audioToSend);
          audioBufferRef.current = [];
        }
      };

      setIsActive(true);
      setError(null);
      console.log("Recording started");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setError("Error accessing microphone. Please check your permissions.");
    }
  }, []);

  const concatenateAudioBuffers = (buffers: Float32Array[]): Float32Array => {
    const totalLength = buffers.reduce((acc, buffer) => acc + buffer.length, 0);
    const result = new Float32Array(totalLength);
    let offset = 0;
    for (const buffer of buffers) {
      result.set(buffer, offset);
      offset += buffer.length;
    }
    return result;
  };

  const sendAudioChunk = async (audioChunk: Float32Array) => {
    const audioBuffer = audioChunk.buffer;
    try {
      const response = await fetch("http://localhost:8080/transcribe", {
        method: "POST",
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: audioBuffer,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.transcription && data.transcription.trim() !== "") {
        setTranscription(prev => prev + " " + data.transcription.trim());
      }
    } catch (error) {
      console.error("Error sending audio chunk:", error);
      setError("Error transcribing audio. Please try again.");
    }
  };

  const stopRecording = useCallback(() => {
    if (audioContext && scriptProcessorRef.current && streamRef.current) {
      scriptProcessorRef.current.disconnect();
      audioContext.close();
      streamRef.current.getTracks().forEach(track => track.stop());
      setIsActive(false);
      setAudioContext(null);
      console.log("Recording stopped");
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setAudioData([]);
      audioBufferRef.current = [];
    }
  }, [audioContext]);

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
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxRadius = Math.min(centerX, centerY) - 10;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background circle (now transparent)
        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(0, 0, 0, 0)";
        ctx.fill();

        if (isActive && audioData.length > 0) {
          const smoothedData = smoothArray(audioData, 8); // Smooth the data
          const angleStep = (2 * Math.PI) / smoothedData.length;

          ctx.beginPath();
          smoothedData.forEach((value, index) => {
            const angle = index * angleStep;
            const radius = Math.abs(value) * maxRadius * 0.8 + maxRadius * 0.2; // Add a minimum radius
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            if (index === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });
          ctx.closePath();
          ctx.fillStyle = "rgba(239, 68, 68, 0.5)";
          ctx.fill();
        }

        // Draw center circle (microphone button background)
        ctx.beginPath();
        ctx.arc(centerX, centerY, 24, 0, 2 * Math.PI);
        ctx.fillStyle = isActive ? "#ef4444" : "#3b82f6";
        ctx.fill();
      }
    }
  }, [audioData, isActive]);

  const smoothArray = (arr: number[], windowSize: number) => {
    const result = [];
    for (let i = 0; i < arr.length; i++) {
      const slice = arr.slice(Math.max(0, i - windowSize), i + 1);
      let avg = slice.reduce((a, b) => a + b, 0) / slice.length;
      result.push(avg);
    }
    return result;
  };

  return (
    <div className="flex flex-col items-center p-4 space-y-4 w-64">
      <div className="relative w-64 h-48 rounded">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          width="256"
          height="192"
        />
        <button
          onClick={handleClick}
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-3 rounded-full transition-colors duration-300 ${
            isActive
              ? "bg-red-500 hover:bg-red-600"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
          aria-label={isActive ? "Stop recording" : "Start recording"}
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
        {isActive ? "Recording... Click to stop" : "Click to start recording"}
      </p>
      {error && (
        <p className="text-sm text-center text-red-500">{error}</p>
      )}
      <div className="w-full mt-4">
        <h3 className="text-lg font-semibold mb-2">Transcription:</h3>
        <p className="text-sm text-gray-600">{transcription}</p>
      </div>
    </div>
  );
}
