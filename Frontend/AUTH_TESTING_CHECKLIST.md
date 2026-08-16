# 🧪 Auth Flow Testing Checklist

## قبل البدء بالاختبار:
- ✅ تأكد أن Backend يعمل على `http://localhost:3000`
- ✅ تأكد أن Frontend يعمل على `http://localhost:5173`
- ✅ افتح Browser DevTools (F12)
- ✅ اذهب إلى Network و Application tabs للمراقبة

---

## 🧪 Test 1: Fresh Registration

**الخطوات:**
1. اذهب إلى http://localhost:5173/register
2. ملء النموذج:
   - Full Name: `Test User`
   - Phone: `+1234567890`
   - Email: `test@example.com`
   - Password: `password123`
3. اضغط "Create Account"

**ما يجب أن يحدث:**

### في Browser DevTools - Network:
```
✅ POST /auth/register → 201
   Response Headers:
   ├─ Set-Cookie: accessToken=...
   ├─ Set-Cookie: refreshToken=...
   └─ Content should have: { data: { user, profile } }

✅ POST /auth/login (auto-login) → 201
   Response Headers:
   ├─ Set-Cookie: accessToken=... (new)
   ├─ Set-Cookie: refreshToken=... (new)
   └─ Content should have: { data: { userObj, deviceId } }

✅ GET /users/profiles (في onLoginSuccess) → 200
   Request Headers:
   ├─ Cookie: accessToken=...; refreshToken=...
   └─ Content should return array of profiles
```

### في Browser DevTools - Application → Cookies:
```
http://localhost:5173
├─ accessToken: (should exist, httpOnly)
├─ refreshToken: (should exist, httpOnly)
└─ deviceId: (localStorage not cookies)
```

### في Frontend UI:
```
✅ Success toast: "Registration successful!"
✅ Redirect to /profiles
✅ See Primary Profile
✅ Can click on profile to select it
```

### بعد اختيار Profile:
```
✅ Success toast: "Welcome to [profile name]!"
✅ Redirect to /
✅ Home page loads
✅ Can access /browse, /favorites, etc.
```

---

## 🧪 Test 2: Fresh Login

**الخطوات:**
1. Logout (if already logged in)
2. اذهب إلى http://localhost:5173/login
3. ملء النموذج:
   - Email: `test@example.com`
   - Password: `password123`
4. اضغط "Sign In"

**ما يجب أن يحدث:**

### في Network:
```
✅ POST /auth/login → 201
   Response Headers:
   ├─ Set-Cookie: accessToken=...
   ├─ Set-Cookie: refreshToken=...

✅ GET /users/profiles → 200
   Request Headers:
   ├─ Cookie: accessToken=...; refreshToken=...
```

### في Frontend UI:
```
✅ Success toast: "Login successful!"
✅ Redirect to /profiles
✅ See all profiles
✅ Select a profile → Redirect to Home
```

---

## 🧪 Test 3: Page Refresh while Authenticated

**الخطوات:**
1. تسجيل دخول بنجاح + اختيار profile
2. اذهب إلى أي صفحة (مثلاً /browse)
3. اضغط F5 (refresh)

**ما يجب أن يحدث:**

### في Network:
```
✅ GET /users/profiles (من checkAuth في App startup)
   Request Headers:
   ├─ Cookie: accessToken=...; refreshToken=...
   ✅ يجب أن يكون ناجح (Cookies ما زالت موجودة)
```

### في Frontend UI:
```
✅ Loading spinner يظهر مؤقتاً
✅ الصفحة الحالية ظهرت مرة أخرى
❓ Profile Token: سوف يكون lost (في memory state فقط)
   → User قد يضطر لإعادة اختيار profile أو استخدام localStorage (optional)
```

---

## 🧪 Test 4: Logout

**الخطوات:**
1. تسجيل دخول بنجاح
2. اذهب إلى /profiles
3. اضغط "Logout"

**ما يجب أن يحدث:**

### في Network:
```
✅ POST /auth/logout → 200
   Response Headers:
   ├─ Set-Cookie: accessToken=; Max-Age=0 (cleared)
   ├─ Set-Cookie: refreshToken=; Max-Age=0 (cleared)
```

### في Browser Cookies:
```
❌ accessToken: (should be cleared/removed)
❌ refreshToken: (should be cleared/removed)
```

### في Frontend UI:
```
✅ Success toast: "Logged out successfully"
✅ Redirect to /
✅ Home page visible
✅ Try to access /browse → Redirect to /login
```

---

## 🧪 Test 5: Protected Routes (Unauthenticated)

**الخطوات:**
1. تأكد أنك logout
2. اذهب إلى http://localhost:5173/browse (protected route)

**ما يجب أن يحدث:**

### في Frontend:
```
✅ ProtectedRoute detects: isAuthenticated = false
✅ Redirect to /login
```

---

## 🧪 Test 6: Protected Routes with Profile Token

**الخطوات:**
1. تسجيل دخول بنجاح
2. ❓ اختيار profile (لديك profile token الآن)
3. اذهب إلى /browse

**ما يجب أن يحدث:**

### في Network:
```
✅ All requests to /browse endpoints include:
   Headers:
   ├─ Cookie: accessToken=...; refreshToken=...
   ├─ Authorization: Bearer <profileToken>
   ├─ x-device-id: device-...
```

