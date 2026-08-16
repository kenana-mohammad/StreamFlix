# 📋 StreamFlix Backend APIs - الوثائق الشاملة الكاملة

## 🎯 ملخص شامل

| المعلومة | التفاصيل |
|---------|----------|
| **Total Endpoints** | 105+ API Endpoint |
| **Base URL** | http://localhost:3000/api/v1 |
| **API Version** | v1 |
| **Auth Type** | Bearer Token + Cookies |
| **Content-Type** | application/json |

---

## 📌 جدول المحتويات السريع

| رقم | المجموعة | عدد APIs | الحالة |
|------|---------|---------|---------|
| 1 | Authentication | 5 | ✅ |
| 2 | Home | 1 | ✅ |
| 3 | Content (Movies/Series/Episodes) | 29 | ✅ |
| 4 | Plans | 7 | ✅ |
| 5 | Subscriptions | 6 | ✅ |
| 6 | Profiles | 12 | ✅ |
| 7 | Ratings | 4 | ✅ |
| 8 | Watchlist | 3 | ✅ |
| 9 | Favorites | 3 | ✅ |
| 10 | Watch History | 5 | ✅ |
| 11 | Users | 2 | ✅ |
| 12 | Devices | 2 | ✅ |
| 13 | Genres | 6 | ✅ |
| 14 | Cast | 5 | ✅ |
| 15 | Recommendations | 1 | ✅ |
| 16 | Upload | 4 | ✅ |
| 17 | Dashboard | 4 | ✅ |

---

## 🔐 1️⃣ AUTHENTICATION APIs (5 Endpoints)

### 1.1 Register (تسجيل حساب جديد)
\\\
POST /api/v1/auth/register
Authorization: Public
Content-Type: application/json

Request Body:
{
  "name": "string (2-100 chars)",
  "email": "string (unique)",
  "phone": "string (optional)",
  "password": "string (8+ chars, uppercase, lowercase, number, symbol)"
}

Response (201):
{
  "user": {
    "_id": "string",
    "name": "string",
    "email": "string",
    "role": "user",
    "status": "active"
  },
  "profile": {
    "_id": "string",
    "name": "Primary",
    "isPrimary": true
  }
}
\\\

---

### 1.2 Login (تسجيل الدخول)
\\\
POST /api/v1/auth/login
Authorization: Public
Headers: x-device-id: device-123 (optional)

Request Body:
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "deviceType": "web" | "mobile" | "tablet" | "smart-tv" (optional)
}

Response (201):
{
  "userObj": {...},
  "deviceId": "unique-device-id",
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}

Cookies Set:
- accessToken: valid for 15 minutes
- refreshToken: valid for 7 days
\\\

---

### 1.3 Logout (تسجيل الخروج)
\\\
POST /api/v1/auth/logout
Authorization: Auth Required
Content-Type: application/json

Response (200):
{
  "msg": "تم تسجيل الخروج بنجاح"
}

Action: Clears accessToken and refreshToken cookies
\\\

---

### 1.4 Refresh Token (تجديد التوكن)
\\\
PUT /api/v1/auth/refresh-token
Authorization: Public (requires refreshToken cookie)

Response (200):
{
  "accessToken": "new-access-token",
  "refreshToken": "new-refresh-token"
}

Cookies Updated:
- New accessToken and refreshToken
\\\

---

### 1.5 Change Password (تغيير كلمة المرور)
\\\
PUT /api/v1/auth/change-password
Authorization: Auth + Primary Profile

