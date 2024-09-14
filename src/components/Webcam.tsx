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
    const analyzeStress = () => {
      if (videoRef.current && canvasRef.current) {
        // const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (context) {
          setStressLevel('Low');
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
            est stress: <span className="font-bold">{stressLevel}</span>
          </p>
        </>
      )}
    </div>
  );
};

export default Webcam;
