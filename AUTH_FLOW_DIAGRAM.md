# Authentication Flow Diagram

## 🔄 Login Flow

```
┌─────────────────┐
│  User clicks    │
│  Login button   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Login.tsx      │
│  onSubmit()     │  ← User enters email/password
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  signIn()       │
│  [supabase.ts]  │  ← Call Supabase auth API
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Supabase Auth  │
│  Creates        │  ← Server validates credentials
│  Session        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Session stored │
│  in localStorage│  ← localStorage: sb-[project]-auth-token
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Supabase emits │
│  SIGNED_IN      │  ← Auth state change event
│  event          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  App.tsx        │
│  Auth Listener  │  ← onAuthStateChange handler
│  catches event  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Calls          │
│  loadUser()     │  ← Load user data from session
│  [store.ts]     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  getSession()   │
│  from Supabase  │  ← Get current session
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Set user in    │
│  Zustand store  │  ← store.user = session.user
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Load profile   │
│  from database  │  ← SELECT * FROM users WHERE id = user.id
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Set profile in │
│  Zustand store  │  ← store.profile = profileData
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Navbar.tsx     │
│  React to       │  ← useUserStore() hook detects change
│  user change    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Navbar shows   │
│  Profile &      │  ← UI updated!
│  Logout buttons │
└─────────────────┘
```

## 🔄 Page Refresh Flow

```
┌─────────────────┐
│  User refreshes │
│  page (F5)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  App.tsx        │
│  useEffect()    │  ← Component mounts
│  runs           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Calls          │
│  loadUser()     │  ← Initialize auth state
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  getSession()   │
│  from Supabase  │  ← Check localStorage for session
└────────┬────────┘
         │
         ▼
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│Session│ │  No   │
│Found  │ │Session│
└───┬───┘ └───┬───┘
    │         │
    │         ▼
    │    ┌─────────────────┐
    │    │  User stays     │
    │    │  logged out     │
    │    │  Show Login UI  │
    │    └─────────────────┘
    │
    ▼
┌─────────────────┐
│  Restore user   │
│  state from     │  ← Same as login flow
│  session        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User stays     │
│  logged in      │
│  Show Profile   │
└─────────────────┘
```

## 🔄 Logout Flow

```
┌─────────────────┐
│  User clicks    │
│  Logout button  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Navbar.tsx     │
│  handleLogout() │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  store.logout() │
│  [store.ts]     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  signOut()      │
│  [supabase.ts]  │  ← Call Supabase signOut API
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Supabase       │
│  invalidates    │  ← Server invalidates session
│  session        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  localStorage   │
│  cleared        │  ← Remove sb-[project]-auth-token
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Supabase emits │
│  SIGNED_OUT     │  ← Auth state change event
│  event          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  App.tsx        │
│  Auth Listener  │  ← onAuthStateChange handler
│  catches event  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Clear user     │
│  state          │  ← store.user = null
│  store.profile  │     store.profile = null
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Navbar.tsx     │
│  React to       │  ← useUserStore() hook detects change
│  user = null    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Navbar shows   │
│  Login &        │  ← UI updated!
│  Signup buttons │
└─────────────────┘
```

## 🛡️ Protected Route Flow (Video Call Example)

```
┌─────────────────┐
│  User clicks    │
│  Video Call     │
│  in navbar      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Navigate to    │
│  /video-        │
│  consultation   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  VideoCallPage  │
│  component      │
│  renders        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Check user     │
│  from store     │  ← const { user } = useUserStore()
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────┐  ┌──────┐
│User │  │ No   │
│exists│  │user  │
└──┬──┘  └───┬──┘
   │         │
   │         ▼
   │    ┌─────────────────┐
   │    │  Show error     │
   │    │  toast          │
   │    │  Redirect to    │
   │    │  /login         │
   │    └─────────────────┘
   │
   ▼
┌─────────────────┐
│  Show video     │
│  call UI        │  ← User can join call
│  with room      │
│  input          │
└─────────────────┘
```

## 🔍 Debug Flow

```
┌─────────────────┐
│  Issue occurs   │
│  (user not      │
│  showing in     │
│  navbar)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Open browser   │
│  console (F12)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Look for logs: │
│  - Login attempt│
│  - Sign in      │
│  - Auth state   │
│  - Loading user │
│  - Session      │
│  - Navbar user  │
└────────┬────────┘
         │
         ▼
    ┌────┴────┐
    │         │
    ▼         ▼
┌──────┐  ┌──────┐
│Logs  │  │ Logs │
│present│  │missing│
└───┬──┘  └───┬──┘
    │         │
    │         ▼
    │    ┌─────────────────┐
    │    │  Identify       │
    │    │  missing step   │
    │    │  in flow        │
    │    └────────┬────────┘
    │             │
    │             ▼
    │    ┌─────────────────┐
    │    │  Run debug      │
    │    │  commands:      │
    │    │  debugSession() │
    │    │  getState()     │
    │    └─────────────────┘
    │
    ▼
┌─────────────────┐
│  Check store    │
│  state:         │
│  user: {...}    │
│  profile: {...} │
│  initialized:   │
│  true           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  If user is     │
│  null but       │
│  session exists │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Clear cache:   │
│  clearAuthCache()│
│  Reload page    │
└─────────────────┘
```

## 🔑 Key Components

### Supabase Client (`supabase.ts`)
- Manages connection to Supabase
- Handles auth API calls
- Stores session in localStorage
- Emits auth state events

### Zustand Store (`store.ts`)
- Central state management
- `user`: Current user object
- `profile`: User profile data
- `loading`: Loading state
- `initialized`: First load flag

### App Component (`App.tsx`)
- Sets up auth listener
- Responds to auth events
- Triggers loadUser()

### Navbar Component (`Navbar.tsx`)
- Subscribes to user state
- Shows/hides auth buttons
- Handles logout action

### Login Component (`Login.tsx`)
- Collects credentials
- Calls signIn()
- Handles errors

## 📊 State Management

```
┌─────────────────────────────────────┐
│         Zustand Store               │
│                                     │
│  user: User | null                  │
│  profile: Profile | null            │
│  loading: boolean                   │
│  initialized: boolean               │
│  error: string | null               │
│                                     │
│  Methods:                           │
│  - loadUser()                       │
│  - logout()                         │
│  - setUser()                        │
│  - setProfile()                     │
└─────────────────────────────────────┘
           │
           │ subscribed by
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌────────┐  ┌────────────┐
│Navbar  │  │VideoCallPage│
│        │  │            │
│Shows   │  │Checks user │
│buttons │  │for access  │
└────────┘  └────────────┘
```

## 🎯 Success Indicators

### ✅ Everything Working:
- Console logs show complete flow
- Navbar updates immediately after login
- Session persists on refresh
- Protected routes accessible
- Logout clears state properly

### ❌ Something Wrong:
- Missing console logs
- Navbar doesn't update
- Session lost on refresh
- Protected routes redirect to login
- Logout doesn't clear navbar

Use the debug commands and logs to identify exactly where the flow breaks!
