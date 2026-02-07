use sqlx::sqlite::SqlitePoolOptions;
use sqlx::{Pool, Sqlite};
use tauri::{AppHandle, Manager};
use std::fs;
use std::path::PathBuf;

pub struct AppState {
    pub db: Pool<Sqlite>,
}

pub async fn init_db(app_handle: &AppHandle) -> Result<Pool<Sqlite>, String> {
    let app_dir = app_handle.path().app_data_dir().expect("failed to get app data dir");
    if !app_dir.exists() {
        fs::create_dir_all(&app_dir).expect("failed to create app data dir");
    }
    let db_path = app_dir.join("pingpong.db");
    let db_url = format!("sqlite://{}", db_path.to_string_lossy());

    // Create file if not exists (sqlite requires it usually, or sqlx create_if_missing)
    if !db_path.exists() {
        fs::File::create(&db_path).map_err(|e| e.to_string())?;
    }

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            fun_nickname TEXT,
            avatar TEXT,
            color TEXT,
            icon TEXT,
            wins INTEGER DEFAULT 0,
            matches_played INTEGER DEFAULT 0
        );",
    )
    .execute(&pool)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS game_modes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            points_to_win INTEGER DEFAULT 11,
            serves_before_change INTEGER DEFAULT 2,
            rules_description TEXT,
            is_deuce_enabled BOOLEAN DEFAULT 1,
            serves_in_deuce INTEGER DEFAULT 1,
            serve_type TEXT DEFAULT 'free'
        );",
    )
    .execute(&pool)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player1_id INTEGER NOT NULL REFERENCES users(id),
            player2_id INTEGER NOT NULL REFERENCES users(id),
            game_mode_id INTEGER NOT NULL REFERENCES game_modes(id),
            score_p1 INTEGER DEFAULT 0,
            score_p2 INTEGER DEFAULT 0,
            status TEXT DEFAULT 'in_progress',
            winner_id INTEGER REFERENCES users(id),
            start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            end_time DATETIME,
            match_rules TEXT NOT NULL DEFAULT '{}',
            events TEXT NOT NULL DEFAULT '[]'
        );",
    )
    .execute(&pool)
    .await
    .map_err(|e| e.to_string())?;

    // Seed default game modes if empty
    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM game_modes")
        .fetch_one(&pool)
        .await
        .map_err(|e| e.to_string())?;

    if count.0 == 0 {
        sqlx::query("INSERT INTO game_modes (name, points_to_win, serves_before_change, rules_description, is_deuce_enabled, serves_in_deuce, serve_type) VALUES 
        ('Standard 11', 11, 2, 'Classic game to 11 points (2 serves each)', 1, 1, 'free'),
        ('Classic 21', 21, 5, 'Old school game to 21 points (5 serves each)', 1, 1, 'free')")
        .execute(&pool)
        .await
        .map_err(|e| e.to_string())?;
    }

    Ok(pool)
}
