# StreamFlix Authentication Flow - توثيق شامل

## 📋 نظرة عامة

هذا المستند يوثق الـ Authentication Flow الكامل في StreamFlix Frontend بعد الإصلاحات.

### المبادئ الأساسية:
- ✅ **Cookies-based**: الـ Access Token و Refresh Token يتم حفظهما في httpOnly Cookies من Backend
- ✅ **withCredentials**: جميع requests تستخدم `withCredentials: true` في axios
- ✅ **No localStorage for tokens**: الـ Tokens لا تُحفظ في localStorage (في الـ Cookies فقط)
- ✅ **Auth State Synchronization**: بعد Login/Register يتم تحديث Auth Context مباشرة
- ✅ **Protected Routes**: تنتظر انتهاء Auth Check قبل Redirect

---

## 🔄 Auth Context (authContext.tsx)

### الحالات:
```typescript
isAuthenticated: boolean;    // متى يكون المستخدم logged in
isLoading: boolean;          // متى يتم فحص Authentication
user: any | null;            // بيانات المستخدم
userName: string | null;     // اسم المستخدم
```

### الدوال الرئيسية:

#### 1. `checkAuth()` - فحص حالة Authentication عند تحميل التطبيق
```typescript
// يُستدعى عند App mount
// يحاول جلب الـ Profiles (يتطلب auth cookies)
// إذا نجح → isAuthenticated = true
// إذا فشل → isAuthenticated = false (guest)
```

**التسلسل:**
```
App Start
  ↓
AuthProvider → useEffect → checkAuth()
  ↓
setIsLoading(true)
  ↓
Try: getProfiles() (يتطلب auth cookie)
  ↓
Success → setIsAuthenticated(true) + setUser()
  ↓
setIsLoading(false)
```

#### 2. `onLoginSuccess(response?)` - تحديث Auth State بعد Login/Register
```typescript
// يُستدعى من AuthPage بعد:
// - apiClient.login() ✅
// - apiClient.register() + auto-login ✅

await onLoginSuccess(loginResponse);

// تسلسل العمل:
// 1. setIsLoading(true)
// 2. Set user data from response (if available)
// 3. Verify with backend: getProfiles()
// 4. If success: setIsAuthenticated(true)
// 5. setIsLoading(false)
```

#### 3. `logout()` - تسجيل الخروج
```typescript
// يمسح:
// - Cookies (من backend في apiClient.logout())
// - Auth Context state
// - يعيد الاتجاه إلى Home
```

---

## 🔐 API Client (apiClient.ts)

### Configuration:
```typescript
this.client = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  withCredentials: true,  // ✅ يسمح بإرسال/استقبال Cookies
  headers: {
    'Content-Type': 'application/json',
    'x-device-id': this.deviceId,
  },
});
```

### Request Interceptor:
- يضيف `Profile Token` في `Authorization: Bearer <token>` (عند اختيار profile)
- يضيف `x-device-id` header

### Response Interceptor:
```typescript
// 401: Token غير صالح/انتهت صلاحيته
  → جرب refreshToken()
  → أعد الـ request
  
// 403 مع profile error: Profile Token غير صحيح
  → امسح Profile Token
  → أعد الاتجاه إلى /profiles
```

### Methods الهامة:

#### `register(data)`
```typescript
// Backend Response:
{
  success: true,
  message: "تم انشاء الحساب بنجاح",
  data: {
    user: { id, name, email, ... },
    profile: { _id, name, primaryProfile: true, ... }
  }
}

// Cookies Set by Backend:
// - accessToken (httpOnly, 1 hour)
// - refreshToken (httpOnly, 7 days)

// Return في apiClient:
response.data.data  // { user, profile }
```

#### `login(email, password)`
```typescript
// Backend Response:
{
  success: true,
  message: "تم تسجيل الدخول بنجاح",
  data: {
    userObj: { id, name, email, ... },
    deviceId: "..."
  }
}

// Cookies Set by Backend:
// - accessToken (httpOnly, 1 hour)
// - refreshToken (httpOnly, 7 days)

// Return في apiClient:
response.data.data  // { userObj, deviceId }
```

#### `getProfiles()`
```typescript
// يتطلب: auth cookies (من Browser)
// يرجع: array من profiles

// استخدام:
const profiles = await apiClient.getProfiles();
// Array: [{ _id, name, primaryProfile, pin, ... }, ...]
```

#### `selectProfile(profileId, pin?)`
```typescript
// Backend Response:
{
  success: true,
  message: "Profile selected successfully",
  data: {
    profile: { _id, name, avatar, ... },
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  ← Profile Token
  }
}

// استخدام:
const response = await apiClient.selectProfile(profileId, pin);
const { profile, token } = response.data || response;

// في Frontend:
setProfileToken(token);  // يُضاف إلى Authorization header
setCurrentProfile(profile);
```

