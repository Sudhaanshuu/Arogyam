import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Video } from 'lucide-react';
import VideoCall from './VideoCall'; // Using your existing VideoCall component

interface VideoCallFeatureProps {
  // You can add additional props if needed
}

const VideoCallPage: React.FC<VideoCallFeatureProps> = () => {
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [isInCall, setIsInCall] = useState(false);

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim() && userName.trim()) {
      setIsInCall(true);
    }
  };

  return (
    <div className="w-full py-6 overflow-hidden"> 
      {isInCall ? (
        <div className="w-full h-full mt-10 max-h-[80vh]">
          <VideoCall 
            channelName={roomId} 
            onLeave={() => {
              setIsInCall(false);
              setRoomId('');
              setUserName('');
            }} 
          />
        </div>
      ) : (
        <div className="relative flex items-center justify-center">
          {/* Animated background - reduced number for better performance */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-gradient-to-r from-red-600/20 via-pink-500/20 to-orange-500/20"
                initial={{
                  x: Math.random() * 100,
                  y: Math.random() * 100,
                  scale: Math.random() * 0.5 + 0.5,
                }}
                animate={{
                  x: [
                    Math.random() * 100,
                    Math.random() * 100,
                    Math.random() * 100,
                  ],
                  y: [
                    Math.random() * 100,
                    Math.random() * 100,
                    Math.random() * 100,
                  ],
                  scale: [Math.random() * 0.5 + 0.5, Math.random() * 1 + 1, Math.random() * 0.5 + 0.5],
                }}
                transition={{
                  duration: Math.random() * 20 + 20,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  width: `${Math.random() * 100 + 50}px`,
                  height: `${Math.random() * 100 + 50}px`,
                  filter: 'blur(20px)',
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl border border-gray-700 w-full max-w-md mx-4 mt-20"
          >
            <div className="flex items-center justify-center mb-8 gap-3">
              <Video className="text-red-500 w-12 h-12" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-transparent bg-clip-text">
                HealthConnect
              </h1>
            </div>
            <form onSubmit={joinRoom} className="space-y-6">
              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-gray-300 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  id="userName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white placeholder-gray-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="roomId" className="block text-sm font-medium text-gray-300 ">
                  Enter Session ID
                </label>
                <input
                  type="text"
                  id="roomId"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Enter your unique session ID"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white placeholder-gray-500"
                  required
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="w-full py-3 px-6 bg-gradient-to-r from-red-600 to-orange-500 text-white font-semibold rounded-lg transition-all hover:opacity-90"
              >
                Start Consultation
              </motion.button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default VideoCallPage;