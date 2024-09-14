import React from 'react';
import Webcam from "@/components/Webcam";
import HealthMetric from './dashboard-component/healthMetric';
import MetricBadge from './dashboard-component/metricBadge';
import Microphone from './dashboard-component/microphone';
import Camera from './dashboard-component/camera';

export default function Dashboard() {


  return (
    <div className="flex h-screen bg-white font-sans">
      {/* Health Overview Section */}
      <div className="w-1/2 p-8 overflow-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Health Overview</h1>
        <div className="grid grid-cols-3 gap-6">
          <HealthMetric
            icon="❤️"
            title="Heart Rate"
            value="98"
            unit="bpm"
            status="Normal"
            color="red"
          />
          <HealthMetric
            icon="💬"
            title="Words Per Minute"
            value="102"
            unit="wpm"
            status="Normal"
            color="sky"
          />
          <HealthMetric
            icon="✨"
            title="Emotion"
            value="Happy"
            unit=""
            status="Normal"
            color="orange"
          />
        </div>
      </div>

      {/* Learning and Interaction Unit Section */}
      <div className="w-1/2 bg-gray-900 p-8 text-white overflow-auto rounded-l-3xl">
        <h2 className="text-2xl font-semibold mb-6">Learning and Interaction Unit</h2>
        <div className="flex justify-between items-start mb-8">
          
          <Microphone/>
          <Camera />
        </div>
        <div className="flex justify-between mb-12">
          <MetricBadge icon="💧" title="Comfort" value="102"  color='sky' />
          <MetricBadge icon="🔋" title="Energy level" value="102" color='sky' />
          <MetricBadge icon="❤️" title="Stress" value="102"  color='sky' />
          <MetricBadge icon="⚠️" title="Attention" value="102" color='sky'/>
        </div>
        <div className="flex justify-center">
          <div className="w-32 h-32 bg-yellow-500 rounded-full flex items-center justify-center text-6xl">
            😊
          </div>
        </div>
      </div>
    </div>
  );
}