#### `logout()`
```typescript
// Backend Response: POST /auth/logout
// Backend Action:
//   - clearCookie('accessToken')
//   - clearCookie('refreshToken')

// Frontend Action:
//   - clearProfileToken()
//   - setIsAuthenticated(false)
//   - redirect to /
```

---

## 🔀 Auth Flow التفصيلي

### 1️⃣ App Startup (الحالة الأولى)

```
Browser Load
  ↓
App mounts
  ↓
AuthProvider initializes
  ↓
useEffect → checkAuth()
  ↓
Check: Browser has auth cookies?
  │
  ├─ YES (من session سابقة)
  │   ↓
  │   getProfiles() ✅
  │   ↓
  │   isAuthenticated = true
  │   ↓
  │   User can access protected routes
  │
  └─ NO (session جديدة/انتهت)
      ↓
      getProfiles() ❌
      ↓
      isAuthenticated = false
      ↓
      User sees public pages only
```

### 2️⃣ Register Flow

```
User on Home Page
  ↓
Click "Sign Up"
  ↓
Navigate to /register
  ↓
Fill form: name, email, phone, password
  ↓
Submit
  ↓
┌─────────────────────────────────────────┐
│ AuthPage.handleSubmit() (register mode)  │
└─────────────────────────────────────────┘
  ↓
1️⃣ apiClient.register(name, email, phone, password)
   - Backend: creates User + Primary Profile
   - Backend: sets Cookies (accessToken, refreshToken)
   - Browser: receives Set-Cookie headers → saves Cookies
  ↓
2️⃣ apiClient.login(email, password)
   - Backend: validates credentials
   - Backend: re-sets Cookies (refreshed tokens)
   - Browser: Cookies updated with fresh tokens
  ↓
3️⃣ onLoginSuccess(loginResponse)
   - setIsLoading(true)
   - Try: getProfiles() → uses Cookies from Browser
   - Success: setIsAuthenticated(true)
   - Store user data
   - setIsLoading(false)
  ↓
4️⃣ Navigate to /profiles
   - ProtectedRoute checks:
     - isLoading? NO ✅
     - isAuthenticated? YES ✅
     → Render ProfilesPage
   ↓
5️⃣ ProfilesPage loads
   - Shows Primary Profile (created automatically)
   - Can create secondary profiles
   ↓
6️⃣ User selects Primary Profile
   - apiClient.selectProfile(primaryProfileId)
   - Backend generates Profile Token
   - Frontend: setProfileToken(token)
   ↓
7️⃣ User redirected to Home
   - Now has both: auth cookies + profile token
   - Can access all features
```

### 3️⃣ Login Flow

```
User on Home Page
  ↓
Click "Sign In"
  ↓
Navigate to /login
  ↓
Fill form: email, password
  ↓
Submit
  ↓
┌─────────────────────────────────────────┐
│ AuthPage.handleSubmit() (login mode)    │
└─────────────────────────────────────────┘
  ↓
1️⃣ apiClient.login(email, password)
   - Backend: validates credentials
   - Backend: sets Cookies (accessToken, refreshToken)
   - Browser: receives Set-Cookie headers → saves Cookies
  ↓
2️⃣ onLoginSuccess(loginResponse)
   - setIsLoading(true)
   - Try: getProfiles() → uses Cookies from Browser
   - Success: setIsAuthenticated(true)
   - setIsLoading(false)
  ↓
3️⃣ getProfiles()
   - Check if user has profiles
   │
   ├─ profiles.length === 0
   │   → Navigate to /create-profile
   │
   └─ profiles.length > 0
       → Navigate to /profiles
  ↓
4️⃣ ProfilesPage
   - User selects a profile
   - apiClient.selectProfile(profileId, pin?)
   - Frontend: setProfileToken(token)
   ↓
5️⃣ Navigate to Home
   - User is now fully authenticated
```

### 4️⃣ Login من Pending Action (مثلاً Subscribe)

```
Guest على Home
  ↓
Click Plan
  ↓
Navigate to /plan-details/:id
  ↓
Click Subscribe
  ↓
guest → يحفظ selectedPlanId في sessionStorage
  ↓
Redirect to /login
  ↓
┌─────────────────────────────────────────┐
│ User logs in (normal flow)               │
└─────────────────────────────────────────┘
  ↓
بعد onLoginSuccess:
  ↓
Check: sessionStorage.selectedPlanId?
  ↓
YES:
  ↓
  setItem('redirectToPlan', planId)
  ↓
  Navigate to /profiles
  ↓
  After profile selection:
  ↓
  Check: sessionStorage.redirectToPlan?
  ↓
  Navigate to /subscription?planId=...
  ↓
  User continues subscription flow
```

---

