'use client';

import React, { useRef, useEffect, useState } from 'react';



const Camera: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
      }
    };

    const intervalId = setInterval(analyzeStress, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center p-4 space-y-4">
                <div className="relative">
            <video ref={videoRef} autoPlay className="w-64 h-48 border rounded" />
            <canvas ref={canvasRef} className="hidden" width="640" height="480" />
          </div>
    </div>
  );
};

export default Camera;
