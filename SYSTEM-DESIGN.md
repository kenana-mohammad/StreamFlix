
  

#  StreamFlix - DATABASE DESIGN

##  1. Overview

StreamFlix is a system for streaming video content to users by subscribing to a chosen plan. Each plan has specific features and price .

---

###  Goals

- Display all the content available to the users.

- Stream video content to the users.

- Provide personalized recommendations.

- Allow ratings and favorites for the users.

  

##  2. Actors

* User

* Content Manager

* Super Admin.

---

##  3. Collections & Field Classification


### 3.1 `User`

| Field | Type | Classification |
|-------|------|----------------|
| `name` | String | Data |
| `email` | String | Data |
| `phone` | String | Data |
| `password` | String | Data |
| `lastLogin` | Date | Data |
| `role` | String | **Problem Solving** |
| `status` | String | **Problem Solving** |
| `failedLoginAttempts` | Number | **Problem Solving** |
| `lockUntil` | Date | **Problem Solving** |
| `bannedReason` | String | **Problem Solving** |
| `bannedUntil` | Date | **Problem Solving** |
  
  


### 3.2.1 `Content`

| Field | Type | Classification |
|-------|------|----------------|
| `title` | String | Data |
| `description` | String | Data |
| `type` | String (Enum) | **Problem Solving** |
| `poster` | String | Data |
| `ageRating` | String (Enum) | **Problem Solving** |
| `trailerUrl` | String | Data |
| `releaseYear` | Number | Data |
| `viewsCount` | Number | **Problem Solving** |
| `averageRating` | Number | **Problem Solving** |
| `ratingCount` | Number | **Problem Solving** |
| `status` | String (Enum) | **Problem Solving** |
| `publishAt` | Date | Data |
| `genres` | Virtual (Populated) | **Problem Solving** |
| `timestamps` | Date (Auto) | Data |

### Indexes

| Index | Purpose |
|-------|---------|
| `{ type: 1, status: 1 }` | Optimizes filtering by content type and status |

### Cascade Delete (Middleware)

When a content document is deleted, the following related data is automatically removed:

- `ContentGenre` (genre associations)
- `ContentCast` (cast associations)

  


### 3.2.2 `Movie`

| Field | Type | Classification |
|-------|------|----------------|
| `contentId` | ObjectId (Ref: Content) | **Problem Solving** |
| `duration` | String | **Data** |
| `videoUrl` | String | **Data** |
| `timestamps` | Date (Auto) | **Data** |

### Relationships

| Field | References | Type |
|-------|------------|------|
| `contentId` | `Content` | One-to-One |

### 3.2.3 `Series`

| Field | Type | Classification |
|-------|------|----------------|
| `contentId` | ObjectId (Ref: Content) | **Problem Solving** |
| `totalSeasons` | Number | Data |
| `timestamps` | Date (Auto) | Data |
| `seasons` | Virtual (Populated) | **Problem Solving** |

### Relationships

| Field | References | Type |
|-------|------------|------|
| `contentId` | `Content` | One-to-One |
| `seasons` (Virtual) | `Season` | One-to-Many |

###  3.2.4 `Seasons`

| Field | Type | Classification |
|-------|------|----------------|
| `seriesId` | ObjectId (Ref: Series) | **Problem Solving** |
| `seasonNumber` | Number | Data |
| `title` | String | Data |
| `timestamps` | Date (Auto) | Data |
| `episodes` | Virtual (Populated) | **Problem Solving** |

### Relationships

| Field | References | Type |
|-------|------------|------|
| `seriesId` | `Series` | Many-to-One |
| `episodes` (Virtual) | `Episode` | One-to-Many |
  

###  3.2.5 `Episods`

| Field | Type | Classification |
|-------|------|----------------|
| `seasonId` | ObjectId (Ref: Season) | **Problem Solving** |
| `episodeNumber` | Number | Data |
| `title` | String | Data |
| `description` | String | Data |
| `duration` | Number | Data |
| `videoUrl` | String | Data |
| `timestamps` | Date (Auto) | Data |

### Relationships

| Field | References | Type |
|-------|------------|------|
| `seasonId` | `Season` | Many-to-One |
  

###  3.2.6 `ContentCast`

