'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

const AudioRecorder: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        chunksRef.current = [];
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Failed to access microphone. Please ensure you have given permission.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  useEffect(() => {
    if (audioBlob) {
      analyzeAudio(audioBlob);
    }
  }, [audioBlob]);

  const analyzeAudio = async (blob: Blob) => {
    const formData = new FormData();
    formData.append('audio', blob, 'recording.wav');
    try {
      const response = await fetch('http://localhost:8080/analyze_audio', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error('Error analyzing audio:', err);
      setError('Failed to analyze audio. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center p-4 space-y-4">
      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      ) : (
        <>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-3 rounded-full transition-colors duration-300 ${
              isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
            }`}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isRecording ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </button>
          {analysisResult && (
            <div className="text-lg">
              <p>Dominant Emotion: <span className="font-bold">{analysisResult.emotion}</span></p>
              <p>Words per Minute: <span className="font-bold">{analysisResult.wpm}</span></p>
              <p>Nervousness Level: <span className="font-bold">{analysisResult.nervousness}</span></p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AudioRecorder;
