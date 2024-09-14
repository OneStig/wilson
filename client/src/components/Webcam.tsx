'use client';
import React, { useRef, useEffect, useState } from 'react';

type StressLevel = 'Unknown' | 'Low' | 'Medium' | 'High';

interface AlertProps {
  message: string;
}

const Alert: React.FC<AlertProps> = ({ message }) => (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
    <strong className="font-bold">Error!</strong>
    <span className="block sm:inline"> {message}</span>
  </div>
);

const Webcam: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stressLevel, setStressLevel] = useState<StressLevel>('Unknown');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError('Failed to access webcam. Please ensure you have given permission.');
      }
    };
    startWebcam();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const analyzeStress = async () => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = canvas.toDataURL('image/jpeg');

          try {
            const response = await fetch('http://localhost:8080/analyze', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ image: imageData }),
            });
            const data = await response.json();
            setStressLevel(data.stressLevel);
          } catch (err) {
            console.error('Error analyzing stress:', err);
            setError('Failed to analyze stress. Please try again.');
          }
        }
      }
    };
    const intervalId = setInterval(analyzeStress, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center p-4 space-y-4">
      {error ? (
        <Alert message={error} />
      ) : (
        <>
          <div className="relative">
            <video ref={videoRef} autoPlay className="w-64 h-48 border rounded" />
            <canvas ref={canvasRef} className="hidden" width="640" height="480" />
          </div>
          <p className="text-lg">
            Estimated stress level: <span className="font-bold">{stressLevel}</span>
          </p>
        </>
      )}
    </div>
  );
};

export default Webcam;
