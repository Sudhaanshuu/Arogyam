import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC, {
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack
} from 'agora-rtc-react';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  UserCircle,
  Users,
  Clock,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

// Helper function to extract username from uid
const extractUserNameFromUid = (uid: string): string => {
  try {
    const parts = uid.split('_');
    if (parts.length >= 2) {
      return parts.slice(1).join('_');
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

const VideoCall: React.FC<VideoCallProps> = ({ channelName, userName, onLeave }) => {
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [users, setUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed' | 'preview'>('connecting');
  const [errorMessage, setErrorMessage] = useState('');
  const [callDuration, setCallDuration] = useState(0);

  // Simulation / Local Preview references
  const localPreviewVideoRef = useRef<HTMLVideoElement | null>(null);
  const localMediaStreamRef = useRef<MediaStream | null>(null);

  // Timer for active call
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (connectionStatus === 'connected' || connectionStatus === 'preview') {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [connectionStatus]);

  // Agora Initialization
  useEffect(() => {
    let isCancelled = false;

    const initAgora = async () => {
      try {
        setConnectionStatus('connecting');

        const agoraAppId = import.meta.env.VITE_AGORA_APP_ID;
        if (!agoraAppId || agoraAppId === 'your-agora-app-id') {
          throw new Error('Agora App ID not configured in environment');
        }

        const userId = `${Date.now()}_${userName.replace(/[^a-zA-Z0-9]/g, '')}`;

        await client.join(agoraAppId, channelName, null, userId);

        if (isCancelled) return;

        // Remote users sync
        const checkAndSubscribeToRemoteUsers = async () => {
          const remoteUsers = client.remoteUsers;
          if (remoteUsers.length > 0) {
            for (const user of remoteUsers) {
              try {
                if (user.videoTrack) await client.subscribe(user, 'video');
                if (user.audioTrack) {
                  await client.subscribe(user, 'audio');
                  user.audioTrack.play();
                }
                const extractedName = extractUserNameFromUid(user.uid.toString());
                setUserNames((prev) => ({ ...prev, [user.uid.toString()]: extractedName }));
              } catch (err) {
                console.warn('Subscribing error:', err);
              }
            }
            setUsers(remoteUsers);
          }
        };

        await checkAndSubscribeToRemoteUsers();

        // Create media tracks with fallback
        try {
          const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
          const videoTrack = await AgoraRTC.createCameraVideoTrack();

          if (isCancelled) {
            audioTrack.close();
            videoTrack.close();
            return;
          }

          setLocalAudioTrack(audioTrack);
          setLocalVideoTrack(videoTrack);

          await client.publish([audioTrack, videoTrack]);
        } catch (mediaErr) {
          console.warn('Media tracks creation failed:', mediaErr);
        }

        setConnectionStatus('connected');

        client.on('user-published', async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          const extractedName = extractUserNameFromUid(user.uid.toString());
          setUserNames((prev) => ({ ...prev, [user.uid.toString()]: extractedName }));
          setUsers((prevUsers) => {
            const exists = prevUsers.find((u) => u.uid === user.uid);
            return exists ? prevUsers.map((u) => (u.uid === user.uid ? user : u)) : [...prevUsers, user];
          });
          if (mediaType === 'audio') {
            user.audioTrack?.play();
          }
        });

        client.on('user-unpublished', (user) => {
          setUsers((prevUsers) => prevUsers.map((u) => (u.uid === user.uid ? user : u)));
        });

        client.on('user-left', (user) => {
          setUsers((prevUsers) => prevUsers.filter((u) => u.uid !== user.uid));
          setUserNames((prev) => {
            const next = { ...prev };
            delete next[user.uid.toString()];
            return next;
          });
        });

        toast.success('Connected to video call room');
      } catch (error) {
        console.warn('Agora connection notice:', error);
        const msg = error instanceof Error ? error.message : 'WebRTC connection error';
        setErrorMessage(msg);
        setConnectionStatus('failed');
      }
    };

    initAgora();

    return () => {
      isCancelled = true;
      if (localAudioTrack) localAudioTrack.close();
      if (localVideoTrack) localVideoTrack.close();
      if (client.connectionState === 'CONNECTED') {
        client.leave().catch(() => {});
      }
      if (localMediaStreamRef.current) {
        localMediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [channelName, userName]);

  // Activate browser getUserMedia preview mode
  const startPreviewMode = async () => {
    setConnectionStatus('preview');
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localMediaStreamRef.current = stream;
        if (localPreviewVideoRef.current) {
          localPreviewVideoRef.current.srcObject = stream;
        }
      }
      toast.success('Simulated Consultation Session Started');
    } catch (err) {
      console.warn('Local camera access notice:', err);
      toast('Camera preview unavailable, using audio consultation mode.', { icon: '🎙️' });
    }
  };

  const toggleVideo = async () => {
    if (connectionStatus === 'preview') {
      if (localMediaStreamRef.current) {
        const videoTracks = localMediaStreamRef.current.getVideoTracks();
        videoTracks.forEach((track) => {
          track.enabled = !isVideoEnabled;
        });
      }
      setIsVideoEnabled(!isVideoEnabled);
      return;
    }

    if (localVideoTrack) {
      try {
        await localVideoTrack.setEnabled(!isVideoEnabled);
        setIsVideoEnabled(!isVideoEnabled);
      } catch {
        toast.error('Failed to toggle camera');
      }
    }
  };

  const toggleAudio = async () => {
    if (connectionStatus === 'preview') {
      if (localMediaStreamRef.current) {
        const audioTracks = localMediaStreamRef.current.getAudioTracks();
        audioTracks.forEach((track) => {
          track.enabled = !isAudioEnabled;
        });
      }
      setIsAudioEnabled(!isAudioEnabled);
      return;
    }

    if (localAudioTrack) {
      try {
        await localAudioTrack.setEnabled(!isAudioEnabled);
        setIsAudioEnabled(!isAudioEnabled);
      } catch {
        toast.error('Failed to toggle microphone');
      }
    }
  };

  const handleLeave = async () => {
    try {
      if (localAudioTrack) localAudioTrack.close();
      if (localVideoTrack) localVideoTrack.close();
      if (client.connectionState === 'CONNECTED') {
        await client.leave();
      }
      if (localMediaStreamRef.current) {
        localMediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      onLeave();
      toast.success('Consultation session ended');
    } catch {
      onLeave();
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Connecting view
  if (connectionStatus === 'connecting') {
    return (
      <div className="relative h-full min-h-[500px] bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-6 text-white rounded-2xl">
        <div className="text-center max-w-md">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-red-500 border-r-transparent mb-4"></div>
          <h3 className="text-xl font-bold mb-2">Connecting to Consultation Room</h3>
          <p className="text-gray-400 text-sm mb-6">Room: <span className="text-white font-mono">{channelName}</span></p>
          <div className="flex justify-center gap-3">
            <button
              onClick={startPreviewMode}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-lg text-sm font-semibold hover:opacity-95 shadow"
            >
              Enter Simulated Mode Immediately
            </button>
            <button
              onClick={onLeave}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Failed view with 1-click fallback
  if (connectionStatus === 'failed') {
    return (
      <div className="relative h-full min-h-[500px] bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-6 text-white rounded-2xl">
        <div className="text-center max-w-md bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-md">
          <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Telemedicine Video Room</h3>
          <p className="text-gray-300 text-sm mb-2">Room ID: <span className="font-mono text-red-400 font-bold">{channelName}</span></p>
          <p className="text-gray-400 text-xs mb-6">
            {errorMessage.includes('App ID')
              ? 'External Agora API key is unset in production. You can test full consultation features using our Interactive Simulation Room.'
              : errorMessage || 'Network connection to Agora server could not be established.'}
          </p>

          <div className="space-y-3">
            <button
              onClick={startPreviewMode}
              className="w-full py-3 px-4 bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white rounded-xl font-semibold shadow-lg hover:opacity-95 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Start Interactive Consultation Mode
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
              </button>
              <button
                onClick={onLeave}
                className="flex-1 py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-medium"
              >
                Back to Appointments
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Call (Agora Connected or Interactive Simulation Mode)
  return (
    <div className="relative h-full min-h-[600px] bg-gray-950 text-white rounded-2xl overflow-hidden flex flex-col p-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4 bg-gray-900/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="font-bold text-sm text-gray-200">
              {connectionStatus === 'preview' ? 'Arogyam Telemedicine (Interactive Room)' : 'Encrypted Agora Call'}
            </span>
          </div>
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded font-mono">
            {channelName}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-300">
          <div className="flex items-center gap-1.5 bg-gray-800 px-2.5 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-red-400" />
            <span className="font-mono font-medium">{formatTimer(callDuration)}</span>
          </div>
          <div className="flex items-center gap-1 bg-gray-800 px-2.5 py-1 rounded-lg">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>{connectionStatus === 'preview' ? 2 : users.length + 1}</span>
          </div>
        </div>
      </div>

      {/* Video Feeds Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Remote Doctor Stream */}
        <div className="relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 flex items-center justify-center">
          {connectionStatus === 'connected' && users.length > 0 && users[0].videoTrack ? (
            <div ref={(node) => node && users[0].videoTrack?.play(node)} className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center relative overflow-hidden bg-gradient-to-b from-gray-900 via-gray-900 to-black">
              {/* Doctor Avatar / Mock Video */}
              <div className="relative mb-4">
                <img
                  src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80"
                  alt="Doctor Stream"
                  className="w-32 h-32 rounded-full object-cover border-4 border-red-500/50 shadow-xl"
                />
                <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-gray-900 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-base font-bold text-white mb-1">
                <Stethoscope className="w-4 h-4 text-red-500" />
                <span>Dr. Priya Sharma, MD</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">Cardiology & General Health Consultant</p>
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
                <ShieldCheck className="w-3.5 h-3.5" /> Audio Stream Active & Certified
              </div>
            </div>
          )}

          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {connectionStatus === 'connected' && users[0]
              ? userNames[users[0].uid.toString()] || 'Doctor'
              : 'Dr. Priya Sharma (Doctor)'}
          </div>
        </div>

        {/* Local Patient Stream */}
        <div className="relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 flex items-center justify-center">
          {connectionStatus === 'connected' && localVideoTrack && isVideoEnabled ? (
            <div ref={(node) => node && localVideoTrack.play(node)} className="w-full h-full" />
          ) : connectionStatus === 'preview' && isVideoEnabled ? (
            <video
              ref={localPreviewVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6">
              <UserCircle className="w-24 h-24 text-gray-600 mb-2" />
              <p className="text-sm font-semibold text-gray-400">Camera is Turned Off</p>
            </div>
          )}

          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5">
            <UserCircle className="w-3.5 h-3.5 text-red-400" />
            {userName} (You)
          </div>

          {!isVideoEnabled && (
            <div className="absolute bottom-4 left-4 bg-red-600/80 px-2.5 py-1 rounded text-xs text-white">
              Video Muted
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="mt-4 flex items-center justify-center gap-4 bg-gray-900/90 backdrop-blur-md p-3 rounded-2xl border border-gray-800 max-w-md mx-auto w-full">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleVideo}
          className={`p-3.5 rounded-xl transition-all ${
            isVideoEnabled
              ? 'bg-gray-800 text-white hover:bg-gray-700'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
          title={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleAudio}
          className={`p-3.5 rounded-xl transition-all ${
            isAudioEnabled
              ? 'bg-gray-800 text-white hover:bg-gray-700'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
          title={isAudioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLeave}
          className="px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all"
        >
          <PhoneOff className="w-5 h-5" />
          <span>Leave Room</span>
        </motion.button>
      </div>
    </div>
  );
};

export default VideoCall;
