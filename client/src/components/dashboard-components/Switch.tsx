import React, { useState } from 'react';

interface SwitchProps {
  initialState?: boolean;
  onToggle?: (isOn: boolean) => void;
  width?: number;
  height?: number;
  title: string;
}

const Switch: React.FC<SwitchProps> = ({
  initialState = false,
  onToggle,
  width = 51,
  height = 31,
  title,
}) => {
  const [isOn, setIsOn] = useState(initialState);

  const toggleSwitch = () => {
    const newState = !isOn;
    setIsOn(newState);
    if (onToggle) {
      onToggle(newState);
    }
  };

  const switchStyle: React.CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
  };

  const toggleSize = height - 2;
  const toggleStyle: React.CSSProperties = {
    width: `${toggleSize}px`,
    height: `${toggleSize}px`,
    transform: isOn ? `translateX(${width - height}px)` : 'translateX(0)',
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700">{title}</span>
      <div
        className={`relative rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${
          isOn ? 'bg-green-400' : 'bg-gray-300'
        }`}
        style={switchStyle}
        onClick={toggleSwitch}
        role="switch"
        aria-checked={isOn}
        tabIndex={0}
      >
        <div
          className="absolute top-0.5 left-0.5 bg-white rounded-full shadow-md transition-transform duration-200 ease-in-out"
          style={toggleStyle}
        />
      </div>
    </div>
  );
};

export default Switch;