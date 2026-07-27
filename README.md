# StreamFlix

A modular Node.js/Express backend for a subscription-based streaming platform with users, profiles, plans, subscriptions, movies, series, seasons, episodes, cast, genres, ratings, devices, and administration features.

> **Repository status:** this branch is currently backend-only. Several modules are partial, unmounted, or blocked by known runtime/contract defects. Read [Current Implementation Status](#current-implementation-status) before deploying or building a client against it.

## Project Overview

StreamFlix models the core domains of a modern video-streaming service:

- account registration and cookie-based authentication
- multiple viewer profiles with optional PIN protection
- subscription plans and account subscriptions
- movies and serialized content
- seasons and episodes
- cast and genre relationships
- ratings and reviews
- registered devices
- administrative analytics and user management
- scheduled content publication and subscription processing
- Cloudinary upload support in source code

The application uses a route → controller → service → model structure for most implemented domains.

## Features

### Implemented and mounted in `src/app.js`

- authentication: register, login, logout, refresh, change password
- current-user read/update
- profile CRUD, profile selection, and PIN operations
- plan read/admin CRUD
- user and admin subscription routes
- generic content read
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

### Implemented in source but not mounted

- home feed
- local/Cloudinary upload routes

### Model-only or placeholder capabilities

- favorites
- watch history
- watchlist
- recommendations
- direct payment APIs

These model-only capabilities do not have usable API endpoints in the current branch.

## Current Implementation Status

The branch requires hardening before production use.

Important known issues include:

- case-sensitive import mismatches currently prevent startup on Linux/case-sensitive filesystems
- some content write routes lack authentication/authorization
- public movie/episode responses expose direct video URLs
- season and episode status logic does not match their schemas
- successful login can reactivate suspended/deactivated users
- content-manager creation stores a plaintext password
- subscription/payment flows mark payments completed without provider confirmation
- plan device/profile/quality/content limits are not enforced
- cookie authentication and wildcard CORS are incompatible for a cross-origin browser client
- several modules are present but not mounted or are schema-only

See the audit package accompanying this README for the full issue register and endpoint mapping.

## Tech Stack

### Runtime and web

- Node.js
- Express 5
- CommonJS

### Data

- MongoDB
- Mongoose

### Authentication and security

- JSON Web Tokens
- `httpOnly` cookies
- Argon2
- `express-validator`
- `express-rate-limit`
- XSS middleware

### Media and infrastructure

- Multer
- Cloudinary
- node-cron
- Nodemailer
- Morgan
- user-agent parsing
- UUID device identifiers

## Architecture

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

### Module convention

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

Some older/incomplete modules use a singular `model/` directory or contain empty index files.

## Backend Modules

| Module | Purpose | Current state |
|---|---|---|
| `auth` | register, login, logout, refresh, password change, device registration | Mounted; security fixes required |
| `users` | current account data | Mounted; import-case blocker |
| `profiles` | viewer profiles and PINs | Mounted; plan limit/selection gaps |
| `plans` | subscription plan catalog and admin CRUD | Mounted; limits not enforced |
| `subscriptions` | account/admin subscriptions and renewal/cancel | Mounted; import/payment defects |
| `Payment` | payment records | Internal model only |
| `content` | content, movies, series, seasons, episodes, relations, publishing | Mounted; major authorization/schema defects |
| `casts` | cast CRUD | Mounted; RBAC call defect |
| `genres` | genre CRUD | Mounted; model import-case blocker |
| `ratings` | ratings and reviews | Mounted; request/profile contract defects |
| `devices` | list and revoke devices | Mounted |
| `dashboard` | analytics and user administration | Mounted; user-management defects |
| `home` | latest published movies/series | Not mounted |
| `upload` | Cloudinary/local upload operations | Not mounted |
| `favorites` | favorite content | Model only |
| `watch-history` | progress/history records | Model only |
| `Watchlist` | watchlist records | Model only |
| `recommendations` | recommendation placeholder | Not implemented |

## API Integration

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

The dashboard routers are also exposed through duplicate aliases under `/api/v1/dashboard`; new clients should use `/api/v1/admin/*` as the canonical paths.

### Response shape

Most controllers aim to return:

```json
{
  "success": true,
  "message": "Operation completed",
  "data": {}
}
```

Some endpoints currently return different/raw shapes, so clients should normalize responses and treat malformed contracts as errors rather than manufacturing data.

### Browser clients

Authentication uses cookies. A separately hosted frontend should use a same-origin reverse proxy/BFF that forwards:

- the exact backend path and HTTP method
- request/response cookies
- `Set-Cookie`
- `x-device-id`
- query strings and request body

Do not store access or refresh tokens in local storage.

## Authentication

### Access token

- generated at login
- stored in an `httpOnly` cookie
- carries user ID, email, role, and device ID
- checked by `src/middlewares/auth.js`

### Refresh token

- stored in an `httpOnly` cookie
- refreshed through:

```text
PUT /api/v1/auth/refresh-token
```

The current implementation has no persistent refresh-token store, token-family rotation, replay detection, or server-side logout revocation.

### Devices

Login registers a device using:

- `x-device-id` when supplied
- otherwise a generated UUID
- user-agent and IP metadata

Plan `maxDevices` is currently metadata only and is not enforced.

## Roles

Defined roles:

```text
super_admin
content_manager
user
```

Do not use or introduce an `admin` role; it is not one of the defined constants.

### Intended responsibilities

| Role | Intended access |
|---|---|
| `super_admin` | plans, subscriptions, analytics, user administration, content administration |
| `content_manager` | content, cast, genres, media management |
| `user` | own account, profiles, subscriptions, ratings, devices, catalog |

Several current route declarations contain RBAC inconsistencies. Audit and test every protected endpoint before deployment.

## Database

### Core collections/models

#### Identity

- `User`
- `Profile`
- `Device`

#### Commercial

- `Plan`
- `Subscription`
- `Payment`

#### Catalog

- `Content`
- `Movie`
- `Series`
- `Season`
- `Episode`

#### Taxonomy and credits

- `Genre`
- `Cast`
- `ContentGenre`
- `ContentCast`

#### Engagement

- `Rating`
- `Favorite`
- `WatchHistory`
- `Watchlist`

### Transactions

Some multi-document services conditionally use transactions when:

```env
USE_TRANSACTIONS=true
```

Transaction mode requires a MongoDB deployment that supports transactions. The current branch also needs missing Mongoose imports corrected before those code paths can run.

### Indexes and integrity

Before production, add and test compound uniqueness/integrity constraints for:

- series + season number
- season + episode number
- content + genre
- content + cast
- profile + content rating
- profile + content favorite
- one primary profile per user
- subscription/payment idempotency

## Environment Variables

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

Recommended configuration additions for production hardening:

```env
FRONTEND_ORIGIN=
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
LOG_LEVEL=info
ENABLE_CONTENT_SCHEDULER=true
ENABLE_SUBSCRIPTION_SCHEDULER=false
```

The additions above are recommendations; the current code does not consume all of them yet.

Never commit real secrets. Do not deploy with fallback privileged credentials.

## Installation

### Prerequisites

- Node.js compatible with the installed dependencies
- npm
- MongoDB
- optional Cloudinary account for media work
- optional SMTP credentials for email work

### Install dependencies

```bash
npm ci
```

For local dependency changes:

```bash
npm install
```

### Configure environment

```bash
cp .env.example .env
```

Populate all required values before starting the server.

### Seed privileged accounts

```bash
npm run seed:admin
```

Review `src/scripts/createAdmin.js` before running it. Do not rely on fallback credentials, and correct the content-manager password handling before production use.

## Running Locally

Development:

```bash
npm run dev
```

Health check:

```text
GET http://localhost:3000/api/health
```

The current branch does not define a production `start` script. Add one only after startup blockers, environment validation, and production hardening are complete.

## Project Structure

```text
.
├─ src/
│  ├─ app.js
│  ├─ config/
│  ├─ middlewares/
│  ├─ modules/
│  │  ├─ Payment/
│  │  ├─ Watchlist/
│  │  ├─ auth/
│  │  ├─ casts/
│  │  ├─ content/
│  │  ├─ dashboard/
│  │  ├─ devices/
│  │  ├─ favorites/
│  │  ├─ genres/
│  │  ├─ home/
│  │  ├─ plans/
│  │  ├─ profiles/
│  │  ├─ ratings/
│  │  ├─ recommendations/
│  │  ├─ subscriptions/
│  │  ├─ upload/
│  │  ├─ users/
│  │  └─ watch-history/
│  ├─ scheduler/
│  ├─ scripts/
│  ├─ shared/
│  └─ utils/
├─ .env.example
├─ ERD.png
├─ SYSTEM-DESIGN.md
├─ package.json
└─ package-lock.json
```

## Development Workflow

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

### Recommended quality scripts

```json
{
  "scripts": {
    "start": "node ./src/app.js",
    "lint": "eslint .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:integration": "vitest run --config vitest.integration.config.js"
  }
}
```

These are recommended additions, not scripts present in the audited branch.

## Testing Priorities

At minimum, cover:

- server startup and route registration on Linux
- register/login/refresh/logout/change-password
- suspended/deactivated/banned login behavior
- device validation and revocation
- every role on every admin/content route
- plan validation
- subscription/payment state transitions and idempotency
- content publication scheduling
- movie/series/season/episode cascades
- selected-profile behavior
- ratings uniqueness and ownership
- upload type/size/authorization
- error envelope consistency

## Frontend Contract Rules

A frontend built against this branch must:

- use only exact mounted endpoints
- avoid fabricated favorites/history/watchlist/recommendation APIs
- compose the home page from movie/series endpoints because the home router is unmounted
- capability-gate uploads
- send the same content ID in the rating URL and body as a compatibility workaround
- require an explicit valid payment method for subscription creation
- treat `visa` as the only currently compatible manual-renewal payment value
- keep tokens in cookies
- preserve the backend role strings
- document every blocked feature

## Security Notice

This branch contains known authentication, authorization, media-access, password-storage, and payment-state defects. It should not be exposed to untrusted traffic or real customer/payment data until the P0 findings in the backend audit are resolved and verified through integration/security tests.

## License

ISC, as declared in `package.json`.
