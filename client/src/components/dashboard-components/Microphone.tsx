import React, { useState, useRef } from 'react';
import { Mic, MicOff, X } from 'lucide-react';

export default function Microphone() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudioToServer(audioBlob);
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const sendAudioToServer = async (audioBlob) => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');

    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_TOKEN}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTranscript(data.text);
    } catch (error) {
      console.error('Error sending audio to server:', error);
      setTranscript('Error transcribing audio. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center p-4 space-y-4 w-64">
      <div className="relative w-64 h-48 rounded">
        <canvas className="w-full h-full" width="256" height="192" />
        <button
          onClick={recording ? stopRecording : startRecording}
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-3 rounded-full transition-colors duration-300 ${
            recording ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
          }`}
          aria-label={recording ? "Stop recording" : "Start recording"}
        >
          {recording ? (
            <MicOff className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}
        </button>
        {recording && (
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
        {recording ? "Recording... Click to stop" : "Click to start recording"}
      </p>
      <div className="w-full mt-4">
        <h3 className="text-lg font-semibold mb-2">Transcription:</h3>
        <p className="text-sm text-gray-600">{transcript}</p>
      </div>
    </div>
  );
}