| Field | Type | Classification |
|-------|------|----------------|
| `contentId` | ObjectId (Ref: Content) | **Problem Solving** |
| `castId` | ObjectId (Ref: Cast) | **Problem Solving** |
| `characterName` | String | Data |
| `timestamps` | Date (Auto) | Data |

### Relationships

| Field | References | Type |
|-------|------------|------|
| `contentId` | `Content` | Many-to-One |
| `castId` | `Cast` | Many-to-One |

### Notes

This is a **junction table** that establishes a many-to-many relationship between `Content` and `Cast`. Each record associates a specific cast member with a content item and defines the character name they played.

###  3.2.7 `ContentGenre`

| Field | Type | Classification |
|-------|------|----------------|
| `contentId` | ObjectId (Ref: Content) | **Problem Solving** |
| `genreId` | ObjectId (Ref: Genre) | **Problem Solving** |
| `timestamps` | Date (Auto) | Data |

### Relationships

| Field | References | Type |
|-------|------------|------|
| `contentId` | `Content` | Many-to-One |
| `genreId` | `Genre` | Many-to-One |

### Notes

This is a **junction table** that establishes a many-to-many relationship between `Content` and `Genre`. Each record associates a content item with a genre.

### Indexes

- No explicit indexes defined; relies on default `_id` index.
- Consider adding compound index `{ contentId: 1, genreId: 1 }` for query performance.

###  3.3 `Devices`

| Field | Type | Classification |
|-------|------|----------------|
| `userId` | ObjectId (Ref: User) | **Problem Solving** |
| `deviceName` | String | Data |
| `deviceId` | String | Data |
| `deviceType` | String (Enum) | **Problem Solving** |
| `ipAddress` | String | Data |
| `lastActive` | Date | Data |
| `timestamps` | Date (Auto) | Data |

### Relationships

| Field | References | Type |
|-------|------------|------|
| `userId` | `User` | Many-to-One |

### Indexes

| Index | Purpose |
|-------|---------|
| `deviceId: 1` | Enables fast lookups by device identifier |

### Notes

- Tracks user devices for session management and security
- `deviceType` uses enum values from `DEVICE_TYPE` constant
- `lastActive` is updated on each interaction to track device activity

###  3.4 `Profiles`

| Field | Type | Classification |
|-------|------|----------------|
| `userId` | ObjectId (Ref: User) | **Problem Solving** |
| `name` | String | Data |
| `avatar` | String | Data |
| `pin` | String | **Problem Solving** |
| `isKids` | Boolean | **Problem Solving** |
| `minAge` | Number | **Problem Solving** |
| `primaryProfile` | Boolean | **Problem Solving** |
| `status` | String (Enum) | **Problem Solving** |
| `timestamps` | Date (Auto) | Data |
| `isPinProtected` | Virtual (Boolean) | **Problem Solving** |

### Relationships

| Field | References | Type |
|-------|------------|------|
| `userId` | `User` | Many-to-One |

### Indexes

| Index | Purpose |
|-------|---------|
| `userId: 1` | Optimizes queries for user profiles |
| `{ userId: 1, primaryProfile: 1 }` with `partialFilterExpression: { primaryProfile: true }` | Ensures only one primary profile per user |

### Notes

- `pin` is stored as a hashed value (security)
- `isPinProtected` virtual returns `true` if `pin` is set
- `primaryProfile: true` marks the owner profile (cannot be deleted)
- `minAge` used for age-restricted content filtering
- 
###  3.5 `Plans`


| Field | Type | Classification |
|-------|------|----------------|
| `name` | String (Unique) | **Problem Solving** |
| `description` | String | Data |
| `price` | Number | **Problem Solving** |
| `duration` | Number (Days) | **Problem Solving** |
| `maxDevices` | Number | **Problem Solving** |
| `maxProfiles` | Number | **Problem Solving** |
| `quality` | String (Enum) | **Problem Solving** |
| `isActive` | Boolean | **Problem Solving** |
| `isLimited` | Boolean | **Problem Solving** |
| `maxMovies` | Number | **Problem Solving** |
| `maxSeries` | Number | **Problem Solving** |
| `timestamps` | Date (Auto) | Data |

### Notes

- `isLimited` determines if the plan has content consumption limits:
  - `true`: User can watch up to `maxMovies` and `maxSeries` titles
  - `false`: Unlimited viewing (all limits are ignored)
