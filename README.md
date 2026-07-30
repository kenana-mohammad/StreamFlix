
# 🎬 StreamFlix - Backend API Documentation

A modular Node.js/Express backend for a subscription-based streaming platform with users, profiles, plans, subscriptions, movies, series, seasons, episodes, cast, genres, ratings, devices, and administration features.

  ## 📖 Overview

StreamFlix enables users to:

- 🔐 **Authenticate** securely with JWT-based authentication
- 👤 **Manage profiles** with PIN protection for shared accounts
- 🎬 **Browse content** (movies, series, episodes) with advanced filtering
- 📺 **Track watch history** and resume from where they left off
- 📋 **Watchlist** content to watch later
- ⭐ **Rate and favorite** content
- 💳 **Subscribe** to various plans with payment processing
- 🎯 **Receive personalized recommendations** based on viewing history


##  Tech Stack

  

  

###  Runtime and web

  

  

- Node.js

  

- Express 5

  

- CommonJS

  

  

###  Data

  

  

- MongoDB

  

- Mongoose

  

  

###  Authentication and security

  

  

- JSON Web Tokens

  

-  `httpOnly` cookies

  

- Argon2

  

-  `express-validator`

  

-  `express-rate-limit`

  

- XSS middleware

  

  

###  Media and infrastructure

  

  

- Multer

  

- Cloudinary

  

- node-cron

  

- Nodemailer

  

- Morgan

  

- user-agent parsing

  

- UUID device identifiers

 
## 🚀 Installation

###  Prerequisites

- Node.js compatible with the installed dependencies

- npm

- MongoDB

- optional Cloudinary account for media work


``` bash
#  Clone the repository
git clone https://github.com/kenana-mohammad/StreamFlix.git
cd streamflix
# Install dependencies
npm install
# Set up environment variables (see below)
cp .env.example .env
# Start the server
npm start
# Development mode
npm run dev
``` 
###  Seed privileged accounts

```bash
npm  run  seed:admin
```
  
Health check:

```text

GET http://localhost:3000/api/health

```
##  Environment Variables

  

  

Create `.env` from `.env.example`, then verify it against the variables actually used by the code.

  

  

```env

# Application

PORT=3000
NODE_ENV=development
# MongoDB
MONGOOSE_URL=mongodb://127.0.0.1:27017/streamflix
USE_TRANSACTIONS=false

# JWT
JWT_SECRET_KEY=replace-with-a-long-random-secret
REFRESH_JWT_SECRET_KEY=replace-with-a-different-long-random-secret

# Cloudinary
CLOUD_NAME=
API_KEY_CLOUD=
API_SECRET_CLOUD=

# Seed: super admin
SUPER_ADMIN_NAME=
SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD=
SUPER_ADMIN_PHONE=

# Seed: content manager
CONTENT_MANAGER_NAME=
CONTENT_MANAGER_EMAIL=
CONTENT_MANAGER_PASSWORD=
CONTENT_MANAGER_PHONE=

# Email
EMAIL_USER=
EMAIL_PASS=

```


##  Architecture

  

  

```text
HTTP Request
|
v
Express app / shared middleware
|
v

Module router
|
v
Controller
|
v
Service / business logic
|
v
Mongoose model(s)
|
v
MongoDB

```

  

  

Scheduled jobs start after the MongoDB connection:

  

  

- content publication scheduler

  

- subscription scheduler

  

  

###  Module convention

  

  

Most modules follow:

```text
src/modules/<feature>/
├─ routes/
├─ controllers/
├─ services/
├─ models/
├─ validations/
└─ index.js
```
##  Database

  

  

###  Core collections/models

  

  

####  Identity

  

  

-  `User`

  

-  `Profile`

  

-  `Device`

  

  

####  Commercial

  

  

-  `Plan`

  

-  `Subscription`

  

-  `Payment`

  

  

####  Catalog

  

  

-  `Content`

  

-  `Movie`

  

-  `Series`

  

-  `Season`

  

-  `Episode`

  

  

####  Taxonomy and credits

  

  

-  `Genre`

  

-  `Cast`

  

-  `ContentGenre`

  

-  `ContentCast`

  

  

####  Engagement

  

  

-  `Rating`

  

-  `Favorite`

  

-  `WatchHistory`

  

-  `Watchlist`

  

  

