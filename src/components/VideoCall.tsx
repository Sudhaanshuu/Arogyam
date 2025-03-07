import { useState, useEffect, useRef } from 'react';
import AgoraRTC, { 
  IAgoraRTCClient, 
  IAgoraRTCRemoteUser, 
  ICameraVideoTrack, 
  IMicrophoneAudioTrack 
} from 'agora-rtc-react';
import { Video, Mic, MicOff, VideoOff, PhoneOff } from 'lucide-react';
import { motion } from 'framer-motion';

// Create a client with the appropriate mode and codec
const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

interface VideoCallProps {
  channelName: string;
  onLeave: () => void;
}

interface ExtendedRemoteUser extends IAgoraRTCRemoteUser {
  videoRef?: React.RefObject<HTMLDivElement>;
}

const VideoCall = ({ channelName, onLeave }: VideoCallProps) => {
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<ExtendedRemoteUser[]>([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const localVideoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Function to initialize and join the channel
    const initialize = async () => {
      try {
        // Join the channel
        const uid = await client.join(
          import.meta.env.VITE_AGORA_APP_ID,
          channelName,
          null, // token - for production, you should use a proper token
          null  // optionalUid - let Agora assign one
        );
        console.log(`Joined channel ${channelName} with UID: ${uid}`);

        // Create and publish local tracks
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        
        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);

        // Play local video track
        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
        }

        // Publish local tracks to the channel
        await client.publish([audioTrack, videoTrack]);
        console.log("Published local tracks to channel");

        // Set up event listeners for remote users
        client.on("user-published", handleUserPublished);
        client.on("user-unpublished", handleUserUnpublished);
        client.on("user-left", handleUserLeft);
      } catch (error) {
        console.error("Error joining channel:", error);
      }
    };

    // Handler for when a remote user publishes a track
    const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
      console.log(`User ${user.uid} published ${mediaType} track`);
      
      // Subscribe to the remote user
      await client.subscribe(user, mediaType);
      console.log(`Subscribed to ${mediaType} track of user ${user.uid}`);

      // Create a unique identifier for this user
      const userWithRef = user as ExtendedRemoteUser;
      
      if (mediaType === "video") {
        // Update remote users state
        setRemoteUsers(prevUsers => {
          // Check if user already exists in our state
          const existingUserIndex = prevUsers.findIndex(u => u.uid === user.uid);
          
          if (existingUserIndex >= 0) {
            // Update existing user
            const updatedUsers = [...prevUsers];
            updatedUsers[existingUserIndex] = userWithRef;
            return updatedUsers;
          } else {
            // Add new user
            // userWithRef.videoRef = React.createRef();
            return [...prevUsers, userWithRef];
          }
        });
      }
      
      if (mediaType === "audio") {
        // Play audio immediately
        user.audioTrack?.play();
      }
    };

    // Handler for when a remote user unpublishes a track
    const handleUserUnpublished = (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
      console.log(`User ${user.uid} unpublished ${mediaType} track`);
      
      if (mediaType === "video") {
        // We don't need to remove the user, just update UI as needed
        setRemoteUsers(prevUsers => 
          prevUsers.map(u => u.uid === user.uid ? { ...u, videoTrack: undefined } : u)
        );
      }
    };

    // Handler for when a remote user leaves
    const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
      console.log(`User ${user.uid} left the channel`);
      // Remove user from our state
      setRemoteUsers(prevUsers => prevUsers.filter(u => u.uid !== user.uid));
    };

    // Initialize
    initialize();

    // Cleanup function
    return () => {
      // Unsubscribe from events
      client.off("user-published", handleUserPublished);
      client.off("user-unpublished", handleUserUnpublished);
      client.off("user-left", handleUserLeft);
      
      // Close local tracks
      localAudioTrack?.close();
      localVideoTrack?.close();
      
      // Leave the channel
      client.leave().then(() => {
        console.log("Left channel successfully");
      }).catch(err => {
        console.error("Error leaving channel:", err);
      });
    };
  }, [channelName]); // Only recreate when channel name changes

  // Effect to play remote video tracks when they're available and refs are ready
  useEffect(() => {
    remoteUsers.forEach(user => {
      if (user.videoTrack && user.videoRef && user.videoRef.current) {
        // Stop any existing playback first
        user.videoTrack.stop();
        // Then play into the right container
        user.videoTrack.play(user.videoRef.current);
        console.log(`Playing video for user ${user.uid}`);
      }
    });
  }, [remoteUsers]);

  // Toggle local video
  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  // Toggle local audio
  const toggleAudio = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  // Handle leaving the call
  const handleLeave = () => {
    localAudioTrack?.close();
    localVideoTrack?.close();
    client.leave();
    onLeave();
  };

  return (
    <div className="relative h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="relative z-10 h-full flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 flex-grow">
          {/* Local video */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-gray-800/50 rounded-xl overflow-hidden border-2 border-gray-700 backdrop-blur-sm"
          >
            <div ref={localVideoRef} className="w-full h-full aspect-video" />
            <div className="absolute bottom-4 left-4 text-white font-semibold bg-gray-900/50 px-3 py-1 rounded-lg">
              You {!isVideoEnabled && "(Video Off)"}
            </div>
          </motion.div>
          
          {/* Remote videos */}
          {remoteUsers.map(user => (
            <motion.div
              key={user.uid}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative bg-gray-800/50 rounded-xl overflow-hidden border-2 border-gray-700 backdrop-blur-sm"
            >
              <div ref={user.videoRef} className="w-full h-full aspect-video" />
              <div className="absolute bottom-4 left-4 text-white font-semibold bg-gray-900/50 px-3 py-1 rounded-lg">
                User {user.uid} {!user.videoTrack && "(Video Off)"}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Control buttons */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex justify-center gap-4 pb-8"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleVideo}
            className={`p-4 rounded-full ${isVideoEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'} transition-all`}
          >
            {isVideoEnabled ? (
              <Video size={24} className="text-white" />
            ) : (
              <VideoOff size={24} className="text-white" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleAudio}
            className={`p-4 rounded-full ${isAudioEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'} transition-all`}
          >
            {isAudioEnabled ? (
              <Mic size={24} className="text-white" />
            ) : (
              <MicOff size={24} className="text-white" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleLeave}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all"
          >
            <PhoneOff size={24} className="text-white" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default VideoCall;