- `quality` uses enum values from `QUALITY` constant (e.g., SD, HD, Full HD, 4K)
- `duration` is measured in days
- `price` cannot be negative; `duration`, `maxDevices`, `maxProfiles` must be at least 1

###  3.6.1 `Subscriptions`


| Field | Type | Classification |
|-------|------|----------------|
| `userId` | ObjectId (Ref: User) | **Problem Solving** |
| `planId` | ObjectId (Ref: Plan) | **Problem Solving** |
| `startDate` | Date | Data |
| `endDate` | Date | Data |
| `status` | String (Enum) | **Problem Solving** |
| `autoRenew` | Boolean | **Problem Solving** |
| `notes` | String | Data |
| `timestamps` | Date (Auto) | Data |
| `startDateFormatted` | Virtual (String) | Data |
| `endDateFormatted` | Virtual (String) | Data |

### Relationships

| Field | References | Type |
|-------|------------|------|
| `userId` | `User` | Many-to-One |
| `planId` | `Plan` | Many-to-One |

### Status Values

| Value | Description |
|-------|-------------|
| `active` | Subscription is currently active and valid |
| `expired` | Subscription has passed its end date |
| `cancelled` | Subscription was manually cancelled |
| `pending` | Awaiting payment confirmation or activation |
| `upgraded` | Subscription was upgraded to a new plan |

### Notes


- `startDateFormatted` and `endDateFormatted` are virtuals that return dates in `YYYY-MM-DD` format
- `autoRenew` determines if the subscription should automatically renew
- When a user upgrades, the old subscription status changes to `upgraded` and a new subscription is created with `active` status

### 3.6.2 `SubscriptionConsumption`

| Field | Type | Classification |
|-------|------|----------------|
| `subscriptionId` | ObjectId (Ref: Subscription) | **Problem Solving** |
| `userId` | ObjectId (Ref: User) | **Problem Solving** |
| `contentId` | ObjectId (Ref: Content) | **Problem Solving** |
| `contentType` | String (Enum) | **Problem Solving** |
| `consumedAt` | Date | Data |
| `timestamps` | Date (Auto) | Data |

### Relationships

| Field | References | Type |
|-------|------------|------|
| `subscriptionId` | `Subscription` | Many-to-One |
| `userId` | `User` | Many-to-One |
| `contentId` | `Content` | Many-to-One |

### Indexes

| Index | Purpose |
|-------|---------|
| `{ subscriptionId: 1, contentId: 1 }` with `unique: true` | Prevents the same content from being counted twice per subscription |

### Notes

- Tracks which content has been **consumed** and counted against a subscription
- **Unique Index:** Ensures a subscription cannot consume the same content twice
- Used primarily for **limited plans** to enforce `maxMovies` and `maxSeries` limits
- `contentType` can be either `'movie'` or `'series'`

### Example

```
// First time watching Movie A → Record is created
// Re-watching Movie A → Record already exists, no new consumption
```

### 3.6.3 `SubscriptionUsage`

| Field | Type | Classification |
|-------|------|----------------|
| `subscriptionId` | ObjectId (Ref: Subscription) | **Problem Solving** |
| `userId` | ObjectId (Ref: User) | **Problem Solving** |
| `moviesUsedCount` | Number | **Problem Solving** |
| `seriesUsedCount` | Number | **Problem Solving** |
| `timestamps` | Date (Auto) | Data |

### Relationships

| Field | References | Type |
|-------|------------|------|
| `subscriptionId` | `Subscription` | One-to-One |
| `userId` | `User` | Many-to-One |

### Indexes

| Index | Purpose |
|-------|---------|
| `subscriptionId: 1` with `unique: true` | Ensures only one usage record per subscription |

### Notes

- Provides **fast aggregate counters** for consumed content per subscription
- `moviesUsedCount` increments when a new movie is consumed
- `seriesUsedCount` increments when a new series is consumed
- **Prevents double-counting:** Same content is counted only once via `SubscriptionConsumption` unique index
- Used for quick limit checks: `moviesUsedCount < plan.maxMovies` and `seriesUsedCount < plan.maxSeries`

### Example

