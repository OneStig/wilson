import React from 'react';

// Define props for the component
interface ResponseProps {
  response: string; // The response received from the API
}

const Response: React.FC<ResponseProps> = ({ response }) => {
  return (
    <div className="flex justify-center items-center mt-5">
      <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 shadow-md max-w-lg w-full text-center text-gray-800">
        {response || "No response available"}
      </div>
    </div>
  );
};

export default Response;
