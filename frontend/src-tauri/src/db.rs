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

    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .map_err(|e| format!("Migration failed: {}", e))?;

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
