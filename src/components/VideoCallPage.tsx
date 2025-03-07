import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Users } from 'lucide-react';
import VideoCall from './VideoCall';
import { useUserStore } from '../lib/store';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const VideoCallPage: React.FC = () => {
  const { user } = useUserStore();
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [isInCall, setIsInCall] = useState(false);

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to join a video call');
      navigate('/login');
      return;
    }

    if (roomId.trim()) {
      setIsInCall(true);
    } else {
      toast.error('Please enter a valid room ID');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-20 px-4">
      {isInCall ? (
        <div className="max-w-7xl mx-auto h-[80vh] rounded-xl overflow-hidden">
          <VideoCall
            channelName={roomId}
            userName={user?.user_metadata?.name || user?.email || 'Anonymous'}
            onLeave={() => {
              setIsInCall(false);
              setRoomId('');
            }}
          />
        </div>
      ) : (
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-lg border border-white/20"
          >
            <div className="flex items-center justify-center mb-8">
              <div className="p-3 rounded-full bg-gradient-to-r from-red-600 via-pink-500 to-orange-500">
                <Video className="h-8 w-8 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center text-white mb-2">
              Join Video Consultation
            </h1>
            <p className="text-gray-300 text-center mb-8">
              Enter your consultation room ID to connect with your doctor
            </p>

            <form onSubmit={joinRoom} className="space-y-6">
              <div>
                <label htmlFor="roomId" className="block text-sm font-medium text-gray-300 mb-2">
                  Consultation Room ID
                </label>
                <input
                  type="text"
                  id="roomId"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Enter room ID"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white placeholder-gray-400"
                  required
                />
              </div>

              <div className="flex items-center text-sm text-gray-400 bg-white/5 p-4 rounded-lg">
                <Users className="h-5 w-5 mr-2" />
                <span>Joining as: {user?.user_metadata?.name || user?.email || 'Anonymous'}</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full py-3 px-6 bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white font-semibold rounded-lg transition-all hover:opacity-90"
              >
                Join Consultation
              </motion.button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default VideoCallPage;