# Ping Pong Counter API

Backend API for tracking Ping Pong matches, managing users, and game modes.

## Base URL
Defaults to `http://localhost:5001/api`.

---

## 1. Users

### Get All Users
- **Endpoint**: `GET /users`
- **Response**: Array of User objects.

### Create Quick User
- **Endpoint**: `POST /users/quick`
- **Body**:
  ```json
  { "name": "Davide" }
  ```
- **Description**: Creates a user with a fun generated nickname.
- **Response**: User object.

---

## 2. Game Modes

### Get All Game Modes
- **Endpoint**: `GET /gamemodes`
- **Response**: Array of GameMode objects (Standard 11, Turbo 7, etc.).

### Create Game Mode
- **Endpoint**: `POST /gamemodes`
- **Body**:
  ```json
  {
    "name": "Custom 50",
    "pointsToWin": 50,
    "servesBeforeChange": 5,
    "isDeuceEnabled": true
  }
  ```

---

## 3. Matches

The match flow is stateful. You start a match, send point updates, and the backend calculates the winner.

### Start a Match
- **Endpoint**: `POST /match/start`
- **Body**:
  ```json
  {
    "player1Id": "64c9f...",
    "player2Id": "64c9e...",
    "gameModeId": "64ca0..."
  }
  ```
- **Response**: Match object with `status: "in_progress"`.

### Add Point
- **Endpoint**: `POST /match/:id/point`
- **Body**:
  ```json
  { "playerId": "64c9f..." } 
  ```
- **Description**: Adds a point for the specified player. Automatically checks for win condition.
- **Response**: Updated Match object. If match ends, `status` becomes `"finished"` and `winner` is set.

### Undo Last Point
- **Endpoint**: `POST /match/:id/undo`
- **Body**: `{}` (Empty body)
- **Description**: Reverts the last point. If match was finished, reopens it.
- **Response**: Updated Match object.

### Get Match Details
- **Endpoint**: `GET /match/:id`
- **Response**: Full match object with populated players and game mode.

### Get User Match History
- **Endpoint**: `GET /match/user/:userId`
- **Response**: Array of matches where the user was either player 1 or player 2.

---

## Developer Notes
- **Models**:
  - `User`: `{ name, funNickname, wins }`
  - `GameMode`: `{ name, pointsToWin, servesBeforeChange, isDeuceEnabled }`
  - `Match`: Tracks `score`, `events`, `status`, `winner`.
- **Logic**:
  - Win condition is checked on every point.
  - Deuce logic is respected (win by 2).
  - Wins are incremented on User model only when match finishes.