Request Body:
{
  "oldPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}

Validations:
- oldPassword must match current password
- newPassword must be strong
- newPassword must differ from oldPassword

Response (200):
{
  "msg": "تم تغيير كلمة المرور بنجاح"
}
\\\

---

## 🏠 2️⃣ HOME API (1 Endpoint)

\\\
GET /api/v1/home
Authorization: Public

Response (200):
{
  "featured": [{...content objects...}],
  "trending": [{...content objects...}],
  "topRated": [{...content objects...}],
  "recommendedForYou": [{...content objects...}]
}
\\\

---

## 🎬 3️⃣ CONTENT APIs (29 Endpoints)

### 3.1 Movies (8 Endpoints)

#### Admin Get All
\\\
GET /api/v1/content/movie/admin
Authorization: Auth + Content Manager

Query Parameters:
- type: "movie" (optional)

Response (200): Array of movies
\\\

#### Admin Get One
\\\
GET /api/v1/content/movie/admin/:id
Authorization: Auth + Content Manager

Response (200): Movie object with full details
\\\

#### Admin Create
\\\
POST /api/v1/content/movie/admin
Authorization: Auth + Content Manager

Request Body:
{
  "title": "string",
  "description": "string",
  "duration": "number (in minutes)",
  "releaseDate": "date",
  "poster": "url-string",
  "video": "url-string",
  "quality": "480p" | "720p" | "1080p" | "4K",
  "genreIds": ["id1", "id2"],
  "cast": ["castId1", "castId2"]
}

Response (201): Created movie object
\\\

#### Admin Update
\\\
PUT /api/v1/content/movie/admin/:id
Authorization: Auth + Content Manager

Request Body: Same as Create
Response (200): Updated movie object
\\\

#### Admin Change Status
\\\
PATCH /api/v1/content/movie/admin/:id/status
Authorization: Auth + Content Manager

Request Body:
{
  "status": "active" | "inactive"
}

Response (200): Updated movie with new status
\\\

#### Admin Delete
\\\
DELETE /api/v1/content/movie/admin/:id
Authorization: Auth + Content Manager

Response (200): Success message
\\\

#### Public Get All
\\\
GET /api/v1/content/movie/client
Authorization: Public

Response (200): Array of active movies
\\\

#### Public Get One
\\\
GET /api/v1/content/movie/client/:id
Authorization: Public

Response (200): Movie details (if active)
\\\

---

### 3.2 Series (8 Endpoints)

Same structure as Movies but with Series-specific fields:
- seasons: Array of season IDs
- totalSeasons: number

Endpoints:
- GET /api/v1/content/series/admin
- GET /api/v1/content/series/admin/:id
- POST /api/v1/content/series/admin
- PUT /api/v1/content/series/admin/:id
- PATCH /api/v1/content/series/admin/:id/status
- DELETE /api/v1/content/series/admin/:id
- GET /api/v1/content/series/client
- GET /api/v1/content/series/client/:id

---

### 3.3 Seasons (5 Endpoints)

\\\
GET /api/v1/content/season/series/:seriesId (Public)
POST /api/v1/content/season/admin/:seriesId (Admin Create)
PUT /api/v1/content/season/admin/:id (Admin Update)
PATCH /api/v1/content/season/admin/:id/status (Admin Status)
DELETE /api/v1/content/season/admin/:id (Admin Delete)

Fields:
- seasonNumber: number
- title: string
- description: string
- episodes: Array
\\\

---

### 3.4 Episodes (6 Endpoints)

\\\
GET /api/v1/content/episode/:id (Public Get One)
GET /api/v1/content/episode/season/:seasonId (Public List)
POST /api/v1/content/episode/admin/season/:seasonId (Admin Create)
PUT /api/v1/content/episode/admin/:id (Admin Update)
PATCH /api/v1/content/episode/admin/:id/status (Admin Status)
DELETE /api/v1/content/episode/admin/:id (Admin Delete)

Fields:
- episodeNumber: number
- title: string
- description: string
- duration: number (minutes)
- video: url
\\\

---

### 3.5 Content Relations (9 Endpoints)

#### Admin Add Genres
\\\
POST /api/v1/relation/admin/content/:id/genres
Authorization: Auth + Content Manager

Request Body:
{
  "genreIds": ["id1", "id2", "id3"]
}

Response (200): Success
\\\

#### Admin Remove Genre
\\\
DELETE /api/v1/relation/admin/content/:id/genres/:genreId
Authorization: Auth + Content Manager

Response (200): Success
\\\

#### Admin Add Cast
\\\
POST /api/v1/relation/admin/content/:id/cast
Authorization: Auth + Content Manager

Request Body:
{
  "castIds": ["castId1", "castId2"]
}

Response (200): Success
\\\

#### Admin Update Cast Role
\\\
PUT /api/v1/relation/admin/content/:id/cast/:castId
Authorization: Auth + Content Manager

Request Body:
{
  "role": "Lead Actor" | "Supporting Actor" | "Guest"
}

Response (200): Updated
\\\

#### Admin Remove Cast
\\\
DELETE /api/v1/relation/admin/content/:id/cast/:castId
Authorization: Auth + Content Manager

Response (200): Success
\\\

#### Public Get Genres
\\\
GET /api/v1/relation/contents/:id/genres
Authorization: Public

Response (200): Array of genres
\\\

#### Public Get Cast
\\\
GET /api/v1/relation/contents/:id/cast
Authorization: Public

Response (200): Array of cast members
\\\

#### Public Get By Genre
\\\
GET /api/v1/relation/genres/:genreId/contents
Authorization: Public

Response (200): Array of content items
\\\

#### Public Get By Cast
\\\
GET /api/v1/relation/cast/:castId/contents
Authorization: Public

Response (200): Array of content items
\\\

---

## �� 4️⃣ PLANS APIs (7 Endpoints)

\\\
GET /api/v1/plans (Public)
- Response: All plans

GET /api/v1/plans/active (Public)
- Response: Only active plans

GET /api/v1/plans/:id (Public)
- Response: Plan details

POST /api/v1/plans (Admin Create)
- Auth: Super Admin
- Body: { name, description, price, duration, maxDevices, maxProfiles, quality, isLimited, maxMovies, maxSeries }
- Response (201): Created plan

PUT /api/v1/plans/:id (Admin Update)
- Auth: Super Admin
- Body: Same as create

DELETE /api/v1/plans/:id (Admin Delete)
- Auth: Super Admin

PATCH /api/v1/plans/:id/toggle-status (Admin Toggle)
- Auth: Super Admin
- Response: Plan with toggled status
\\\

---

## 🛒 5️⃣ SUBSCRIPTIONS APIs (6 Endpoints)

\\\
GET /api/v1/subscriptions/my-subscriptions
- Auth: Auth + Primary Profile
- Response: User subscriptions with optional status filter

GET /api/v1/subscriptions/my-subscriptions/:id
- Auth: Auth + Primary Profile
- Response: Subscription details

POST /api/v1/subscriptions/:planId (Create)
- Auth: Auth + Primary Profile
- Body: { autoRenew?, notes?, paymentMethod?, currency? }
- Response (201): New subscription

PUT /api/v1/subscriptions/renewManual/:subscriptionId (Renew)
- Auth: Auth + Primary Profile
- Body: { autoRenew?, notes?, paymentMethod?, currency? }

POST /api/v1/subscriptions/upgrade-subscription/:planId (Upgrade)
- Auth: Auth + Primary Profile + Active subscription check
- Body: { autoRenew?, notes?, paymentMethod?, currency? }

PUT /api/v1/subscriptions/cancel-subscription/:id (Cancel)
- Auth: Auth + Primary Profile
- Response: Cancelled subscription details
\\\

---

## 👤 6️⃣ PROFILES APIs (12 Endpoints)

### Basic Profile Management

\\\
GET /api/v1/users/profiles
- Auth: Auth
- Query: query (optional search)
- Response: All user profiles

POST /api/v1/users/profiles (Create)
- Auth: Auth + Primary Profile
- Body: { name (3-50 chars), pin? (6 chars), avatar?, isKids?, minAge? }
- Response (201): New profile

PUT /api/v1/users/profiles/:id (Update)
- Auth: Auth + Primary Profile
- Body: { name?, avatar?, isKids?, minAge? }
- Response: Updated profile

DELETE /api/v1/users/profiles/:id (Delete)
- Auth: Auth + Primary Profile
- Response: Success

POST /api/v1/users/profiles/select/:id (Select & Get Token)
- Auth: Auth
- Body: { pin?: string } (required if profile has PIN)
- Response: Profile token for subsequent requests

POST /api/v1/users/profiles/verify-pin/:id (Verify PIN)
- Auth: Auth
- Body: { pin: string (6 chars) }
- Response: Success

PUT /api/v1/users/profiles/add-pin/:id (Add PIN)
- Auth: Auth + Primary Profile
- Body: { pin: string (6 chars) }
- Response: Success

PUT /api/v1/users/profiles/change-pin/:id (Change PIN)
- Auth: Auth + Primary Profile
- Body: { oldPin: string, newPin: string (6 chars) }
- Response: Success

PUT /api/v1/users/profiles/toggle-status/:id (Toggle Status)
- Auth: Auth + Primary Profile
- Response: Updated profile with new status
\\\

### Using Profile Token

\\\
PUT /api/v1/users/profiles/me/update (Update Self)
- Auth: Auth + Profile Token
- Body: { name?, avatar?, isKids?, minAge? }
- Response: Updated profile

PUT /api/v1/users/profiles/me/change-pin (Change Own PIN)
- Auth: Auth + Profile Token
- Body: { oldPin: string, newPin: string (6 chars) }
- Response: Success
\\\

---

## ⭐ 7️⃣ RATINGS APIs (4 Endpoints)

\\\
POST /api/v1/ratings/:contentId (Add/Update)
- Auth: Auth + Profile Token
- Body: { rating: 1-10, review?: string }
- Response (201 or 200): Rating object

GET /api/v1/ratings/:contentId/my-rating
- Auth: Auth + Profile Token
- Response: My rating for this content

GET /api/v1/ratings/my-ratings
- Auth: Auth + Profile Token
- Response: All my ratings

GET /api/v1/ratings/:contentId/all
- Auth: Public
- Response: { ratings: [...], statistics: { average, count, distribution } }
\\\

---

## 📺 8️⃣ WATCHLIST APIs (3 Endpoints)

\\\
POST /api/v1/profiles/watchlists (Add)
- Auth: Auth + Profile Token
- Body: { contentId: string }
- Response (201): Watchlist item

DELETE /api/v1/profiles/watchlists/:contentId (Remove)
- Auth: Auth + Profile Token
- Response: Success

GET /api/v1/profiles/watchlists (Get All)
- Auth: Auth + Profile Token
- Response: Array of watchlist items
\\\

---

## ❤️ 9️⃣ FAVORITES APIs (3 Endpoints)

\\\
POST /api/v1/profiles/favorites (Add)
- Auth: Auth + Profile Token
- Body: { contentId: string }
- Response (201): Favorite item

DELETE /api/v1/profiles/favorites/:contentId (Remove)
- Auth: Auth + Profile Token
- Response: Success

GET /api/v1/profiles/favorites (Get All)
- Auth: Auth + Profile Token
- Response: Array of favorite items
\\\

---

## 📜 🔟 WATCH HISTORY APIs (5 Endpoints)

\\\
POST /api/v1/watch/history (Save Progress)
- Auth: Auth + Profile Token
- Body: { contentId, episodeId?, progressTime, totalDuration }
- Response (201): History record

GET /api/v1/watch/history (Get All)
- Auth: Auth + Profile Token
- Response: Array of watch history

GET /api/v1/watch/history/:contentId (Get One)
- Auth: Auth + Profile Token
- Response: Progress object for specific content

DELETE /api/v1/watch/history/:contentId (Delete One)
- Auth: Auth + Profile Token
- Response: Success

DELETE /api/v1/watch/history (Delete All)
- Auth: Auth + Profile Token
- Response: Success
\\\

---

## 👥 1️⃣1️⃣ USERS APIs (2 Endpoints)

\\\
GET /api/v1/users/get-my-profile
- Auth: Auth + Primary Profile
- Response: User profile details

PUT /api/v1/users/update-my-profile (Update)
- Auth: Auth + Primary Profile
- Body: { name?, phone? }
- Response: Updated profile
\\\

---

## 📱 1️⃣2️⃣ DEVICES APIs (2 Endpoints)

\\\
GET /api/v1/devices/get-my-devices
- Auth: Auth + Primary Profile
- Response: Array of user devices

DELETE /api/v1/devices/delete-device/:id
- Auth: Auth + Primary Profile
- Response: Success
\\\

---

## 🎭 1️⃣3️⃣ GENRES APIs (6 Endpoints)

\\\
GET /api/v1/genres (Public)
- Response: All genres

POST /api/v1/genres (Admin Create)
- Auth: Auth + Content Manager
- Body: { name: string, description?: string }
- Response (201): Genre

GET /api/v1/genres/admin (Admin List)
- Auth: Auth + Content Manager
- Response: All genres

GET /api/v1/genres/:id (Get One)
- Auth: Auth + Content Manager
- Response: Genre details

PUT /api/v1/genres/:id (Update)
- Auth: Auth + Content Manager
- Body: { name?, description? }
- Response: Updated genre

DELETE /api/v1/genres/:id (Delete)
- Auth: Auth + Content Manager
- Response: Success
\\\

---

## 🎬 1️⃣4️⃣ CAST APIs (5 Endpoints)

\\\
GET /api/v1/cast (Admin List)
- Auth: Auth + Content Manager
- Response: All cast

POST /api/v1/cast (Admin Create)
- Auth: Auth + Content Manager
- Body: { name, description?, profileImage? }
- Response (201): Cast member

GET /api/v1/cast/:id (Public Get One)
- Auth: Public
- Response: Cast details

PUT /api/v1/cast/:id (Admin Update)
- Auth: Auth + Content Manager
- Body: { name?, description?, profileImage? }
- Response: Updated cast

DELETE /api/v1/cast/:id (Admin Delete)
- Auth: Auth + Content Manager
- Response: Success
\\\

---

## 🎯 1️⃣5️⃣ RECOMMENDATIONS API (1 Endpoint)

\\\
GET /api/v1/recommendation/profiles/recommendations
- Auth: Auth + Profile Token
- Response: Array of personalized recommendations
\\\

---

## 📤 1️⃣6️⃣ UPLOAD APIs (4 Endpoints)

\\\
POST /api/v1/admin/upload/video (Upload Video)
- Auth: Auth + Content Manager
- Body: form-data { video: File }
- Response: Video URL

POST /api/v1/admin/upload/poster (Upload Poster)
- Auth: Auth + Content Manager
- Body: form-data { poster: File }
- Response: Image URL

POST /api/v1/admin/upload/signature (Generate S3 Signature)
- Auth: Auth + Content Manager
- Body: { folder, fileName, fileType }
- Response: S3 signature for direct upload

DELETE /api/v1/admin/upload (Delete File)
- Auth: Auth + Content Manager
- Body: { fileUrl: string }
- Response: Success
\\\

---

## 📊 1️⃣7️⃣ DASHBOARD APIs (4 Endpoints)

\\\
GET /api/v1/admin/analytics (Get Analytics)
- Auth: Auth + Super Admin
- Response: Dashboard analytics data

GET /api/v1/admin/analytics/ratings/recent
- Auth: Auth + Super Admin
- Response: Recent ratings

GET /api/v1/admin/users (Get Users Data)
- Auth: Auth + Super Admin
- Response: Users analytics

GET /api/v1/dashboard (Get Dashboard Data)
- Auth: Auth + Super Admin
- Response: Dashboard data
\\\

---

## 🔐 Authorization & Security

### Authorization Levels

| Level | Requirement |
|-------|-------------|
| ❌ Public | No auth needed |
| ✅ Auth | Valid Access Token |
| ✅ Auth + Primary Profile | Valid Access Token + Primary Profile |
| ✅ Auth + Profile Token | Valid Access Token + Profile Token |
| ✅ Content Manager | Auth + Role check |
| ✅ Super Admin | Auth + Super Admin role |

### Token Information

**Access Token:**
- Duration: 15 minutes
- Stored: Cookie + Authorization header
- Used for: API requests

**Refresh Token:**
- Duration: 7 days
- Stored: Cookie only
- Used for: Getting new access token

**Profile Token:**
- Duration: Session
- Obtained: After selecting profile
- Required for: Profile-specific operations

---

## 📊 HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden / No Permission |
| 404 | Not Found |
| 500 | Server Error |

---

## 🎯 Common Request Headers

\\\
Authorization: Bearer <access_token>
Cookie: accessToken=<token>; refreshToken=<token>; profileToken=<token>
Content-Type: application/json
x-device-id: device-identifier (for login)
\\\

---

**Document Version:** 1.0
**Last Updated:** August 2024
**Status:** ✅ Complete and Verified
