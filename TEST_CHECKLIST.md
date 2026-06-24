# ✅ Authentication Testing Checklist

Use this checklist to verify the authentication system is working correctly.

## 🚀 Pre-Testing Setup

- [ ] Dev server is running (`npm run dev`)
- [ ] Browser DevTools console is open (F12)
- [ ] Console is cleared (click 🚫 icon)
- [ ] You have test credentials ready

## 📝 Test 1: Fresh Login

- [ ] Navigate to `/login`
- [ ] Enter valid credentials
- [ ] Click "Sign in" button
- [ ] See "Login successful!" toast
- [ ] Console shows all these logs:
  - [ ] `Login attempt for: [email]`
  - [ ] `Sign in successful: [user-id]`
  - [ ] `Auth state changed: SIGNED_IN [user-id]`
  - [ ] `Loading user...`
  - [ ] `Session result: { hasSession: true, userId: [user-id] }`
  - [ ] `Navbar: User state changed. User ID: [user-id]`
- [ ] Navbar shows "Profile" button
- [ ] Navbar shows "Logout" button
- [ ] Navbar does NOT show "Login" or "Sign Up"
- [ ] Redirected to home page (`/`)

**Status:** ✅ Pass / ❌ Fail

---

## 📝 Test 2: Page Refresh (Session Persistence)

- [ ] After logging in, press F5 to refresh
- [ ] Console shows:
  - [ ] `App initializing...`
  - [ ] `Loading user...`
  - [ ] `Session result: { hasSession: true, userId: [user-id] }`
- [ ] Navbar still shows "Profile" and "Logout"
- [ ] User stays logged in
- [ ] No redirect to login page

**Status:** ✅ Pass / ❌ Fail

---

## 📝 Test 3: Protected Route Access (Video Call)

- [ ] While logged in, click "Video Call" in navbar
- [ ] Should navigate to `/video-consultation`
- [ ] Should NOT redirect to `/login`
- [ ] Page shows "Join Video Consultation" form
- [ ] Shows "Joining as: [your email]"
- [ ] Can enter room ID
- [ ] "Join Consultation" button is enabled

**Status:** ✅ Pass / ❌ Fail

---

## 📝 Test 4: Profile Access

- [ ] While logged in, click "Profile" in navbar
- [ ] Should navigate to `/profile`
- [ ] Should NOT redirect to `/login`
- [ ] Profile page shows user information
- [ ] No errors in console

**Status:** ✅ Pass / ❌ Fail

---

## 📝 Test 5: Logout

- [ ] Click "Logout" button in navbar
- [ ] Console shows:
  - [ ] `Logging out...`
  - [ ] `Auth state changed: SIGNED_OUT`
  - [ ] `Logout complete`
  - [ ] `Navbar: User state changed. User ID: null`
- [ ] Navbar shows "Login" button
- [ ] Navbar shows "Sign Up" button
- [ ] Navbar does NOT show "Profile" or "Logout"
- [ ] See "Logged out successfully" or similar toast

**Status:** ✅ Pass / ❌ Fail

---

## 📝 Test 6: Protected Route After Logout

- [ ] After logging out, try to access `/video-consultation` directly
- [ ] Should redirect to `/login` OR show login required message
- [ ] Cannot access video call features
- [ ] Toast shows "Please login to join a video call"

**Status:** ✅ Pass / ❌ Fail

---

## 📝 Test 7: Invalid Credentials

- [ ] Go to `/login`
- [ ] Enter invalid email or password
- [ ] Click "Sign in"
- [ ] See error toast with clear message
- [ ] Stays on login page
- [ ] No infinite loading
- [ ] Loading stops after error

**Status:** ✅ Pass / ❌ Fail

---

## 📝 Test 8: Multiple Browser Tabs

- [ ] Login in Tab 1
- [ ] Open Tab 2 with same site
- [ ] Tab 2 should show user as logged in
- [ ] Both tabs show "Profile" and "Logout"
- [ ] Logout in Tab 1
- [ ] Refresh Tab 2
- [ ] Tab 2 should now show logged out state

