# Video Call Testing Checklist

## Pre-Testing Setup

- [ ] Ensure Agora App ID is configured in `.env`
- [ ] Install dependencies: `npm install`
- [ ] Start the development server: `npm run dev`
- [ ] Open application in multiple browser tabs/windows or devices

## Basic Functionality Tests

### Test 1: Two-Person Call
- [ ] Open app in Browser Tab 1 (User A)
- [ ] Login and join room "test-room-1"
- [ ] Open app in Browser Tab 2 (User B)  
- [ ] Login and join room "test-room-1"
- [ ] **Verify**: User A sees User B
- [ ] **Verify**: User B sees User A
- [ ] **Verify**: Participant count shows "2 Participants"

### Test 2: Three-Person Call
- [ ] User A and User B already in call from Test 1
- [ ] Open app in Browser Tab 3 (User C)
- [ ] Login and join room "test-room-1"
- [ ] **Verify**: User C sees User A and User B immediately
- [ ] **Verify**: User A and User B see User C
- [ ] **Verify**: Participant count shows "3 Participants"

### Test 3: Late Join (Most Important!)
- [ ] Start with Users A, B, and C in a call
- [ ] Open app in Browser Tab 4 (User D)
- [ ] User D joins the same room
- [ ] **Verify**: User D sees Users A, B, and C immediately upon joining
- [ ] **Verify**: All existing users see User D
- [ ] **Verify**: Participant count shows "4 Participants"

## Media Control Tests

### Test 4: Video Toggle
- [ ] User A turns off camera (click video button)
- [ ] **Verify**: User A's tile shows "Camera Off" badge
- [ ] **Verify**: Other users still see User A's tile (with placeholder icon)
- [ ] User A turns camera back on
- [ ] **Verify**: Video resumes for all participants

### Test 5: Audio Toggle
- [ ] User B mutes microphone (click mic button)
- [ ] **Verify**: User B's mic button shows "muted" state
- [ ] **Verify**: Other users cannot hear User B
- [ ] User B unmutes
- [ ] **Verify**: Audio resumes

### Test 6: Multiple Media Toggles
- [ ] User A: Camera OFF, Mic ON
- [ ] User B: Camera ON, Mic OFF
- [ ] User C: Camera OFF, Mic OFF
- [ ] **Verify**: All users remain visible with appropriate indicators

## Join/Leave Tests

### Test 7: User Leaves
- [ ] User C clicks "Leave Call" button
- [ ] **Verify**: User C returns to join room screen
- [ ] **Verify**: Users A and B no longer see User C
- [ ] **Verify**: Participant count updates to "2 Participants"

### Test 8: User Rejoins
- [ ] User C joins the room again
- [ ] **Verify**: User C sees all current participants
- [ ] **Verify**: All participants see User C again
- [ ] **Verify**: Participant count updates correctly

### Test 9: All Users Leave
- [ ] All users leave one by one
- [ ] **Verify**: Each user's exit is clean (no errors)
- [ ] **Verify**: Last user can leave without issues

## Edge Case Tests

### Test 10: Audio-First Join
- [ ] User A joins with audio and video
- [ ] User B joins but only grants microphone permission (no camera)
- [ ] **Verify**: User B is visible with placeholder icon
- [ ] **Verify**: User A can see User B's tile
- [ ] **Verify**: User A can hear User B

### Test 11: Network Interruption
- [ ] Start a call with 2+ users
- [ ] One user briefly loses network connection
- [ ] Network reconnects
- [ ] **Verify**: User reconnects and sees all participants
- [ ] **Verify**: Other users see reconnected user

### Test 12: Permission Denied
- [ ] User attempts to join but denies camera/microphone permissions
- [ ] **Verify**: Error message displayed
- [ ] **Verify**: User can choose to retry or go back

## UI/UX Tests

### Test 13: Responsive Layout
- [ ] Test with 1 participant (just you)
- [ ] Test with 2 participants
- [ ] Test with 3 participants
- [ ] Test with 4 participants
- [ ] Test with 5+ participants
- [ ] **Verify**: Grid layout adapts appropriately
- [ ] **Verify**: All video tiles are visible and sized reasonably

### Test 14: Mobile Responsive (if applicable)
- [ ] Open on mobile device or small screen
- [ ] Join a call with multiple participants
- [ ] **Verify**: Layout is usable on small screen
- [ ] **Verify**: Controls are accessible
- [ ] **Verify**: Video tiles stack properly

### Test 15: Username Display
- [ ] Join with different usernames
- [ ] **Verify**: Each user's name appears correctly on their tile
- [ ] **Verify**: "You" indicator shows on local video
- [ ] **Verify**: No username collisions or display issues

## Performance Tests

### Test 16: Multiple Simultaneous Joins
- [ ] Have 4-5 users join within seconds of each other
- [ ] **Verify**: All users see each other
- [ ] **Verify**: No crashes or freezes
- [ ] **Verify**: Video/audio quality is acceptable

### Test 17: Long Duration Call
- [ ] Keep call running for 10+ minutes
- [ ] **Verify**: No memory leaks (check browser dev tools)
- [ ] **Verify**: Video/audio quality remains stable
- [ ] **Verify**: No unexpected disconnections

## Console/Debug Tests

### Test 18: Console Logging
- [ ] Open browser developer console
- [ ] Join a call
- [ ] **Verify**: See "Joining channel" log
- [ ] **Verify**: See "Successfully joined channel" log
- [ ] **Verify**: See "Remote users already in channel" log
- [ ] **Verify**: See "User published" logs for other participants

### Test 19: Error Handling
- [ ] Try joining with invalid room ID
- [ ] Try joining without login
- [ ] **Verify**: Appropriate error messages shown
- [ ] **Verify**: No unhandled errors in console

## Browser Compatibility (Optional)

- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge
- [ ] **Verify**: Video call works in all browsers

## Success Criteria

✅ **CRITICAL FIXES VERIFIED:**
1. All participants can see each other regardless of join order
2. Users joining late can see all existing participants immediately
3. Users remain visible when toggling camera/audio
4. Participant count displays accurately
5. No console errors during normal operation

---

## Bug Report Template (if issues found)

```
**Bug Description:**

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**

**Actual Behavior:**

**Browser/Device:**

**Console Errors:**

**Screenshot/Video:**
```