```javascript
// Plan allows: 5 Movies, 3 Series
// After watching Movie A, Movie B, and Series X
// moviesUsedCount = 2
// seriesUsedCount = 1
// Re-watching Movie A does NOT increment moviesUsedCount
```
###  3.7 `WatchHistory`


| Field | Type | Classification |
|-------|------|----------------|
| `profileId` | ObjectId (Ref: Profile) | **Problem Solving** |
| `contentId` | ObjectId (Ref: Content) | **Problem Solving** |
| `episodeId` | ObjectId (Ref: Episode) | **Problem Solving** |
| `progressTime` | Number (Seconds) | Data |
| `totalDuration` | Number (Seconds) | Data |
| `completed` | Boolean | Data |
| `watchedAt` | Date | Data |
| `timestamps` | Date (Auto) | Data |

### Relationships

| Field | References | Type |
|-------|------------|------|
| `profileId` | `Profile` | Many-to-One |
| `contentId` | `Content` | Many-to-One |
| `episodeId` | `Episode` | Many-to-One (Optional) |

### Indexes

| Index | Purpose |
|-------|---------|
| `{ profileId: 1, contentId: 1 }` with `partialFilterExpression: { episodeId: null }` and `unique: true` | Ensures only one history record per movie per profile |
| `{ profileId: 1, contentId: 1, episodeId: 1 }` with `partialFilterExpression: { episodeId: { $ne: null } }` and `unique: true` | Ensures only one history record per episode per profile |

### TTL (Auto-Deletion)

| Field | Expiry |
|-------|--------|
| `watchedAt` | 365 days (1 year) after last update |

### Notes

- Tracks the **last watched position** for each piece of content per profile
- `progressTime` stores the timestamp in seconds (e.g., `1800` = 30 minutes)
- `completed: true` when `progressTime >= totalDuration * 0.9`
- **Movies:** `episodeId` is `null` → one record per `{ profileId, contentId }`
- **Series:** `episodeId` is set → one record per `{ profileId, contentId, episodeId }`
- `watchedAt` updates on every progress update to reset the TTL counter
- Records are automatically deleted after **1 year of inactivity**

### Example

```javascript
// Movie: Inception → { profileId: 'abc', contentId: '123', episodeId: null }
// Series: GOT S1E1 → { profileId: 'abc', contentId: '456', episodeId: '789' }
``` 
###  3.8 `Genres`

| Field | Type | Classification |
|-------|------|----------------|
| `name` | String (Unique) | Data |
| `description` | String | Data |
| `timestamps` | Date (Auto) | Data |

### Indexes

| Index | Purpose |
|-------|---------|
| `name: 1` with `unique: true` | Ensures genre names are unique; enables fast lookups by name |

### Cascade Delete (Middleware)

When a genre document is deleted, the following related data is automatically removed:

- `ContentGenre` (content associations)

### Notes

- Used to categorize content (e.g., Action, Drama, Sci-Fi, Comedy)
- `name` must be unique and is trimmed before saving
- Cascade delete ensures no orphaned `ContentGenre` records remain
- `description` is optional

### 3.9 `Cast`

| Field | Type | Classification |
|-------|------|----------------|
| `name` | String (Unique) | Data |
| `image` | String | Data |
| `biography` | String | Data |
| `timestamps` | Date (Auto) | Data |

### Indexes

| Index | Purpose |
|-------|---------|
| `name: 1` with `unique: true` | Ensures cast names are unique; enables fast lookups by name |

### Cascade Delete (Middleware)

When a cast document is deleted, the following related data is automatically removed:

- `ContentCast` (content associations)

### Notes

- Represents actors, directors, or other cast members
- `name` must be unique and is trimmed before saving
- Cascade delete ensures no orphaned `ContentCast` records remain
- `image` and `biography` are optional fields

###  3.10 `Ratings`


| Field | Type | Classification |
|-------|------|----------------|
| `profileId` | ObjectId (Ref: Profile) | **Problem Solving** |
| `contentId` | ObjectId (Ref: Content) | **Problem Solving** |
| `rating` | Number (1–5) | Data |
| `review` | String | Data |
| `isUpdated` | Boolean | Data |
| `timestamps` | Date (Auto) | Data |

### Relationships

| Field | References | Type |
|-------|------------|------|
| `profileId` | `Profile` | Many-to-One |
| `contentId` | `Content` | Many-to-One |