### في Frontend UI:
```
✅ /browse page loads
✅ Content displays
✅ Can favorite, watchlist, watch, etc.
```

---

## 🧪 Test 7: Token Expiration (Simulated)

**الخطوات:**
1. تسجيل دخول بنجاح
2. افتح Network tab
3. في DevTools Console أو قم بـ manual test:
   ```javascript
   // في browser console
   document.cookie = 'accessToken=expired'; // simulate expiration
   ```
4. حاول عمل action يحتاج authentication (مثلاً favorite)

**ما يجب أن يحدث:**

### في Network:
```
❌ First request → 401 (token expired)
   ↓
✅ Response Interceptor calls: refreshToken()
   PUT /auth/refresh-token → 200
   Response Headers:
   ├─ Set-Cookie: accessToken=<newToken>
   ├─ Set-Cookie: refreshToken=<newToken>
   ↓
✅ Retry original request → 200
```

### في Frontend UI:
```
✅ Action completes successfully
✅ No error shown to user
```

---

## 🧪 Test 8: Invalid Login Credentials

**الخطوات:**
1. اذهب إلى /login
2. أدخل بيانات خاطئة:
   - Email: `wrong@email.com`
   - Password: `wrongpass`
3. اضغط "Sign In"

**ما يجب أن يحدث:**

### في Network:
```
❌ POST /auth/login → 404 or 400
   Response: { message: "البيانات خاطئة" }
   ❌ NO Set-Cookie headers
```

### في Frontend UI:
```
✅ Error message displayed: "البيانات خاطئة"
✅ Toast error shown
✅ Stay on /login page
✅ ❌ Cookies NOT set
✅ isAuthenticated remains false
```

---

## 🧪 Test 9: Register Duplicate Email

**الخطوات:**
1. اذهب إلى /register
2. ملء النموذج بـ same email من existing account:
   - Email: `test@example.com` (موجود بالفعل)
3. اضغط "Create Account"

**ما يجب أن يحدث:**

### في Network:
```
❌ POST /auth/register → 409 or 400
   Response: { message: "Email already exists" }
   ❌ NO Set-Cookie headers
   ❌ NO auto-login
```

### في Frontend UI:
```
✅ Error message displayed
✅ Toast error shown
✅ Stay on /register page
✅ ❌ isAuthenticated remains false
```

---

## 🧪 Test 10: Profile Token Expiration

**الخطوات:**
1. تسجيل دخول بنجاح + اختيار profile
2. في ProfileContext اختبر:
   ```javascript
   // in console
   localStorage.setItem('profileToken', 'invalid');
   // or just clearProfileToken
   ```
3. حاول الوصول لـ protected endpoint مثل /favorites

**ما يجب أن يحدث:**

### في Network:
```
❌ GET /profiles/favorites → 403
   Response: { message: "profile token invalid" }
```

### في Frontend UI:
```
✅ Response Interceptor detects 403 + profile error
✅ clearProfileToken()
✅ Redirect to /profiles
✅ User can re-select profile
```

---

## 📊 Summary Table

| Test | Expected Result | Status |
|------|-----------------|--------|
| Fresh Register | Redirect to /profiles | ⬜ |
| Fresh Login | Redirect to /profiles | ⬜ |
| Page Refresh | Stay authenticated | ⬜ |
| Logout | Cookies cleared | ⬜ |
| Protected Route (no auth) | Redirect to /login | ⬜ |
| Protected Route (with auth) | Access granted | ⬜ |
| Token Expiry | Auto-refresh + retry | ⬜ |
| Invalid Credentials | Error shown | ⬜ |
| Duplicate Register | Error shown | ⬜ |
| Profile Token Expire | Redirect to /profiles | ⬜ |

**Mark as ✅ once tested successfully**

---

## 🔍 Debugging Tips

### إذا لم تظهر Cookies:
```javascript
// في Browser Console:
console.log(document.cookie);

// يجب أن تظهر:
// "accessToken=...; refreshToken=..."
```

### إذا كانت isAuthenticated = false بعد Login:
1. افتح Network tab
2. ابحث عن: POST /auth/login → 201
3. شوف Response headers → هل هناك Set-Cookie؟
4. شوف Response body → هل فيها: data.userObj أو data.user؟
5. Trigger onLoginSuccess() manually في console

### إذا كانت الـ Cookies موجودة لكن getProfiles() fail:
1. تأكد CORS مفعل في Backend: `credentials: true`
2. تأكد axios withCredentials: true موجود
3. جرب direct curl request:
   ```bash
   curl -b "accessToken=..." http://localhost:3000/api/v1/users/profiles
   ```

---

## 🎯 Final Checklist Before Deployment

- ⬜ جميع 10 tests pass ✅
- ⬜ Network requests تُظهر auth headers صحيح
- ⬜ Cookies تُحفظ و تُرسل مع requests
- ⬜ Protected routes تحمي بشكل صحيح
- ⬜ Token refresh يعمل بشكل تلقائي
- ⬜ Logout يمسح Cookies صحيح
- ⬜ Profile selection يعطي Profile Token
- ⬜ Page refresh يحافظ على auth state (Cookies)
- ⬜ Error handling يعرض رسائل واضحة
- ⬜ Loading states تظهر بشكل صحيح

---

**Last Updated**: 2024
**Ready for Testing**: ✅ YES