###  Transactions

  

Some multi-document services conditionally use transactions when:

  

```env

  

USE_TRANSACTIONS=true

  

```

  

###  Indexes and integrity

  

  

Before production, add and test compound uniqueness/integrity constraints for:

  

  

- series + season number

  

- season + episode number

  

- content + genre

  

- content + cast

  

- profile + content rating

  

- profile + content favorite

  

- one primary profile per user

  

- subscription/payment idempotency


##  Backend Modules


| Module | Purpose |
|--------|---------|
|  `auth`  | Register, login, logout, refresh, password change, device registration |
|  `users`  | Current account data |
|  `profiles`  | Viewer profiles and PINs |
|  `plans`  | Subscription plan catalog and admin CRUD |
|  `subscriptions`  | Account/admin subscriptions and renewal/cancel |
|  `Payment`  | Payment records |
|  `content`  | Content, movies, series, seasons, episodes, relations, publishing |
|  `casts`  | Cast CRUD |
|  `genres`  | Genre CRUD |
|  `ratings`  | Ratings and reviews |
|  `devices`  | List and revoke devices |
|  `dashboard`  | Analytics and user administration |
|  `home`  | Latest published movies/series |
|  `upload`  | Cloudinary/local upload operations |
|  `favorites`  | Favorite content |
|  `watch-history`  | Progress/history records |
|  `Watchlist`  | Watchlist records |
|  `recommendations`  | Recommendation placeholder |

  

##  API Integration

  

  

Base prefix for most routes:

 
```text

/api/v1

```

Health endpoint:
  
```text
  
GET /api/health
```

Primary route groups:

  

  

```text

/api/v1/auth

/api/v1/users

/api/v1/users/profiles

/api/v1/plans

/api/v1/subscriptions

/api/v1/admin/subscriptions

/api/v1/contents

/api/v1/movies

/api/v1/series

/api/v1/seasons

/api/v1/episodes

/api/v1/cast

/api/v1/genres

/api/v1/ratings

/api/v1/devices
  
/api/v1/admin/analytics

/api/v1/admin/users
```

  
  

  

###  Response shape

  

  

Most controllers aim to return:


```json
{

"success":  true,

"message":  "Operation completed",

"data":  {}

}

```

###  Browser clients

  

  

Authentication uses cookies. A separately hosted frontend should use a same-origin reverse proxy/BFF that forwards:

  

  

- the exact backend path and HTTP method

  

- request/response cookies

  

-  `Set-Cookie`

  

-  `x-device-id`

  

- query strings and request body

  

  

Do not store access or refresh tokens in local storage.
 

##  Roles


Defined roles:

```text

super_admin

content_manager

user

```


###  Intended responsibilities

| Role | Intended access |
|---|---|
|  `super_admin`  | plans, subscriptions, analytics, user administration, content administration |
|  `content_manager`  | content, cast, genres, media management |
|  `user`  | own account, profiles, subscriptions, ratings, devices, catalog |

 

##  4. Devices

  

Login registers a device using:

  

  

-  `x-device-id` when supplied

  

- otherwise a generated UUID

  

- user-agent and IP metadata

  
  

Plan `maxDevices` is currently metadata only and is not enforced.
  

#  Features :

  

##  1. Authentication

  

  

###  Access token

  

  

- generated at login

  

- stored in an `httpOnly` cookie

  

- carries user ID, email, role, and device ID

  

- checked by `src/middlewares/auth.js`

  

  

###  Refresh token

  

  

- stored in an `httpOnly` cookie

  

- refreshed through:

  

  

```text

  

PUT /api/v1/auth/refresh-token

  

```

  

##  2. Profile Management System

  

###  Profile Structure

  

Each user account can have:

  

-  **1 Primary Profile** (owner) – **cannot be deleted**

-  **Multiple Secondary Profiles** (e.g., kids, family members)

  

###  Authentication Layers

  

| Layer | Middleware | Purpose |
|-------|------------|---------|
|  **User Auth**  |  `auth`  | Validates user JWT (login) |
|  **Profile Auth**  |  `validateProfileToken`  | Validates profile JWT after selection |
|  **Primary Profile Guard**  |  `validatePrimaryProfile`  | Restricts admin actions to primary profile |
|  **PIN Check**  |  `checkPinForCreation`  | Forces PIN setup before creating sub-profiles |

  

