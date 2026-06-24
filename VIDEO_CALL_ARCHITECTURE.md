# Video Call Architecture & Flow

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Agora RTC Channel                         │
│                   (Channel: roomId)                          │
└─────────────────────────────────────────────────────────────┘
                           ▲
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Client A   │   │   Client B   │   │   Client C   │
│   (Host)     │   │ (Participant)│   │ (Participant)│
└──────────────┘   └──────────────┘   └──────────────┘
```

## Connection Flow (Fixed)

### Before Fix ❌
```
1. User A joins channel
   └─> Publishes audio + video
   └─> Sees only themselves

2. User B joins channel
   └─> Publishes audio first
   └─> NOT added to User A's participant list (BUG!)
   └─> Then publishes video
   └─> Still not visible to User A

3. User C joins
   └─> Publishes video first
   └─> Added to User A's participant list
   └─> User A sees User C, but not User B!
```

### After Fix ✅
```
1. User A joins channel
   └─> Publishes audio + video
   └─> Checks for existing users (none found)
   └─> Sees only themselves

2. User B joins channel
   └─> Publishes audio first
   └─> ADDED to User A's participant list ✓
   └─> Then publishes video
   └─> Video stream updates in place ✓
   └─> User A sees User B immediately

3. User C joins
   └─> Checks for existing users
   └─> Finds User A and User B ✓
   └─> Subscribes to both
   └─> Publishes own streams
   └─> All users see each other ✓
```

## Event Handling Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Client Joins Channel                  │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Fetch Existing Remote Users (client.remoteUsers)       │
│  • Add all existing users to state                      │
│  • Extract usernames from UIDs                          │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Create & Publish Own Tracks                 │
│  • Camera Video Track                                   │
│  • Microphone Audio Track                               │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│               Listen for Events                          │
└─────────────────────────────────────────────────────────┘
           │              │              │
           ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │user-     │   │user-     │   │user-left │
    │published │   │unpublished│   │          │
    └──────────┘   └──────────┘   └──────────┘
           │              │              │
           ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │Subscribe │   │Update    │   │Remove    │
    │& Add to  │   │user in   │   │user from │
    │users[]   │   │users[]   │   │users[]   │
    └──────────┘   └──────────┘   └──────────┘
```

## State Management

### User State Array
```typescript
const [users, setUsers] = useState<IAgoraRTCRemoteUser[]>([]);
```
**Contains**: All remote participants who have joined the channel

### User Names Map
```typescript
const [userNames, setUserNames] = useState<Record<string, string>>({});
```
**Contains**: Mapping of user IDs to display names
```
{
  "1234567890_JohnDoe": "JohnDoe",
  "1234567891_DrSmith": "DrSmith",
  "1234567892_PatientA": "PatientA"
}
```

### Local Tracks
```typescript
const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
```

## User ID Format

```
Format: {timestamp}_{sanitizedUsername}
Example: 1719234567890_JohnDoe

Benefits:
✓ Unique across sessions
✓ Human-readable
✓ Easy to extract display name
✓ Prevents collisions
```

## Grid Layout Logic

```typescript
Participants  │  Grid Layout
──────────────┼──────────────────────────
1 (you only)  │  1 column (full width)
2 (you + 1)   │  1 col mobile, 2 cols desktop
3 (you + 2)   │  1 col mobile, 3 cols desktop
4 (you + 3)   │  2×2 grid
5+ (you + 4+) │  2 cols mobile, 3-4 cols desktop
```

## Media Track Types

### Video Track
- Source: Camera
- Actions: enable/disable, play in DOM element
- Visual: Shows video or placeholder icon

### Audio Track
- Source: Microphone
- Actions: enable/disable, play automatically
- Visual: Microphone indicator icon

## Troubleshooting Guide

### Issue: User not visible
**Check:**
1. Is user in `client.remoteUsers`? → Log it
2. Is user in `users` state array? → Check state
3. Did `user-published` event fire? → Check console
4. Was subscription successful? → Check for errors

### Issue: Video not playing
**Check:**
1. Does user have `videoTrack`? → Check user object
2. Is video track enabled? → Check `user.videoTrack.enabled`
3. Is DOM element available? → Check ref callback
4. Browser permissions granted? → Check console

### Issue: Audio not working
**Check:**
1. Does user have `audioTrack`? → Check user object
2. Is audio track playing? → Call `audioTrack.play()`
3. Browser autoplay policy → User interaction required
4. System volume/mute status → Check OS settings

## Key Improvements

| Feature | Before | After |
|---------|--------|-------|
| Participant visibility | Only host sees all | Everyone sees everyone |
| Late join support | ❌ | ✅ |
| Audio-only users | ❌ Hidden | ✅ Visible |
| Media type flexibility | Video only | Audio + Video |
| Initial user detection | ❌ | ✅ |
| Dynamic grid | Fixed 2 cols | 1-4 cols responsive |
| Participant count | ❌ | ✅ Displayed |
| Room name display | ❌ | ✅ Displayed |