## 🛡️ Protected Routes

### ProtectedRoute Component

```typescript
interface Props {
  children: ReactNode;
  requireProfile?: boolean;  // require both auth + profile token
}
```

**Logic:**
```
Check: isLoading?
├─ YES → Show loading spinner (wait for auth check)
└─ NO
    ├─ Check: isAuthenticated?
    │   ├─ NO → Navigate to /login
    │   └─ YES
    │       ├─ Check: requireProfile?
    │       │   ├─ NO → Render children (auth only needed)
    │       │   └─ YES
    │       │       ├─ Check: profileToken?
    │       │       │   ├─ NO → Navigate to /profiles
    │       │       │   └─ YES → Render children
```

### Routes Structure:

```
/                    → Public (no auth needed)
/login               → Public
/register            → Public
/plans               → Public
/plan-details/:id    → Public
/content-details/:id → Public

/profiles            → Protected (auth only, no profile token)
/create-profile      → Protected (auth only, no profile token)

/browse              → Protected (auth + profile token)
/content/:id         → Protected (auth + profile token)
/watch/:id           → Protected (auth + profile token)
/favorites           → Protected (auth + profile token)
/watchlist           → Protected (auth + profile token)
/subscription        → Protected (auth + profile token)
/account             → Protected (auth + profile token)
/admin/*             → Protected (auth + profile token)
```

---

## 🍪 Cookies Management

### Backend تعيين:
```javascript
// في auth.controller.js

// بعد Register و Login:
cookiesService.setAccessToken(res, accessToken);
cookiesService.setRefreshToken(res, refreshToken);

// في cookiesService.js:
cookie('accessToken', value, {
  httpOnly: true,
  secure: false,  // لـ development (true في production)
  maxAge: 60 * 60 * 1000,  // 1 hour
  sameSite: 'strict'
})

cookie('refreshToken', value, {
  httpOnly: true,
  secure: false,
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
  sameSite: 'strict'
})
```

### Browser تخزين:
- ✅ Cookies يتم حفظها تلقائياً بواسطة Browser
- ✅ `withCredentials: true` في axios يسمح بإرسال الـ Cookies مع requests
- ✅ لا نحتاج لـ localStorage للـ Tokens

### Auth Middleware في Backend:
```javascript
// في Auth.js middleware

const token = cookiesService.getAccessToken(req);  // من req.cookies['accessToken']

if (!token) {
  return errorResponse(res, 403, "يجب تسجيل الدخول");
}

// Verify token
const decoded = jwtService.verifyAccessToken(token);
req._user = decoded;

// Check device
// ...

next();
```

---

## 🔄 Token Refresh Flow

```
Frontend makes authenticated request
  ↓
Axios sends request with Cookies (withCredentials: true)
  ↓
Backend checks: accessToken valid?
├─ YES → Process request
└─ NO → Return 401

If 401:
  ↓
Response Interceptor triggers
  ↓
Try: apiClient.refreshToken()
  ↓
Backend: 
  - Reads refreshToken من req.cookies
  - Generates new accessToken
  - Sets new Cookies
  ↓
Frontend:
  - Cookies updated by Browser
  - Retry original request
  ↓
Success
```

---

## 🧪 Testing Scenarios

### ✅ Scenario 1: Fresh Register
```
1. User fills register form
2. Submit
3. Check Browser DevTools → Network
   - POST /auth/register → 201
   - Response Headers → Set-Cookie: accessToken, refreshToken
4. Check Browser DevTools → Application → Cookies
   - accessToken ✅
   - refreshToken ✅
5. apiClient.getProfiles() → 200
6. onLoginSuccess() → isAuthenticated = true
7. Navigate to /profiles → ProtectedRoute allows
8. User sees Primary Profile
9. Select Primary Profile → Get Profile Token
10. Navigate to / → Home loads
```

### ✅ Scenario 2: Fresh Login
```
1. User fills login form
2. Submit
3. Check Cookies set → ✅
4. Check onLoginSuccess triggers → ✅
5. getProfiles() returns profiles → ✅
6. Navigate to /profiles → ✅
7. Select profile → Get Profile Token → ✅
8. Navigate to Home → ✅
```

### ✅ Scenario 3: Page Refresh while Authenticated
```
1. User logged in + profile selected
2. Press F5 (refresh)
3. App remounts → AuthProvider → checkAuth()
4. getProfiles() succeeds (cookies sent automatically)
5. isAuthenticated = true
6. User stays on same page
7. Profile token lost (in-memory) → need re-selection? ❓
   → أو نستخدم ProfileContext + localStorage for profileToken?
```

### ✅ Scenario 4: Logout
```
1. User clicks Logout
2. apiClient.logout() → POST /auth/logout
3. Backend: clearCookie('accessToken'), clearCookie('refreshToken')
4. Browser: Cookies removed
5. Frontend: isAuthenticated = false
6. Redirect to /
7. Try access /browse → ProtectedRoute redirects to /login
```