###  PIN Policy

  

| Profile Type | PIN Required? |
|--------------|---------------|
|  **Primary (Single Profile)**  | ❌ No |
|  **Primary (Shared Account)**  | ✅ Yes |
|  **Secondary**  | ✅ If set by user |

  

Multi-profile system allowing users to create and manage multiple profiles under one account, similar to Netflix.

  

##  Key Features

-  **Multi-Profile Support**: One account, multiple profiles

-  **Profile Tokens**: JWT-based authentication per profile

-  **PIN Protection**: Optional PIN for shared accounts and sub-profiles

-  **Role-Based Access**: Primary vs. sub-profile permissions

-  **Cascade Deletion**: Clean removal of all associated data

  

##  Core Services

| Service | Description |
|---------|-------------|
|  `select`  | Profile selection with dynamic PIN validation, returns Profile JWT |
|  `addPIN/changePIN/verifyPIN`  | Hashed PIN management with verification |
|  `remove`  | Cascade deletion of profile and all linked data |

###  Database Cleanup on Deletion

Deleting a sub-profile automatically removes:

- Watch History

- Favorites

- Ratings

- Watchlist

>  **Note:** Primary profile cannot be deleted.

  
  ##  3. Content Management & User Interaction

### Content Management

The platform supports a complete content catalog with:

| Feature | Description |
|---------|-------------|
| **Movies** | Individual films with title, description, duration, age rating, poster, and video URL |
| **Series** | Multi-season shows with seasons and episodes |
| **Seasons** | Each series can have multiple seasons with season numbers and titles |
| **Episodes** | Each episode has title, description, duration, and video URL |
| **Genres** | Content can be tagged with genres for filtering and recommendations |
| **Cast** | Actors and crew members linked to content with character names |

### Content Types

```text
├── Movies (Single content)
│   └── Duration, Video URL
│
└── Series (Multi-episode)
    └── Season 1
    │   ├── Episode 1
    │   ├── Episode 2
    │   └── Episode 3
    └── Season 2
        ├── Episode 1
        └── Episode 2
  ```

## 👤 User Interaction Features

### 📋 Watchlist

Users can add content to their **Watchlist** for later viewing. Each profile has its own watchlist.

**Features:**

-   ✅ Add movies and series to watchlist
    
-   ✅ Remove from watchlist
    
-   ✅ View all watchlist items
    
-   ✅ Check if content is already in watchlist
    
-   ✅ Unique index prevents duplicates

### 📺 Watch History

Automatically tracks user progress across all content, enabling resume playback.

**Features:**

-   ✅ Tracks progress time (seconds)
    
-   ✅ Marks content as completed (≥90% watched)
    
-   ✅ Auto-resume from last position
    
-   ✅ Unique per profile and content
    
-   ✅ TTL (auto-delete after 1 year of inactivity)

### ⭐ Ratings

Users can rate content on a scale of **1 to 5** stars.

**Features:**

-   ✅ Rate any movie or series episode
    
-   ✅ Update existing ratings
    
-   ✅ Optional review text
    
-   ✅ One rating per profile per content
    
-   ✅ Automatically updates content's average rating
  
  ### ❤️ Favorites

Users can mark content as favorites for quick access.

**Features:**

-   ✅ Add to favorites
    
-   ✅ Remove from favorites
    
-   ✅ View all favorites
    
-   ✅ Check if content is favorited
    
-   ✅ Unique index prevents duplicates  

**Rate Limits:** 1 rating per content per profile.

### 🎯 Recommendations

Personalized content suggestions based on viewing history. (explained below)

### 🔒 Security

All content interactions are protected by:

-   ✅ **Authentication**: User must be logged in
    
-   ✅ **Profile Validation**: Actions are tied to specific profiles
    
-   ✅ **Ownership Checks**: Users can only modify their own data
    
-   ✅ **Input Validation**: All inputs are validated and sanitized

##  4. Subscription and Content Consumption

  

This document provides a high-level overview of StreamFlix's backend architecture, focusing on **Subscription Management**, **Multi-Profile Support**, **Watch History Tracking**, and **Content Consumption** logic.


---
  

###  📌 1. Overview

  

The system is designed with **clear separation of concerns**. Each component has a specific role:

  

