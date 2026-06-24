# Quick Authentication Test Guide

## 🚀 Quick Start

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser with DevTools (F12)**

3. **Test login:**
   - Go to `/login`
   - Enter credentials
   - Watch the console

## 📊 What to Look For

### ✅ Successful Login Shows:
```
Login attempt for: user@example.com
Sign in successful: abc-123-def
Auth state changed: SIGNED_IN abc-123-def
Loading user...
Session result: { hasSession: true, userId: abc-123-def }
Profile loaded: abc-123-def
Navbar: User state changed: abc-123-def
```

### ❌ If Something's Wrong:
```
// Missing this? User not loaded
Navbar: User state changed: null

// Missing this? Session not created
Session result: { hasSession: false }

// Missing this? Profile not loaded (but auth should still work)
Profile loaded: abc-123-def
```

## 🔍 Quick Debug Commands

Open browser console and paste:

### Check if logged in:
```javascript
await window.authDebug.debugSession()
```

### Check store state:
```javascript
useUserStore.getState()
```

### Clear everything and start fresh:
```javascript
await window.authDebug.forceSignOut()
```

### Just clear cache (stay logged in):
```javascript
window.authDebug.clearAuthCache()
```

## 🎯 Test Checklist

- [ ] Login shows success message
- [ ] Navbar shows "Profile" and "Logout" (not "Login" and "Sign Up")
- [ ] Refresh page - stays logged in
- [ ] Can access `/video-consultation` without redirect to login
- [ ] Can access `/profile` and see user data
- [ ] Logout clears navbar to "Login" and "Sign Up"
- [ ] After logout, accessing `/profile` redirects to login

## 🐛 Common Issues

### Issue: Shows login buttons after logging in
**Fix:**
```javascript
// Check if user is actually in store
useUserStore.getState().user  // Should NOT be null

// If null, force reload:
await useUserStore.getState().loadUser()
```

### Issue: Video call redirects to login
**Fix:**
```javascript
// Check user state before clicking video call
console.log('User:', useUserStore.getState().user)

// If null after login, there's a state propagation issue
// Clear cache and try again:
window.authDebug.clearAuthCache()
window.location.reload()
```

### Issue: Session lost on refresh
**Check localStorage:**
```javascript
// Should see keys like: sb-[project-ref]-auth-token
Object.keys(localStorage).filter(k => k.startsWith('sb-'))

// If no keys, session isn't being stored
// Check .env file has correct Supabase credentials
```

## 📱 Testing on Mobile

1. Get your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Access app at `http://[your-ip]:5173`
3. Use mobile browser's dev tools for console logs

## 🎬 Video of Expected Behavior

### Normal Login Flow:
1. Click Login → Enter credentials → Submit
2. See "Login successful!" toast
3. Navbar immediately changes to show Profile/Logout
4. Navigate to home page
5. Can click any nav link without being asked to login again

### Video Call Access:
1. After logging in, click "Video Call"
2. Should show room ID input form
3. Should show "Joining as: [your email]"
4. Enter room ID and click "Join Consultation"
5. Should start video call (not redirect to login)

## 📞 Need Help?

If auth still doesn't work:

1. Copy **all console output** from the moment you click login
2. Run these commands and copy output:
   ```javascript
   await window.authDebug.debugSession()
   useUserStore.getState()
   Object.keys(localStorage).filter(k => k.startsWith('sb-'))
   ```
3. Share the console output and command results

The logs will show exactly where the flow is breaking!