### ✅ Scenario 5: Token Expiry
```
1. User logged in for 1 hour
2. Access token expires
3. Make request → 401
4. Response Interceptor: try refreshToken()
5. Backend: uses refreshToken من Cookies
6. Generate new accessToken
7. Set new Cookies
8. Retry request → Success
```

---

## ⚠️ الفرق بين Auth Token و Profile Token

| الخاصية | Auth Token (Access) | Profile Token |
|---------|------------------|-----------------|
| **الحفظ** | httpOnly Cookie | في Memory (React state) |
| **المدة** | 1 hour | Session (يُفقد عند refresh) |
| **الاستخدام** | All API requests | Profile-specific requests |
| **الحصول عليه** | بعد login/register | بعد selectProfile() |
| **الحاجة له** | عند اختيار profile | للوصول لـ content |

---

## 🚀 Summary of Changes

### Files Modified:

1. **authContext.tsx**
   - ✅ أضفنا `onLoginSuccess()` method
   - ✅ حسّنا `checkAuth()` لالتقاط جميع response formats
   - ✅ أضفنا error handling أفضل

2. **AuthPage.tsx**
   - ✅ استبدال `setUserName` بـ `onLoginSuccess`
   - ✅ استدعاء `onLoginSuccess()` فورياً بعد login/register
   - ✅ تحسين comments للـ flow

3. **apiClient.ts**
   - ✅ بالفعل صحيح (withCredentials موجود)
   - ✅ لا تغييرات مطلوبة

4. **ProfilesPage.tsx**
   - ✅ بالفعل صحيح
   - ✅ تستخرج token من response بشكل صحيح

5. **ProtectedRoute.tsx**
   - ✅ بالفعل صحيح
   - ✅ تنتظر loading قبل redirect

---

## 🔗 Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      APP STARTUP                                │
├─────────────────────────────────────────────────────────────────┤
│  AuthProvider initializes                                        │
│     ↓                                                            │
│  useEffect → checkAuth()                                         │
│     ├─ getProfiles() (with Cookies)                             │
│     │   ├─ SUCCESS → isAuthenticated = true                     │
│     │   └─ FAIL → isAuthenticated = false                       │
│     ↓                                                            │
│  setIsLoading(false)                                             │
│     ↓                                                            │
│  Routes render based on isAuthenticated                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴───────────────────┐
        │                                       │
    ┌────────┐                          ┌──────────────┐
    │ PUBLIC │                          │ PROTECTED    │
    ├────────┤                          ├──────────────┤
    │ /      │                          │ /profiles    │
    │ /login │                          │ /create-prof │
    │ /reg.. │  (if !auth)              │ /browse      │
    │        │  ──────────→ /login      │ (if auth+tok)│
    └────────┘                          └──────────────┘
        ↑
        │ User clicks Register/Login
        │
    ┌─────────────────────────────────────┐
    │ AuthPage - Register or Login        │
    ├─────────────────────────────────────┤
    │ 1. apiClient.login/register         │
    │    ↓ Cookies set by Backend         │
    │ 2. onLoginSuccess()                 │
    │    ↓ getProfiles() (Cookies sent)   │
    │    ↓ isAuthenticated = true         │
    │ 3. getProfiles() count              │
    │ 4. Navigate to /profiles or /create │
    └─────────────────────────────────────┘
        ↓
    ┌─────────────────────────────────────┐
    │ ProfilesPage - Select Profile       │
    ├─────────────────────────────────────┤
    │ selectProfile()                     │
    │    ↓ Backend returns: { profile,    │
    │      token: profileToken }          │
    │ setProfileToken(token)              │
    │ Navigate to /                       │
    └─────────────────────────────────────┘
        ↓
    ┌─────────────────────────────────────┐
    │ App - Fully Authenticated           │
    ├─────────────────────────────────────┤
    │ Access all features                 │
    │ Profile Token sent with requests    │
    │ Can watch, favorite, etc.           │
    └─────────────────────────────────────┘
```

---

## 📝 Notes

- ✅ جميع الـ Cookies يتم التعامل معها من قبل الـ Browser تلقائياً
- ✅ لا نحتاج `localStorage` للـ Tokens
- ✅ `withCredentials: true` يسمح بإرسال الـ Cookies مع requests
- ✅ Backend CORS مضبوط على `credentials: true`
- ✅ Profile Token يتم فقدانه عند refresh (expected - user يحتاج اختيار profile مرة أخرى)
- ⚠️ قد نريد حفظ selected profile في localStorage لتجنب re-selection عند refresh (اختياري)

---

**Updated**: 2024
**Status**: ✅ Ready for Testing
