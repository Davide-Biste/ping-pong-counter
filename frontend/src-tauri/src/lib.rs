mod db;
mod models;
mod commands;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Initialize Database
      let handle = app.handle().clone();
      tauri::async_runtime::block_on(async move {
          let pool = db::init_db(&handle).await.expect("Database initialization failed");
          handle.manage(db::AppState { db: pool });
      });

      Ok(())
    })
    .plugin(
        tauri_plugin_sql::Builder::default()
            .add_migrations("sqlite:pingpong.db", vec![
                tauri_plugin_sql::Migration {
                    version: 1,
                    description: "create_initial_tables",
                    sql: include_str!("../migrations/1_init.sql"),
                    kind: tauri_plugin_sql::MigrationKind::Up,
                }
            ])
            .build()
    )
    .invoke_handler(tauri::generate_handler![
        commands::get_users,
        commands::create_user,
        commands::update_user,
        commands::get_game_modes,
        commands::create_game_mode,
        commands::ensure_basic_game_mode,
        commands::start_match,
        commands::add_point,
        commands::undo_last_point,
        commands::get_match,
        commands::get_user_matches,
        commands::set_first_server,
        commands::cancel_match,
        commands::get_user_statistics
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
