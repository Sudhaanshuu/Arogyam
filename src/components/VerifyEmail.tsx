import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <Mail className="h-16 w-16 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Verify Your Email
        </h2>
        <p className="text-gray-600 mb-6">
          We've sent a verification link to your email address. 
          Please check your inbox and click on the link to verify your account.
        </p>
        <button 
          onClick={() => navigate('/login')}
          className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default VerifyEmail;