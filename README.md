
#  StreamFlix

  

A modular Node.js/Express backend for a subscription-based streaming platform with users, profiles, plans, subscriptions, movies, series, seasons, episodes, cast, genres, ratings, devices, and administration features.


##  Project Overview

  

StreamFlix models the core domains of a modern video-streaming service:

  

- Account registration and cookie-based authentication

- Multiple viewer Profiles with optional PIN protection

- Subscription plans and account subscriptions

- Movies and Series

- Seasons and Episodes

- Cast and Genre relationships

- Ratings and Reviews

- Watch History

- WatchList

- Favorites

- Smart Recommendations

- Direct payment APIs

- Registered devices

- Administrative analytics and user management

- Scheduled content publication and subscription processing

- Cloudinary upload support in source code


The application uses a route → controller → service → model structure for most implemented domains.

  

##  Features :

  

- authentication: register, login, logout, refresh, change password

- current-user read/update

- profile CRUD, profile selection, and PIN operations

- plan CRUD (SuperAdmin only)

- User and Admin subscription routes

- Content 

- movie admin/client routes

- series admin/client routes

- season and episode routes

- content–genre and content–cast relations

- cast routes

- genre routes

- ratings

- device list/revoke

- admin analytics

- admin user management

 - favorites

- watch history
- home feed

- local/Cloudinary upload routes

- watchlist

- recommendations

- direct payment APIs

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

 

  

##  Backend Modules

  

| Module | Purpose |
|--------|---------|
| `auth` | Register, login, logout, refresh, password change, device registration |
| `users` | Current account data |
| `profiles` | Viewer profiles and PINs |
| `plans` | Subscription plan catalog and admin CRUD |
| `subscriptions` | Account/admin subscriptions and renewal/cancel |
| `Payment` | Payment records |
| `content` | Content, movies, series, seasons, episodes, relations, publishing |
| `casts` | Cast CRUD |
| `genres` | Genre CRUD |
| `ratings` | Ratings and reviews |
| `devices` | List and revoke devices |
| `dashboard` | Analytics and user administration |
| `home` | Latest published movies/series |
| `upload` | Cloudinary/local upload operations |
| `favorites` | Favorite content |
| `watch-history` | Progress/history records |
| `Watchlist` | Watchlist records |
| `recommendations` | Recommendation placeholder |
  

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

# Features :

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

## 2. Profile Management System

### Profile Structure

Each user account can have:

- **1 Primary Profile** (owner) – **cannot be deleted**
- **Multiple Secondary Profiles** (e.g., kids, family members)

### Authentication Layers

| Layer | Middleware | Purpose |
|-------|------------|---------|
| **User Auth** | `auth` | Validates user JWT (login) |
| **Profile Auth** | `validateProfileToken` | Validates profile JWT after selection |
| **Primary Profile Guard** | `validatePrimaryProfile` | Restricts admin actions to primary profile |
| **PIN Check** | `checkPinForCreation` | Forces PIN setup before creating sub-profiles |

### PIN Policy

| Profile Type | PIN Required? |
|--------------|---------------|
| **Primary (Single Profile)** | ❌ No |
| **Primary (Shared Account)** | ✅ Yes |
| **Secondary** | ✅ If set by user |

Multi-profile system allowing users to create and manage multiple profiles under one account, similar to Netflix.

## Key Features
- **Multi-Profile Support**: One account, multiple profiles
- **Profile Tokens**: JWT-based authentication per profile
- **PIN Protection**: Optional PIN for shared accounts and sub-profiles
- **Role-Based Access**: Primary vs. sub-profile permissions
- **Cascade Deletion**: Clean removal of all associated data

## Core Services
| Service | Description |
|---------|-------------|
| `select` | Profile selection with dynamic PIN validation, returns Profile JWT |
| `addPIN/changePIN/verifyPIN` | Hashed PIN management with verification |
| `remove` | Cascade deletion of profile and all linked data |
### Database Cleanup on Deletion
Deleting a sub-profile automatically removes:
- Watch History
- Favorites
- Ratings
- Watchlist
> **Note:** Primary profile cannot be deleted.



## 3. Subscription , Watch History and Content Consumption

This document provides a high-level overview of StreamFlix's backend architecture, focusing on **Subscription Management**, **Multi-Profile Support**, **Watch History Tracking**, and **Content Consumption** logic.

---

### 📌 1. Overview

The system is designed with **clear separation of concerns**. Each component has a specific role:

| Component | Responsibility |
|-----------|----------------|
| **User Account** | Represents the main user account |
| **Profiles** | Multiple profiles per account (e.g., Primary, Kids, Family) |
| **Subscription** | Defines the user's current plan and its limits |
| **Watch History** | Tracks where the user left off while watching content |
| **Consumption** | Records which content has been counted against the subscription |
| **Usage** | Aggregate counters for consumed content (movies/series) |

---


### 📊 Subscription Consumption & Usage
### Definitions
| Concept | Purpose |
|---------|---------|
| **Consumption** | Tracks which content has been counted against the subscription |
| **Usage** | Aggregate counter (e.g., `moviesUsedCount = 3`) |
### Example
```javascript
// Plan allows: 5 Movies, 3 Series
User watches: Movie A, Movie B, Movie C
→ Consumption: [Movie A, Movie B, Movie C]
→ Usage: moviesUsedCount = 3
User re-watches Movie A
→ Consumption: [Movie A, Movie B, Movie C] (no change)
→ Usage: moviesUsedCount = 3 (no change)
```


## 4. Devices

Login registers a device using:

  

-  `x-device-id` when supplied

- otherwise a generated UUID

- user-agent and IP metadata


Plan `maxDevices` is currently metadata only and is not enforced.



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


##  Installation

  

###  Prerequisites

  

- Node.js compatible with the installed dependencies

- npm

- MongoDB

- optional Cloudinary account for media work

- optional SMTP credentials for email work

  

###  Install dependencies

  

```bash

npm  ci

```

  

For local dependency changes:

  

```bash

npm  install

```

  

###  Configure environment

  

```bash

cp  .env.example  .env

```

  

Populate all required values before starting the server.

  

###  Seed privileged accounts

  

```bash

npm  run  seed:admin

```

  

Review `src/scripts/createAdmin.js` before running it. Do not rely on fallback credentials, and correct the content-manager password handling before production use.

  

##  Running Locally

  

Development:

  

```bash

npm  run  dev

```

  

Health check:

  

```text

GET http://localhost:3000/api/health

```

  

The current branch does not define a production `start` script. Add one only after startup blockers, environment validation, and production hardening are complete.

  

##  Project Structure

  

```text

.

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

  

##  Development Workflow

  

1. Create a focused branch.

2. Add or update the domain contract before implementation.

3. Keep route, controller, service, validation, and model changes together.

4. Add route/service integration tests.

5. Test authentication and every permitted/denied role.

6. Test duplicate/concurrent database operations.

7. Update the endpoint manifest and README.

8. Run syntax, lint, test, and dependency checks.

9. Review logs for secrets and personal data.

10. Use a pull request with a migration/deployment note.

  

##  License

  

ISC, as declared in `package.json`.
  