### Indexes

| Index | Purpose |
|-------|---------|
| `{ profileId: 1, contentId: 1 }` with `unique: true` | Ensures a profile can rate a specific content only once |

### Notes

- Allows users to rate content on a scale of **1 to 5**
- `isUpdated` tracks if the rating was modified after initial submission
- `review` is optional (user can rate without writing a review)
- The unique index prevents duplicate ratings from the same profile for the same content
- When a rating is updated, `isUpdated` should be set to `true`

###  3.11 `Favorites`


| Field | Type | Classification |
|-------|------|----------------|
| `profileId` | ObjectId (Ref: Profile) | **Problem Solving** |
| `contentId` | ObjectId (Ref: Content) | **Problem Solving** |
| `createdAt` | Date (Auto) | Data |

### Relationships

| Field | References | Type |
|-------|------------|------|
| `profileId` | `Profile` | Many-to-One |
| `contentId` | `Content` | Many-to-One |

### Indexes

| Index | Purpose |
|-------|---------|
| `{ profileId: 1, contentId: 1 }` with `unique: true` | Prevents a profile from favoriting the same content multiple times |

### Notes

- Tracks content that a user has marked as a **favorite**
- The unique index ensures no duplicate favorites
- `updatedAt` is disabled (`updatedAt: false`) since favorites are immutable after creation
- To remove a favorite, delete the document rather than updating it

### 3.12 `Watchlist`

| Field | Type | Classification |
|-------|------|----------------|
| `profileId` | ObjectId (Ref: Profile) | **Problem Solving** |
| `contentId` | ObjectId (Ref: Content) | **Problem Solving** |
| `timestamps` | Date (Auto) | Data |

### Relationships

| Field | References | Type |
|-------|------------|------|
| `profileId` | `Profile` | Many-to-One |
| `contentId` | `Content` | Many-to-One |

### Indexes

| Index | Purpose |
|-------|---------|
| `profileId: 1` | Optimizes queries for a profile's watchlist |
| `contentId: 1` | Optimizes queries for which profiles have a content in their watchlist |
| `{ profileId: 1, contentId: 1 }` with `unique: true` | Prevents a profile from adding the same content to their watchlist multiple times |

### Notes

- Represents content that a user plans to **watch later**
- The unique index ensures no duplicate watchlist entries
- Unlike `Favorite`, `Watchlist` is for **planned viewing** rather than liked content
- Can be used for "Add to Watchlist" functionality

### 3.13 `Payment`

| Field | Type | Classification |
|-------|------|----------------|
| `userId` | ObjectId (Ref: User) | **Problem Solving** |
| `subscriptionId` | ObjectId (Ref: Subscription) | **Problem Solving** |
| `amount` | Number | Data |
| `currency` | String | Data |
| `status` | String (Enum) | **Problem Solving** |
| `paymentMethod` | String (Enum) | Data |
| `transactionId` | String (Unique) | Data |
| `timestamps` | Date (Auto) | Data |

### Relationships

| Field | References | Type |
|-------|------------|------|
| `userId` | `User` | Many-to-One |
| `subscriptionId` | `Subscription` | Many-to-One |

### Indexes

| Index | Purpose |
|-------|---------|
| `{ userId: 1, createdAt: -1 }` | Optimizes queries for a user's payment history (newest first) |
| `transactionId: 1` with `unique: true` | Ensures no duplicate transaction IDs |

### Status Values

| Value | Description |
|-------|-------------|
| `pending` | Payment is being processed |
| `completed` | Payment was successful |
| `failed` | Payment was declined or failed |
| `refunded` | Payment was refunded |

### Payment Methods

| Value | Description |
|-------|-------------|
| `visa` | Visa credit/debit card |
| `mastercard` | Mastercard credit/debit card |
| `paypal` | PayPal payment |
| `apple_pay` | Apple Pay |
| `fawry` | Fawry payment (Egypt) |

### Post-Save Hook

When a payment is saved with `status: 'completed'`, the associated subscription is automatically updated to `status: 'active'`.

### Notes

- `transactionId` is **unique** to prevent duplicate transaction processing
- `currency` defaults to `'USD'`
- The post-save hook ensures subscription activation is tied to successful payment
- Payments are immutable; refunds create a new record with `status: 'refunded'`

---