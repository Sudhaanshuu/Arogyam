import { useState, useEffect } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack
} from 'agora-rtc-react';
import { Video, Mic, MicOff, VideoOff, PhoneOff, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

interface VideoCallProps {
  channelName: string;
  userName: string;
  onLeave: () => void;
}

const VideoCall = ({ channelName, userName, onLeave }: VideoCallProps) => {
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [users, setUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await client.join(
          import.meta.env.VITE_AGORA_APP_ID,
          channelName,
          null,
          null
        );

        // Set user name as client metadata
        client.setClientRole('host', { level: 1, name: userName });

        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        const videoTrack = await AgoraRTC.createCameraVideoTrack();

        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);
        await client.publish([audioTrack, videoTrack]);

        client.on('user-published', async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          
          if (mediaType === 'video') {
            setUsers(prevUsers => [...prevUsers, user]);
          }
          if (mediaType === 'audio') {
            user.audioTrack?.play();
          }
        });

        client.on('user-unpublished', (user) => {
          setUsers(prevUsers => prevUsers.filter(u => u.uid !== user.uid));
        });

        toast.success('Connected to video call');
      } catch (error) {
        console.error('Error initializing video call:', error);
        toast.error('Failed to connect to video call');
        onLeave();
      }
    };

    init();

    return () => {
      localAudioTrack?.close();
      localVideoTrack?.close();
      client.leave();
    };
  }, [channelName, userName]);

  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleAudio = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const handleLeave = () => {
    localAudioTrack?.close();
    localVideoTrack?.close();
    client.leave();
    onLeave();
    toast.success('Left video call');
  };

  return (
    <div className="relative h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-pink-500/20 to-orange-500/20 opacity-50" />
      </div>

      <div className="relative z-10 h-full flex flex-col p-4">
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Local Video */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-gray-800/50 rounded-xl overflow-hidden border border-white/10 backdrop-blur-sm"
          >
            {isVideoEnabled && localVideoTrack ? (
              <div ref={node => node && localVideoTrack.play(node)} className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserCircle className="h-20 w-20 text-gray-400" />
              </div>
            )}
            <div className="absolute bottom-4 left-4 text-white font-semibold bg-black/50 px-3 py-1 rounded-lg flex items-center">
              <UserCircle className="h-4 w-4 mr-2" />
              {userName} (You)
              {!isVideoEnabled && " - Camera Off"}
            </div>
          </motion.div>

          {/* Remote Videos */}
          {users.map(user => (
            <motion.div
              key={user.uid}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative bg-gray-800/50 rounded-xl overflow-hidden border border-white/10 backdrop-blur-sm"
            >
              {user.videoTrack ? (
                <div ref={node => node && user.videoTrack?.play(node)} className="w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UserCircle className="h-20 w-20 text-gray-400" />
                </div>
              )}
              <div className="absolute bottom-4 left-4 text-white font-semibold bg-black/50 px-3 py-1 rounded-lg flex items-center">
                <UserCircle className="h-4 w-4 mr-2" />
                Remote User
                {!user.videoTrack && " - Camera Off"}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Controls */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex justify-center gap-4 mt-4"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleVideo}
            className={`p-4 rounded-full ${
              isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
            } transition-all`}
          >
            {isVideoEnabled ? (
              <Video className="h-6 w-6 text-white" />
            ) : (
              <VideoOff className="h-6 w-6 text-white" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleAudio}
            className={`p-4 rounded-full ${
              isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
            } transition-all`}
          >
            {isAudioEnabled ? (
              <Mic className="h-6 w-6 text-white" />
            ) : (
              <MicOff className="h-6 w-6 text-white" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleLeave}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all"
          >
            <PhoneOff className="h-6 w-6 text-white" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default VideoCall;