| Component | Responsibility |
|-----------|----------------|
|  **User Account**  | Represents the main user account |
|  **Profiles**  | Multiple profiles per account (e.g., Primary, Kids, Family) |
|  **Subscription**  | Defines the user's current plan and its limits |
|  **Watch History**  | Tracks where the user left off while watching content |
|  **Consumption**  | Records which content has been counted against the subscription |
|  **Usage**  | Aggregate counters for consumed content (movies/series) |

---


###  📊 Subscription Consumption & Usage

###  Definitions

| Concept | Purpose |
|---------|---------|
|  **Consumption**  | Tracks which content has been counted against the subscription |
|  **Usage**  | Aggregate counter (e.g., `moviesUsedCount = 3`) |

###  Example

```javascript

// Plan allows: 5 Movies, 3 Series

User  watches:  Movie  A,  Movie  B,  Movie  C

→ Consumption: [Movie  A,  Movie  B,  Movie  C]

→ Usage:  moviesUsedCount  =  3

User  re-watches  Movie  A

→ Consumption: [Movie  A,  Movie  B,  Movie  C] (no  change)

→ Usage:  moviesUsedCount  =  3 (no  change)

```

  ## Recommendation Service

The **Recommendation Service** provides personalized content recommendations based on a user's watch history and genre preferences using a content-based filtering approach.


The service analyzes a user's viewing patterns to identify their favorite genres and recommends new, unwatched content from those genres.

### Core Flow
```
User Profile → Get Watched Content (≥80%) → Extract Genres → Identify Top 3 → Recommend Unwatched Content
```

---

## 🧩 Methods

### `getWatchedContentIds(profileId)`

**Purpose:** Retrieves all content IDs that the user has watched (≥80% progress).

| Criteria | Description |
|----------|-------------|
| `completed = true` | User marked content as complete |
| `progressTime >= totalDuration * 0.8` | User watched at least 80% |

**Returns:** `Array<string>` of unique content IDs.

---

### `getFavoriteGenres(profileId, limit = 3)`

**Purpose:** Identifies the user's most-watched genres based on their viewing history.

**Logic:**
1. Get watched content IDs
2. Query `ContentGenre` for linked genres
3. Count occurrences per genre
4. Sort by count descending
5. Return top `limit` genres

**Returns:**
```javascript
[{ id: 'genreId', name: 'Sci-Fi', count: 5 }, ...]
```
### `getRecommendations(profileId, limit = 10)`

**Purpose:** Generates personalized content recommendations based on the user's favorite genres.

**Logic:**

1.  Get favorite genres (top 3)
    
2.  If none → fallback to top-rated content
    
3.  Get watched content IDs (to exclude)
    
4.  Find content in favorite genres
    
5.  Filter out watched content
    
6.  Sort by `averageRating` and `viewsCount`
    
7.  Add genre details to response
    
8.  Fallback to top-rated if no recommendations found
    

**Returns:**  `Array<Content>` with populated genre data.




##  Project Structure

  

  

```text

  

├─ src/

  

│ ├─ app.js

  

│ ├─ config/

  

│ ├─ middlewares/

  

│ ├─ modules/

  

│ │ ├─ Payment/

  

│ │ ├─ Watchlist/

  

│ │ ├─ auth/

  

│ │ ├─ casts/

  

│ │ ├─ content/

  

│ │ ├─ dashboard/

  

│ │ ├─ devices/

  

│ │ ├─ favorites/

  

│ │ ├─ genres/

  

│ │ ├─ home/

  

│ │ ├─ plans/

  

│ │ ├─ profiles/

  

│ │ ├─ ratings/

  

│ │ ├─ recommendations/

  

│ │ ├─ subscriptions/

  

│ │ ├─ upload/

  

│ │ ├─ users/

  

│ │ └─ watch-history/

  

│ ├─ scheduler/

  

│ ├─ scripts/

  

│ ├─ shared/

  

│ └─ utils/

  

├─ .env.example

  

├─ ERD.png

  

├─ SYSTEM-DESIGN.md

  

├─ package.json

  

└─ package-lock.json

  

```
##  License  

ISC, as declared in `package.json`.

## 👥 Authors
### Team : Focal X Group 2
Kenena Mohamamed - Alaa Soufi - Laila Sankar - Yazan Hamdoush  - Haider Shheta - Bushra Ani

**Made with ❤️**

