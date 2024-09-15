'use client'
import React, { useState, useEffect } from 'react';
import Webcam from "@/components/Webcam";
import HealthMetric from '@/components/dashboard-components/HealthMetric';
import MetricBadge from '@/components/dashboard-components/MetricBadge';
import Microphone from '@/components/dashboard-components/Microphone';

export default function Dashboard() {
  const [heartRate, setHeartRate] = useState(98);
  const [wpm, setWpm] = useState(102);
  const [emotion, setEmotion] = useState("Happy");
  const [comfort, setComfort] = useState(102);
  const [energyLevel, setEnergyLevel] = useState(102);
  const [stress, setStress] = useState(102);
  const [attention, setAttention] = useState(102);

  useEffect(() => {
    const interval = setInterval(() => {
      // Generate completely random values for all metrics
      setHeartRate(Math.floor(Math.random() * (140 - 60 + 1)) + 60);
      setWpm(Math.floor(Math.random() * (120 - 80 + 1)) + 80);
      setEmotion(() => {
        const emotions = ["Happy", "Neutral", "Focused", "Tired"];
        return emotions[Math.floor(Math.random() * emotions.length)];
      });
      setComfort(Math.floor(Math.random() * 101)); // 0 to 100
      setEnergyLevel(Math.floor(Math.random() * 101)); // 0 to 100
      setStress(Math.floor(Math.random() * 101)); // 0 to 100
      setAttention(Math.floor(Math.random() * 101)); // 0 to 100
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const getStatus = (value: number, metric: string) => {
    switch (metric) {
      case 'heartRate':
        return value < 60 ? "Low" : value > 100 ? "High" : "Normal";
      case 'wpm':
        return value < 90 ? "Slow" : value > 110 ? "Fast" : "Normal";
      default:
        return "Normal";
    }
  };

  const getColor = (value: number, metric: string) => {
    switch (metric) {
      case 'heartRate':
        return value < 60 || value > 100 ? "red" : "green";
      case 'wpm':
        return value < 90 ? "yellow" : value > 110 ? "green" : "blue";
      case 'emotion':
        return emotion === "Happy" ? "yellow" : emotion === "Focused" ? "green" : "blue";
      default:
        return "blue";
    }
  };

  return (
    <div className="flex h-screen bg-white font-sans">
      {/* Health Overview Section */}
      <div className="w-1/2 p-8 overflow-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Health Overview</h1>
        <div className="grid grid-cols-3 gap-6">
          <HealthMetric
            icon="❤️"
            title="Heart Rate"
            value={heartRate}
            unit="bpm"
            status={getStatus(heartRate, 'heartRate')}
            color="red"
          />
          <HealthMetric
            icon="💬"
            title="Words Per Minute"
            value={wpm}
            unit="wpm"
            status={getStatus(wpm, 'wpm')}
            color="indigo"
          />
          <HealthMetric
            icon="✨"
            title="Emotion"
            value={emotion}
            unit=""
            status="Normal"
            color="yellow"
          />
        </div>
      </div>

      {/* Learning and Interaction Unit Section */}
      <div className="w-1/2 bg-gray-900 p-8 text-white overflow-auto rounded-l-3xl">
        <h2 className="text-2xl font-semibold mb-6">Learning and Interaction Unit</h2>
        <div className="flex justify-center items-center">
          <div className='w-1/2 flex justify-center '>
            <Microphone/>
          </div>
          <div className='w-1/2'>
            <Webcam />
          </div>
        </div>
        <div className="flex justify-between mb-12">
          <MetricBadge icon="💧" title="Comfort" value={comfort} color='blue' />
          <MetricBadge icon="🔋" title="Energy level" value={energyLevel} color='green' />
          <MetricBadge icon="❤️" title="Stress" value={stress} color='red' />
          <MetricBadge icon="⚠️" title="Attention" value={attention} color='yellow'/>
        </div>
        <div className="flex justify-center">
          <div className="w-32 h-32 bg-yellow-500 rounded-full flex items-center justify-center text-6xl">
            {emotion === "Happy" ? "😊" : emotion === "Neutral" ? "😐" : emotion === "Focused" ? "🧐" : "😴"}
          </div>
        </div>
      </div>
    </div>
  );
}