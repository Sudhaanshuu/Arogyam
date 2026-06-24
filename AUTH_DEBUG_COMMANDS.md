# 🔧 Authentication Debug Commands Reference

Quick reference for all debug commands available in browser console.

---

## 📊 Check Authentication Status

### Check if user is logged in
```javascript
await window.authDebug.debugSession()
```

**Expected Output (Logged In):**
```javascript
{
  session: {
    user: { id: "abc-123", email: "user@example.com" },
    expires_at: 1719234567
  },
  error: null
}
// Also logs to console:
// Session exists: true
// User ID: abc-123
// User email: user@example.com
// Expires at: Wed Jun 24 2026 11:30:00
```

**Expected Output (Logged Out):**
```javascript
{
  session: null,
  error: null
}
// Also logs:
// Session exists: false
```

---

## 🗄️ Check Application State

### View complete Zustand store state
```javascript
useUserStore.getState()
```

**Expected Output (Logged In):**
```javascript
{
  user: {
    id: "abc-123",
    email: "user@example.com",
    user_metadata: { ... }
  },
  profile: {
    id: "abc-123",
    full_name: "John Doe",
    email: "user@example.com",
    phone: "123-456-7890",
    city: "New York"
  },
  loading: false,
  error: null,
  initialized: true
}
```

**Expected Output (Logged Out):**
```javascript
{
  user: null,
  profile: null,
  loading: false,
  error: null,
  initialized: true
}
```

### Check only user state
```javascript
useUserStore.getState().user
```

### Check only profile
```javascript
useUserStore.getState().profile
```

### Check loading state
```javascript
useUserStore.getState().loading
```

### Check if initialized
```javascript
useUserStore.getState().initialized
```

---

## 🧹 Clear Authentication Data

### Clear auth cache (stay logged in if session valid)
```javascript
window.authDebug.clearAuthCache()
```

**Output:**
```
Cleared auth cache: 3 items removed
```

**What it does:**
- Removes all `sb-*` keys from localStorage
- Does NOT sign out from Supabase
- Refresh page to restore session if still valid

---

## 🚪 Force Logout

### Force complete logout and reload
```javascript
await window.authDebug.forceSignOut()
```

**What it does:**
1. Signs out from Supabase
2. Clears all localStorage auth data
3. Reloads the page
4. You'll be fully logged out

---

## 🔍 Advanced Debugging

### Check localStorage auth tokens
```javascript
Object.keys(localStorage).filter(k => k.startsWith('sb-'))
```

**Expected Output (Logged In):**
```javascript
[
  "sb-abcdefgh-auth-token",
  "sb-abcdefgh-auth-token-code-verifier"
]
```

**Expected Output (Logged Out):**
```javascript
[]
```

### View raw token data (DO NOT SHARE!)
```javascript
// ⚠️ Contains sensitive tokens - don't share this output!
localStorage.getItem(
  Object.keys(localStorage).find(k => k.includes('auth-token'))
)
```

### Check Supabase client connection
```javascript
// From your app context
supabase.auth.getSession()
```

---

## 🔄 Manual State Operations

### Force reload user data
```javascript
await useUserStore.getState().loadUser()
```

**What it does:**
- Fetches latest session from Supabase
- Updates user in store
- Loads profile from database

### Manual logout (without page reload)
```javascript
await useUserStore.getState().logout()
```

**What it does:**
- Signs out from Supabase
- Clears user and profile in store
- Does NOT reload page

### Set user manually (for testing)
```javascript
// ⚠️ Only for testing - don't use in production
useUserStore.getState().setUser({ id: "test", email: "test@test.com" })
```

---

## 📝 Console Logging

### Enable verbose Supabase logging
```javascript
// In supabase.ts, add to createClient options:
{
  global: {
    headers: {
      'X-Client-Info': 'arogyam-web'
    }
  },
  auth: {
    debug: true  // Add this line
  }
}
```

### Watch for auth state changes
```javascript
// Already set up in App.tsx
// Watch console for: "Auth state changed: [EVENT] [USER_ID]"
```

---

## 🧪 Testing Scenarios

### Test 1: Verify Login State
```javascript
// After logging in, run:
const session = await window.authDebug.debugSession()
const state = useUserStore.getState()

console.log('Session exists:', !!session.session)
console.log('User in store:', !!state.user)
console.log('Profile loaded:', !!state.profile)
console.log('Match:', session.session?.user?.id === state.user?.id)

// All should be true
```

