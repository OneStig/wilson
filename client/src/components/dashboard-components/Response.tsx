import React from 'react';

// Define props for the component
interface ResponseProps {
    response: string; // The response received from the API
}

const Response: React.FC<ResponseProps> = ({ response }) => {
    return (
        <div className="flex justify-center items-center mt-5">
            <div className="text-2xl text-[rgb(200,200,255)] text-center font-mono p-5 bg-gray-900 bg-opacity-90 rounded-lg border-2 border-[rgb(200,200,255)] shadow-inner shadow-[rgb(200,200,255)]">
                <div>{response}</div>
            </div>
        </div>
    );
};

export default Response;
