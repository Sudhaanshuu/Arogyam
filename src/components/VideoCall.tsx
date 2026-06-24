import { useState, useEffect } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack
} from 'agora-rtc-react';
import { Video, Mic, MicOff, VideoOff, PhoneOff, UserCircle, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

// Helper function to extract username from uid
const extractUserNameFromUid = (uid: string): string => {
  try {
    // If uid follows our format: timestamp_username
    const parts = uid.split('_');
    if (parts.length >= 2) {
      return parts.slice(1).join('_'); // Join back in case username had underscores
    }
    return `User ${uid}`;
  } catch {
    return `User ${uid}`;
  }
};

interface VideoCallProps {
  channelName: string;
  userName: string;
  onLeave: () => void;
}

const VideoCall = ({ channelName, userName, onLeave }: VideoCallProps) => {
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [users, setUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting');

  useEffect(() => {
    const init = async () => {
      try {
        setConnectionStatus('connecting');
        
        // Check if Agora App ID is available
        const agoraAppId = import.meta.env.VITE_AGORA_APP_ID;
        if (!agoraAppId || agoraAppId === 'your-agora-app-id') {
          throw new Error('Agora App ID not configured');
        }

        console.log('Joining channel:', channelName, 'with App ID:', agoraAppId);
        
        // Generate a unique user ID that includes the user name
        const userId = `${Date.now()}_${userName.replace(/[^a-zA-Z0-9]/g, '')}`;
        
        await client.join(
          agoraAppId,
          channelName,
          null,
          userId
        );

        console.log('Successfully joined channel with userId:', userId);

        // Get all remote users already in the channel and add them to state
        const remoteUsers = client.remoteUsers;
        console.log('Remote users already in channel:', remoteUsers.length);
        if (remoteUsers.length > 0) {
          setUsers(remoteUsers);
          remoteUsers.forEach(user => {
            const extractedName = extractUserNameFromUid(user.uid.toString());
            setUserNames(prev => ({
              ...prev,
              [user.uid.toString()]: extractedName
            }));
          });
        }

        // Create audio and video tracks
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        const videoTrack = await AgoraRTC.createCameraVideoTrack();

        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);
        
        // Publish tracks
        await client.publish([audioTrack, videoTrack]);
        console.log('Successfully published tracks');

        setConnectionStatus('connected');

        client.on('user-published', async (user, mediaType) => {
          console.log('User published:', user.uid, mediaType);
          await client.subscribe(user, mediaType);
          
          // Extract username from uid if it follows our format
          const extractedName = extractUserNameFromUid(user.uid.toString());
          setUserNames(prev => ({
            ...prev,
            [user.uid.toString()]: extractedName
          }));
          
          // Add user to the users array regardless of media type
          setUsers(prevUsers => {
            const existingUser = prevUsers.find(u => u.uid === user.uid);
            if (existingUser) {
              // Update existing user with new media
              return prevUsers.map(u => u.uid === user.uid ? user : u);
            }
            // Add new user
            return [...prevUsers, user];
          });
          
          // Play audio track if it's available
          if (mediaType === 'audio') {
            user.audioTrack?.play();
          }
        });

        client.on('user-unpublished', (user, mediaType) => {
          console.log('User unpublished:', user.uid, mediaType);
          // Only remove user from array if they unpublished all media
          // Update the user in the array to reflect unpublished media
          setUsers(prevUsers => {
            return prevUsers.map(u => u.uid === user.uid ? user : u);
          });
        });

        client.on('user-left', (user) => {
          console.log('User left:', user.uid);
          setUsers(prevUsers => prevUsers.filter(u => u.uid !== user.uid));
          // Remove username when user leaves
          setUserNames(prev => {
            const newNames = { ...prev };
            delete newNames[user.uid.toString()];
            return newNames;
          });
        });

        toast.success('Connected to video call');
      } catch (error) {
        console.error('Error initializing video call:', error);
        setConnectionStatus('failed');
        
        let errorMessage = 'Failed to connect to video call';
        if (error instanceof Error) {
          if (error.message.includes('App ID')) {
            errorMessage = 'Video call service not configured';
          } else if (error.message.includes('permission')) {
            errorMessage = 'Camera/microphone permission denied';
          }
        }
        
        toast.error(errorMessage);
        // Don't automatically leave on error, let user decide
      }
    };

    init();

    return () => {
      // Cleanup function
      const cleanup = async () => {
        try {
          if (localAudioTrack) {
            localAudioTrack.close();
          }
          if (localVideoTrack) {
            localVideoTrack.close();
          }
          if (client.connectionState === 'CONNECTED') {
            await client.leave();
          }
        } catch (error) {
          console.error('Cleanup error:', error);
        }
      };
      
      cleanup();
    };
  }, [channelName, userName]);

  const toggleVideo = async () => {
    if (localVideoTrack) {
      try {
        await localVideoTrack.setEnabled(!isVideoEnabled);
        setIsVideoEnabled(!isVideoEnabled);
      } catch (error) {
        console.error('Error toggling video:', error);
        toast.error('Failed to toggle video');
      }
    }
  };

  const toggleAudio = async () => {
    if (localAudioTrack) {
      try {
        await localAudioTrack.setEnabled(!isAudioEnabled);
        setIsAudioEnabled(!isAudioEnabled);
      } catch (error) {
        console.error('Error toggling audio:', error);
        toast.error('Failed to toggle audio');
      }
    }
  };

  const handleLeave = async () => {
    try {
      if (localAudioTrack) {
        localAudioTrack.close();
      }
      if (localVideoTrack) {
        localVideoTrack.close();
      }
      if (client.connectionState === 'CONNECTED') {
        await client.leave();
      }
      onLeave();
      toast.success('Left video call');
    } catch (error) {
      console.error('Error leaving call:', error);
      onLeave(); // Still leave even if there's an error
    }
  };

  // Show connection status
  if (connectionStatus === 'connecting') {
    return (
      <div className="relative h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-500 border-r-transparent mb-4"></div>
          <p className="text-white text-lg">Connecting to video call...</p>
          <button 
            onClick={onLeave}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (connectionStatus === 'failed') {
    return (
      <div className="relative h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Video className="h-16 w-16 mx-auto mb-2" />
          </div>
          <p className="text-white text-lg mb-2">Failed to connect to video call</p>
          <p className="text-gray-400 text-sm mb-4">Please check your internet connection and try again</p>
          <div className="space-x-4">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
            <button 
              onClick={onLeave}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-pink-500/20 to-orange-500/20 opacity-50" />
      </div>

      <div className="relative z-10 h-full flex flex-col p-4">
        {/* Participant Count */}
        <div className="mb-4 flex justify-between items-center">
          <div className="text-white bg-black/50 px-4 py-2 rounded-lg flex items-center">
            <Users className="h-5 w-5 mr-2" />
            <span className="font-semibold">{users.length + 1} Participant{users.length !== 0 ? 's' : ''}</span>
          </div>
          <div className="text-white bg-black/50 px-4 py-2 rounded-lg text-sm">
            Room: <span className="font-semibold">{channelName}</span>
          </div>
        </div>

        {/* Dynamic grid based on number of participants */}
        <div className={`flex-grow grid gap-4 ${
          users.length === 0 ? 'grid-cols-1' :
          users.length === 1 ? 'grid-cols-1 md:grid-cols-2' :
          users.length === 2 ? 'grid-cols-1 md:grid-cols-3' :
          users.length === 3 ? 'grid-cols-2 md:grid-cols-2' :
          'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
        }`}>
          {/* Local Video */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-gray-800/50 rounded-xl overflow-hidden border border-white/10 backdrop-blur-sm min-h-[200px]"
          >
            {isVideoEnabled && localVideoTrack ? (
              <div ref={node => node && localVideoTrack.play(node)} className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserCircle className="h-20 w-20 text-gray-400" />
              </div>
            )}
            <div className="absolute top-4 left-4 text-white font-semibold bg-black/70 px-3 py-1 rounded-lg flex items-center text-sm">
              <UserCircle className="h-4 w-4 mr-2" />
              {userName} (You)
            </div>
            {!isVideoEnabled && (
              <div className="absolute bottom-4 left-4 text-white text-xs bg-red-600/80 px-2 py-1 rounded">
                Camera Off
              </div>
            )}
          </motion.div>

          {/* Remote Videos */}
          {users.map(user => (
            <motion.div
              key={user.uid}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative bg-gray-800/50 rounded-xl overflow-hidden border border-white/10 backdrop-blur-sm min-h-[200px]"
            >
              {user.videoTrack ? (
                <div ref={node => node && user.videoTrack?.play(node)} className="w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UserCircle className="h-20 w-20 text-gray-400" />
                </div>
              )}
              <div className="absolute top-4 left-4 text-white font-semibold bg-black/70 px-3 py-1 rounded-lg flex items-center text-sm">
                <UserCircle className="h-4 w-4 mr-2" />
                {userNames[user.uid.toString()] || `User ${user.uid}`}
              </div>
              {!user.videoTrack && (
                <div className="absolute bottom-4 left-4 text-white text-xs bg-red-600/80 px-2 py-1 rounded">
                  Camera Off
                </div>
              )}
              {user.hasAudio && (
                <div className="absolute top-4 right-4 bg-green-600/80 px-2 py-1 rounded-full">
                  <Mic className="h-3 w-3 text-white" />
                </div>
              )}
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