### Test 2: Check State Synchronization
```javascript
// Check if Supabase and store are in sync
const { data } = await supabase.auth.getSession()
const storeUser = useUserStore.getState().user

console.log('Supabase user ID:', data.session?.user?.id)
console.log('Store user ID:', storeUser?.id)
console.log('Synchronized:', data.session?.user?.id === storeUser?.id)

// Should be true
```

### Test 3: Simulate Session Expiry
```javascript
// Clear token but keep trying to use app
window.authDebug.clearAuthCache()

// Try to do something
// Should trigger re-authentication or redirect to login
```

---

## 🐛 Troubleshooting Commands

### Problem: User shows as logged in but navbar doesn't update

```javascript
// 1. Check store
console.log('User:', useUserStore.getState().user)
console.log('Loading:', useUserStore.getState().loading)
console.log('Initialized:', useUserStore.getState().initialized)

// 2. Force reload if needed
await useUserStore.getState().loadUser()
```

### Problem: Session exists but user is null

```javascript
// 1. Check session
const session = await window.authDebug.debugSession()
console.log('Has session:', !!session.session)

// 2. Check store
const user = useUserStore.getState().user
console.log('Has user:', !!user)

// 3. If session exists but no user:
await useUserStore.getState().loadUser()
```

### Problem: Page refresh loses authentication

```javascript
// 1. Check if tokens are stored
const tokens = Object.keys(localStorage).filter(k => k.startsWith('sb-'))
console.log('Tokens in storage:', tokens.length)

// 2. If no tokens:
console.log('Session is not being persisted')
console.log('Check Supabase client configuration')

// 3. Check session on page load
// Should see in console: "App initializing..." then "Loading user..."
```

---

## 📊 State Monitoring

### Set up real-time monitoring
```javascript
// Monitor store changes
useUserStore.subscribe((state) => {
  console.log('Store changed:', {
    hasUser: !!state.user,
    hasProfile: !!state.profile,
    loading: state.loading,
    initialized: state.initialized
  })
})
```

### Monitor Supabase auth changes
```javascript
// Already set up in App.tsx
// Watch console for auth state changes
```

---

## 💡 Pro Tips

### Tip 1: Quick Status Check
```javascript
// One-liner to check everything
(async () => {
  const s = await window.authDebug.debugSession();
  const st = useUserStore.getState();
  console.log({ 
    session: !!s.session, 
    user: !!st.user, 
    profile: !!st.profile,
    match: s.session?.user?.id === st.user?.id 
  });
})()
```

### Tip 2: Copy State for Bug Reports
```javascript
// Copy sanitized state for sharing
const state = useUserStore.getState();
console.log(JSON.stringify({
  hasUser: !!state.user,
  userId: state.user?.id,
  hasProfile: !!state.profile,
  loading: state.loading,
  initialized: state.initialized,
  error: state.error
}, null, 2))
```

### Tip 3: Watch Auth Flow
```javascript
// See complete login flow in console
// Just watch console logs during login:
// 1. "Login attempt for: [email]"
// 2. "Sign in successful: [id]"
// 3. "Auth state changed: SIGNED_IN [id]"
// 4. "Loading user..."
// 5. "Session result: ..."
// 6. "Profile loaded: [id]"
// 7. "Navbar: User state changed. User ID: [id]"
```

---

## 🎯 Quick Reference Card

| Command | Purpose | Output |
|---------|---------|--------|
| `debugSession()` | Check if logged in | Session data |
| `getState()` | View app state | Store state |
| `clearAuthCache()` | Clear cached tokens | Success/count |
| `forceSignOut()` | Complete logout | Reloads page |
| `loadUser()` | Refresh user data | Updates store |
| `logout()` | Sign out | Clears state |

---

## 🚨 Important Notes

1. **Never share token data** - Contains sensitive authentication info
2. **Use in browser console only** - Not in production code
3. **Debug tools are for development** - May log sensitive data
4. **Check console regularly** - Logs show exactly what's happening
5. **Commands are async** - Use `await` where indicated

---

## 📞 Need More Help?

If these commands don't solve your issue:

1. Run complete diagnostic:
   ```javascript
   await window.authDebug.debugSession()
   useUserStore.getState()
   Object.keys(localStorage).filter(k => k.startsWith('sb-'))
   ```

2. Copy all output
3. Copy all console logs from login attempt
4. Check [QUICK_AUTH_TEST.md](./QUICK_AUTH_TEST.md) for common issues
5. Report with full context

Happy debugging! 🐛🔧
