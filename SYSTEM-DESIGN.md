
# StreamFlix - DATABASE DESIGN  
  
## 1. Overview  
StreamFlix is a system for streaming video content to users by subscribing to a chosen plan. Each plan has specific features and price .  
  
---  
### Goals  
- Display all the content available to the users.  
- Stream video content to the users.  
- Provide personalized recommendations.  
- Allow ratings and favorites for the users.  

  
  
## 2. Actors  
* User  
* Content Manager  
* Super Admin.  
  
---  
  
## 3. Collections & Field Classification  
  
### 3.1 `Users`  
| Field | Type | Classification |  
|---|---|---|---|  
| `name`, `email`, `phone`, `password` , `lastLogin` | String | **Data** |  
| `role`, `status`| String | **Problem Solving** |  
| `failedLoginAttempts`, `lockUntil`, `bannedReason` , `bannedUntil` | — | **Problem Solving** |  


  
  
### 3.2.1 `Content`  
| Field | Type | Classification |  
|---|---|---|---|  
| `title`, `description`, `poster`, `trailerUrl`, `releaseYear`, `viewsCount` | - | **Data** |  
| `ageRating` , `status` , `type`| String | **Problem Solving**  
| `averageRating` , `ratingCount` | Number | **Data** | |  

  
  
### 3.2.2 `Movies`  
| Field | Type | Classification |  
|---|---|---|---|  
| `contentId` | ObjectId | **Relationship** |  
| `duration` , `videoUrl` | - | **Data** |  
  
  
### 3.2.3 `Series`  
| Field | Type | Classification |  
|---|---|---|---|  
| `contentId` | ObjectId | **Relationship** |  
| `totalSeasons` | Number | **Data** |  
  
  
### 3.2.4 `Seasons`  
| Field | Type | Classification |  
|---|---|---|---|  
| `seriesId` | ObjectId | **Relationship** |  
| `seasonNumber` , `title` | - | **Data** |  

  
  
### 3.2.5 `Episods`  
| Field | Type | Classification |  
|---|---|---|---|  
| `seasonId` | ObjectId | **Relationship** |  
| `episodeNumber` , `title` , `description` , `duration` , `videoUrl` | - | **Data** |  

  
  
### 3.2.6 `ContentCast`  
| Field | Type | Classification |  
|---|---|---|---|  
| `contentId` , `castId` | ObjectId | **Relationship** |  
| `characterName` | String | **Data** |  
  
  
### 3.2.7 `ContentGenre`  
| Field | Type | Classification |  
|---|---|---|---|  
| `contentId` , `genreId` | ObjectId | **Relationship** |  
  
  
### 3.3 `Devices`  
| Field | Type | Classification |  
|---|---|---|---|  
| `userId` | ObjectId | **Relationship** |  
| `deviceName`, `deviceType`, `ipAddress` | String | **Data** |  
| `lastActive` | Date | **Data** |  
  
  
### 3.4 `Profiles`  
| Field | Type | Classification |  
|---|---|---|---|  
| `userId` | ObjectId | **Relationship** | |  
| `name` , `avatar`  , `minAge` | - | **Data** | |  
| `isKids` | Boolean | **Problem-Solving** | |  
| `pin` | String | **Problem-Solving** | |
  
### 3.5 `Plans`  
| Field | Type | Classification |  
|---|---|---|---|  
| `name` , `price` , `duration` , `quality`  , `startDate`, `endDate`  ,`notes` , `isActive`  | — | **Data** | |  
| `maxDevices` , `maxProfiles` ,`autoRenew`| --- | **Problem Solving**  
  
  
### 3.6 `Subscriptions`  
| Field | Type | Classification |  
|---|---|---|---|  
| `userId` , `planId` , `activatedBy` | ObjectId | **Relationship** | |  
| `startDate`, `endDate`  ,`notes` | — | **Data** | |  
| `status` `paymentProof` , `autoRenew` | --- | **Problem Solving**  
  
  
### 3.7 `WatchHistory`  
| Field | Type | Classification |  
|---|---|---|---|  
| `profileId` , `contentId` , `episodeId` | ObjectId | **Relationship** |  
| `totalDuration` , `completed` , `watchedAt` | - | **Data** |  
| `progressTime` | String | **Problem Solving** |  
  
  
  
### 3.8 `Genres`  
| Field | Type | Classification |  
|---|---|---|---|  
| `name` , `description` | String | **Data** |  
  
  
  
### 3.9 `Ratings`  
| Field | Type | Classification |  
|---|---|---|---|  
| `profileId` , `contentId` | ObjectId | **Relationship** |  
| `rating` , `review` , `isUpdated` | - | **Data**`` |  
  
  
### 3.10 `Favorites`  
| Field | Type | Classification |  
|---|---|---|---|  
| `profileId` , `contentId` | ObjectId | ****Relationship**** |  
  
  
---