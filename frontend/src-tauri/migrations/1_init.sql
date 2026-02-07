CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    fun_nickname TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    color TEXT DEFAULT 'blue',
    icon TEXT DEFAULT 'user',
    wins INTEGER DEFAULT 0,
    matches_played INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS game_modes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    points_to_win INTEGER NOT NULL DEFAULT 11,
    serves_before_change INTEGER NOT NULL DEFAULT 2,
    rules_description TEXT DEFAULT '',
    is_deuce_enabled BOOLEAN DEFAULT 1,
    serves_in_deuce INTEGER DEFAULT 1,
    serve_type TEXT DEFAULT 'free' -- 'free' or 'cross'
);

CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player1_id INTEGER NOT NULL,
    player2_id INTEGER NOT NULL,
    game_mode_id INTEGER NOT NULL,
    status TEXT DEFAULT 'in_progress', -- 'in_progress', 'finished', 'abandoned'
    score_p1 INTEGER DEFAULT 0,
    score_p2 INTEGER DEFAULT 0,
    events TEXT DEFAULT '[]', -- JSON String of events
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    winner_id INTEGER,
    match_rules TEXT DEFAULT '{}', -- JSON String of specific rules snapshot
    FOREIGN KEY(player1_id) REFERENCES users(id),
    FOREIGN KEY(player2_id) REFERENCES users(id),
    FOREIGN KEY(game_mode_id) REFERENCES game_modes(id),
    FOREIGN KEY(winner_id) REFERENCES users(id)
);