**Status:** ✅ Pass / ❌ Fail

---

## 📝 Test 9: Debug Commands

Open console and run each command:

### Command 1: Check Session
```javascript
await window.authDebug.debugSession()
```
- [ ] Shows session information
- [ ] `Session exists:` matches login state
- [ ] `User ID:` is correct
- [ ] `User email:` is correct

### Command 2: Check Store State
```javascript
useUserStore.getState()
```
- [ ] `user:` matches session user
- [ ] `profile:` has user data
- [ ] `loading:` is false
- [ ] `initialized:` is true
- [ ] `error:` is null

### Command 3: Clear Cache
```javascript
window.authDebug.clearAuthCache()
```
- [ ] Returns true or shows success message
- [ ] Console shows items removed
- [ ] After reload, need to login again

**Status:** ✅ Pass / ❌ Fail

---

## 📝 Test 10: Network Conditions

### Slow Network
- [ ] Open DevTools → Network tab
- [ ] Select "Slow 3G" from throttling dropdown
- [ ] Try to login
- [ ] Loading indicator shows
- [ ] Eventually succeeds or shows timeout error
- [ ] No infinite loading

### Offline
- [ ] Open DevTools → Network tab  
- [ ] Select "Offline"
- [ ] Try to login
- [ ] Shows network error
- [ ] Doesn't crash or hang
- [ ] Back online → login works

**Status:** ✅ Pass / ❌ Fail

---

## 🔍 Debugging Failed Tests

If any test fails:

### 1. Check Console Logs
Look for the exact point where logs stop appearing in the flow.

### 2. Run Debug Commands
```javascript
// Check session
await window.authDebug.debugSession()

// Check store
useUserStore.getState()

// Check localStorage
Object.keys(localStorage).filter(k => k.startsWith('sb-'))
```

### 3. Clear Everything
```javascript
// Nuclear option
await window.authDebug.forceSignOut()
```

### 4. Check Environment
- [ ] `.env` file has correct Supabase credentials
- [ ] `VITE_SUPABASE_URL` is set
- [ ] `VITE_SUPABASE_ANON_KEY` is set
- [ ] Database has `users` table
- [ ] Supabase project is accessible

---

## 📊 Overall Test Results

| Test | Status | Notes |
|------|--------|-------|
| 1. Fresh Login | ⬜ | |
| 2. Page Refresh | ⬜ | |
| 3. Video Call Access | ⬜ | |
| 4. Profile Access | ⬜ | |
| 5. Logout | ⬜ | |
| 6. Protected After Logout | ⬜ | |
| 7. Invalid Credentials | ⬜ | |
| 8. Multiple Tabs | ⬜ | |
| 9. Debug Commands | ⬜ | |
| 10. Network Conditions | ⬜ | |

### Final Score: ___/10 ✅

---

## 📱 Mobile Testing

Repeat key tests on mobile:

- [ ] Test 1: Fresh Login
- [ ] Test 2: Page Refresh
- [ ] Test 3: Video Call Access
- [ ] Test 5: Logout

Mobile-specific:
- [ ] Navbar menu opens/closes correctly
- [ ] Touch interactions work
- [ ] Responsive layout looks good
- [ ] No console errors on mobile

---

## 🎯 Success Criteria

All tests should pass (✅) for the authentication system to be considered production-ready.

If 8/10 or more pass → **Good to go!** Minor issues to address.
If 6-7/10 pass → **Needs work.** Some critical issues.
If less than 6/10 pass → **Major issues.** Review implementation.

---

## 📞 Reporting Issues

If tests fail, collect this information:

1. **Which test(s) failed:**
   - Test number and name

2. **Console output:**
   - All logs from the failed test
   - Any errors in red

3. **Debug command output:**
   ```javascript
   await window.authDebug.debugSession()
   useUserStore.getState()
   ```

4. **Environment:**
   - Browser and version
   - Operating system
   - Network conditions
   - Time of failure

5. **Steps to reproduce:**
   - Exact clicks and inputs
   - Starting state (logged in/out)
   - What you expected vs what happened

This information will help diagnose and fix any remaining issues!
