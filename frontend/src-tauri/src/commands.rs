use crate::db::AppState;
use crate::models::{
    CreateGameModeDto, CreateUserDto, GameMode, Match, MatchEvent, MatchRules, ModeStat, OpponentStat, PopulatedMatch,
    RecentMatch, ScoreSnapshot, User, UserStatistics
};
use chrono::Utc;
use serde_json::json;
use sqlx::{Pool, Sqlite};
use std::collections::HashMap;
use tauri::{State, Window};

// --- Helper Functions ---

fn check_win_condition(
    p1_score: i64,
    p2_score: i64,
    points_to_win: i64,
    is_deuce_enabled: bool,
) -> Option<String> {
    // Basic Win
    if p1_score >= points_to_win && p1_score > p2_score + 1 && !is_deuce_enabled {
        return Some("p1".to_string());
    }
    if p2_score >= points_to_win && p2_score > p1_score + 1 && !is_deuce_enabled {
        return Some("p2".to_string());
    }

    // Deuce Logic (requires 2 point lead)
    if is_deuce_enabled {
        if p1_score >= points_to_win && p1_score >= p2_score + 2 {
            return Some("p1".to_string());
        }
        if p2_score >= points_to_win && p2_score >= p1_score + 2 {
            return Some("p2".to_string());
        }
    }

    // Default fallback (standard ping pong often implies win by 2)
    if p1_score >= points_to_win && p1_score >= p2_score + 2 {
        return Some("p1".to_string());
    }
    if p2_score >= points_to_win && p2_score >= p1_score + 2 {
        return Some("p2".to_string());
    }

    None
}

async fn populate_match(pool: &Pool<Sqlite>, match_data: Match) -> Result<PopulatedMatch, String> {
    let p1: User = sqlx::query_as("SELECT * FROM users WHERE id = ?")
        .bind(match_data.player1_id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    let p2: User = sqlx::query_as("SELECT * FROM users WHERE id = ?")
        .bind(match_data.player2_id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    let gm: GameMode = sqlx::query_as("SELECT * FROM game_modes WHERE id = ?")
        .bind(match_data.game_mode_id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    let winner: Option<User> = if let Some(wid) = match_data.winner_id {
         sqlx::query_as("SELECT * FROM users WHERE id = ?")
            .bind(wid)
            .fetch_optional(pool)
            .await
            .map_err(|e| e.to_string())?
    } else {
        None
    };

    let p3: Option<User> = if let Some(p3_id) = match_data.player3_id {
         sqlx::query_as("SELECT * FROM users WHERE id = ?")
            .bind(p3_id)
            .fetch_optional(pool)
            .await
            .map_err(|e| e.to_string())?
    } else { None };

    let p4: Option<User> = if let Some(p4_id) = match_data.player4_id {
         sqlx::query_as("SELECT * FROM users WHERE id = ?")
            .bind(p4_id)
            .fetch_optional(pool)
            .await
            .map_err(|e| e.to_string())?
    } else { None };

    let events: Vec<MatchEvent> =
        serde_json::from_str(&match_data.events).unwrap_or_default();
    let match_rules: MatchRules =
        serde_json::from_str(&match_data.match_rules).unwrap_or(MatchRules {
            serves_in_deuce: 1,
            serve_type: "free".to_string(),
            first_server_id: None,
        });

    let first_server = match_rules.first_server_id;

    Ok(PopulatedMatch {
        id: match_data.id,
        player1: p1,
        player2: p2,
        player3: p3,
        player4: p4,
        game_mode: gm,
        status: match_data.status,
        score: ScoreSnapshot {
            p1: match_data.score_p1,
            p2: match_data.score_p2,
        },
        events,
        match_rules,
        winner,
        first_server,
    })
}




// --- Commands ---

#[tauri::command]
pub async fn get_users(state: State<'_, AppState>) -> Result<Vec<User>, String> {
    sqlx::query_as::<_, User>("SELECT * FROM users")
        .fetch_all(&state.db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_user(
    state: State<'_, AppState>,
    name: String,
    nickname: String,
    color: String,
    icon: String,
) -> Result<User, String> {
    println!("Creating user: {}, nickname: {:?}, color: {}, icon: {}", name, nickname, color, icon);
    let avatar = "";

    let result = sqlx::query(
        "INSERT INTO users (name, fun_nickname, avatar, color, icon) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(&name)
    .bind(&nickname)
    .bind(avatar)
    .bind(&color)
    .bind(&icon)
    .execute(&state.db)
    .await;
    
    match &result {
        Ok(r) => println!("User created with ID: {}", r.last_insert_rowid()),
        Err(e) => println!("Failed to create user: {}", e),
    }

    let result = result.map_err(|e| e.to_string())?;

    let id = result.last_insert_rowid();

    sqlx::query_as("SELECT * FROM users WHERE id = ?")
        .bind(id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_user(
    state: State<'_, AppState>,
    id: i64,
    name: String,
    color: String,
    icon: String,
) -> Result<User, String> {
    sqlx::query("UPDATE users SET name = ?, color = ?, icon = ? WHERE id = ?")
        .bind(&name)
        .bind(&color)
        .bind(&icon)
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query_as("SELECT * FROM users WHERE id = ?")
        .bind(id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_game_modes(state: State<'_, AppState>) -> Result<Vec<GameMode>, String> {
    sqlx::query_as::<_, GameMode>("SELECT * FROM game_modes")
        .fetch_all(&state.db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_game_mode(
    state: State<'_, AppState>,
    name: String,
    points_to_win: i64,
    serves_before_change: i64,
    rules_description: Option<String>,
    is_deuce_enabled: bool,
    serves_in_deuce: i64,
    serve_type: String,
) -> Result<GameMode, String> {
    let result = sqlx::query(
        "INSERT INTO game_modes (name, points_to_win, serves_before_change, rules_description, is_deuce_enabled, serves_in_deuce, serve_type) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&name)
    .bind(points_to_win)
    .bind(serves_before_change)
    .bind(rules_description.unwrap_or_default())
    .bind(is_deuce_enabled)
    .bind(serves_in_deuce)
    .bind(&serve_type)
    .execute(&state.db)
    .await
    .map_err(|e| e.to_string())?;

    let id = result.last_insert_rowid();

    sqlx::query_as("SELECT * FROM game_modes WHERE id = ?")
        .bind(id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| e.to_string())
}

// Quick seed for basic game mode if none exists
#[tauri::command]
pub async fn ensure_basic_game_mode(state: State<'_, AppState>) -> Result<(), String> {
    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM game_modes")
        .fetch_one(&state.db)
        .await
        .map_err(|e| e.to_string())?;

    if count.0 == 0 {
        sqlx::query("INSERT INTO game_modes (name, points_to_win, serves_before_change, rules_description, is_deuce_enabled, serves_in_deuce, serve_type) VALUES 
        ('Standard 11', 11, 2, 'Classic game to 11 points (2 serves each)', 1, 1, 'free'),
        ('Classic 21', 21, 5, 'Old school game to 21 points (5 serves each)', 1, 1, 'free')")
            .execute(&state.db)
            .await
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}


#[tauri::command]
pub async fn start_match(
    state: State<'_, AppState>,
    player1_id: i64,
    player2_id: i64,
    game_mode_id: i64,
    serves_in_deuce: Option<i64>,
    serve_type: Option<String>,
    player3_id: Option<i64>,
    player4_id: Option<i64>,
) -> Result<PopulatedMatch, String> {
    println!("Starting match: p1={}, p2={}, p3={:?}, p4={:?}, mode={}", player1_id, player2_id, player3_id, player4_id, game_mode_id);
    let gm: GameMode = sqlx::query_as("SELECT * FROM game_modes WHERE id = ?")
        .bind(game_mode_id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| format!("GameMode not found: {}", e))?;

    let match_rules = MatchRules {
        serves_in_deuce: serves_in_deuce.unwrap_or(gm.serves_in_deuce),
        serve_type: serve_type.or(gm.serve_type).unwrap_or("free".to_string()),
        first_server_id: None,
    };

    let rules_json = serde_json::to_string(&match_rules).unwrap();

    let result = sqlx::query(
        "INSERT INTO matches (player1_id, player2_id, player3_id, player4_id, game_mode_id, status, match_rules, events) VALUES (?, ?, ?, ?, ?, 'in_progress', ?, '[]')"
    )
    .bind(player1_id)
    .bind(player2_id)
    .bind(player3_id)
    .bind(player4_id)
    .bind(game_mode_id)
    .bind(rules_json)
    .execute(&state.db)
    .await
    .map_err(|e| e.to_string())?;

    let id = result.last_insert_rowid();
    println!("Match started with ID: {}", id);

    let match_data: Match = sqlx::query_as("SELECT * FROM matches WHERE id = ?")
        .bind(id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| e.to_string())?;

    populate_match(&state.db, match_data).await
}

#[tauri::command]
pub async fn add_point(
    state: State<'_, AppState>,
    match_id: i64,
    player_id: i64,
) -> Result<PopulatedMatch, String> {
    println!("add_point called: match_id={}, player_id={}", match_id, player_id);
    // 1. Fetch Match
    let mut match_data: Match = sqlx::query_as("SELECT * FROM matches WHERE id = ?")
        .bind(match_id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| "Match not found".to_string())?;

    if match_data.status != "in_progress" {
        return Err("Match is finished".to_string());
    }

    // 2. Identify Player side
    let is_p1_side = match_data.player1_id == player_id || match_data.player3_id == Some(player_id);
    let is_p2_side = match_data.player2_id == player_id || match_data.player4_id == Some(player_id);

    if !is_p1_side && !is_p2_side {
        return Err("User is not in this match".to_string());
    }

    // 3. Update Score
    if is_p1_side { match_data.score_p1 += 1; }
    if is_p2_side { match_data.score_p2 += 1; }

    // 4. Update Events
    let mut events: Vec<MatchEvent> = serde_json::from_str(&match_data.events).unwrap_or_default();
    events.push(MatchEvent {
        event_type: "point".to_string(),
        element_id: Some(player_id.to_string()),
        timestamp: Utc::now().timestamp_millis(),
        score_snapshot: ScoreSnapshot {
            p1: match_data.score_p1,
            p2: match_data.score_p2,
        },
    });
    match_data.events = serde_json::to_string(&events).map_err(|e| e.to_string())?;

    // 5. Check Win
    let gm: GameMode = sqlx::query_as("SELECT * FROM game_modes WHERE id = ?")
        .bind(match_data.game_mode_id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| "GameMode not found".to_string())?;

    let winner_key = check_win_condition(match_data.score_p1, match_data.score_p2, gm.points_to_win, gm.is_deuce_enabled);

    if let Some(w) = winner_key {
        match_data.status = "finished".to_string();
        match_data.end_time = Some(Utc::now());
        
        // Winner ID defaults to the 'Captain' (P1 or P2) for database tracking of "Winning Side"
        let winner_captain_id = if w == "p1" { match_data.player1_id } else { match_data.player2_id };
        match_data.winner_id = Some(winner_captain_id);

        // Update WINNERS (Captain + Partner)
        sqlx::query("UPDATE users SET wins = wins + 1, matches_played = matches_played + 1 WHERE id = ?")
            .bind(winner_captain_id)
            .execute(&state.db)
            .await.map_err(|e| e.to_string())?;

        let winner_partner_id = if w == "p1" { match_data.player3_id } else { match_data.player4_id };
        if let Some(pid) = winner_partner_id {
             sqlx::query("UPDATE users SET wins = wins + 1, matches_played = matches_played + 1 WHERE id = ?")
                .bind(pid)
                .execute(&state.db)
                .await.map_err(|e| e.to_string())?;
        }

        // Update LOSERS (Captain + Partner)
        let loser_captain_id = if w == "p1" { match_data.player2_id } else { match_data.player1_id };
        sqlx::query("UPDATE users SET matches_played = matches_played + 1 WHERE id = ?")
            .bind(loser_captain_id)
            .execute(&state.db)
            .await.map_err(|e| e.to_string())?;

        let loser_partner_id = if w == "p1" { match_data.player4_id } else { match_data.player3_id };
        if let Some(pid) = loser_partner_id {
             sqlx::query("UPDATE users SET matches_played = matches_played + 1 WHERE id = ?")
                .bind(pid)
                .execute(&state.db)
                .await.map_err(|e| e.to_string())?;
        }
    }

    // 6. Save
    sqlx::query("UPDATE matches SET score_p1=?, score_p2=?, events=?, status=?, end_time=?, winner_id=? WHERE id=?")
        .bind(match_data.score_p1)
        .bind(match_data.score_p2)
        .bind(&match_data.events)
        .bind(&match_data.status)
        .bind(match_data.end_time)
        .bind(match_data.winner_id)
        .bind(match_data.id)
        .execute(&state.db)
        .await
        .map_err(|e| e.to_string())?;

    populate_match(&state.db, match_data).await
}

#[tauri::command]
pub async fn undo_last_point(state: State<'_, AppState>, match_id: i64) -> Result<PopulatedMatch, String> {
    let mut match_data: Match = sqlx::query_as("SELECT * FROM matches WHERE id = ?")
        .bind(match_id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| "Match not found".to_string())?;

    let mut events: Vec<MatchEvent> = serde_json::from_str(&match_data.events).unwrap_or_default();
    if events.is_empty() {
        return Err("No events to undo".to_string());
    }

    let last_event = events.pop().unwrap(); // Remove last

    if last_event.event_type == "point" {
        if let Some(eid_str) = last_event.element_id {
             let eid = eid_str.parse::<i64>().unwrap_or(0);
             if eid == match_data.player1_id {
                 match_data.score_p1 = std::cmp::max(0, match_data.score_p1 - 1);
             } else if eid == match_data.player2_id {
                 match_data.score_p2 = std::cmp::max(0, match_data.score_p2 - 1);
             }
        }
    }

    // Revert finish status
    if match_data.status == "finished" {
         match_data.status = "in_progress".to_string();
         match_data.end_time = None;
         if let Some(wid) = match_data.winner_id {
             // Revert stats
             sqlx::query("UPDATE users SET wins = wins - 1, matches_played = matches_played - 1 WHERE id = ?")
                .bind(wid)
                .execute(&state.db)
                .await
                .map_err(|e| e.to_string())?;

             let loser_id = if wid == match_data.player1_id { match_data.player2_id } else { match_data.player1_id };
             sqlx::query("UPDATE users SET matches_played = matches_played - 1 WHERE id = ?")
                .bind(loser_id)
                .execute(&state.db)
                .await
                .map_err(|e| e.to_string())?;
         }
         match_data.winner_id = None;
    }

    match_data.events = serde_json::to_string(&events).map_err(|e| e.to_string())?;

    sqlx::query("UPDATE matches SET score_p1=?, score_p2=?, events=?, status=?, end_time=?, winner_id=? WHERE id=?")
        .bind(match_data.score_p1)
        .bind(match_data.score_p2)
        .bind(&match_data.events)
        .bind(&match_data.status)
        .bind(match_data.end_time)
        .bind(match_data.winner_id)
        .bind(match_data.id)
        .execute(&state.db)
        .await
        .map_err(|e| e.to_string())?;

    populate_match(&state.db, match_data).await
}

#[tauri::command]
pub async fn get_match(state: State<'_, AppState>, id: i64) -> Result<PopulatedMatch, String> {
   let match_data: Match = sqlx::query_as("SELECT * FROM matches WHERE id = ?")
        .bind(id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| e.to_string())?;

    populate_match(&state.db, match_data).await
}

#[tauri::command]
pub async fn get_user_matches(state: State<'_, AppState>, user_id: i64) -> Result<Vec<PopulatedMatch>, String> {
    let matches: Vec<Match> = sqlx::query_as(
        "SELECT * FROM matches WHERE player1_id = ? OR player2_id = ? OR player3_id = ? OR player4_id = ? ORDER BY start_time DESC"
    )
    .bind(user_id)
    .bind(user_id)
    .bind(user_id)
    .bind(user_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| e.to_string())?;

    let mut populated = Vec::new();
    for m in matches {
        populated.push(populate_match(&state.db, m).await?);
    }
    Ok(populated)
}

#[tauri::command]
pub async fn set_first_server(
    state: State<'_, AppState>,
    id: i64,
    first_server_id: i64,
) -> Result<PopulatedMatch, String> {
    let match_data: Match = sqlx::query_as("SELECT * FROM matches WHERE id = ?")
        .bind(id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| "Match not found".to_string())?;

    let mut match_rules: MatchRules = serde_json::from_str(&match_data.match_rules).unwrap_or(MatchRules {
        serves_in_deuce: 1,
        serve_type: "free".to_string(),
        first_server_id: None,
    });

    match_rules.first_server_id = Some(first_server_id);
    let rules_json = serde_json::to_string(&match_rules).map_err(|e| e.to_string())?;

    sqlx::query("UPDATE matches SET match_rules = ? WHERE id = ?")
        .bind(rules_json)
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|e| e.to_string())?;

    // Refetch to ensure clean state
    let updated_match: Match = sqlx::query_as("SELECT * FROM matches WHERE id = ?")
        .bind(id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| e.to_string())?;

    populate_match(&state.db, updated_match).await
}

#[tauri::command]
pub async fn cancel_match(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    sqlx::query("UPDATE matches SET status = 'abandoned' WHERE id = ?")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}
#[tauri::command]
pub async fn get_user_statistics(state: State<'_, AppState>, user_id: i64) -> Result<UserStatistics, String> {
    // 1. Fetch user to ensure exists
    let _user: User = sqlx::query_as("SELECT * FROM users WHERE id = ?")
        .bind(user_id)
        .fetch_one(&state.db)
        .await
        .map_err(|_| "User not found".to_string())?;

    // 2. Fetch matches (finished only)
    // 2. Fetch matches (finished only)
    let matches: Vec<Match> = sqlx::query_as(
        "SELECT * FROM matches WHERE (player1_id = ? OR player2_id = ? OR player3_id = ? OR player4_id = ?) AND status = 'finished' ORDER BY start_time ASC"
    )
    .bind(user_id)
    .bind(user_id)
    .bind(user_id)
    .bind(user_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| e.to_string())?;
    
    // 3. Helper Maps
    let users: Vec<User> = sqlx::query_as("SELECT * FROM users").fetch_all(&state.db).await.unwrap_or(vec![]);
    let user_map: HashMap<i64, String> = users.into_iter().map(|u| (u.id, u.name)).collect();
    
    let modes: Vec<GameMode> = sqlx::query_as("SELECT * FROM game_modes").fetch_all(&state.db).await.unwrap_or(vec![]);
    let mode_map_name: HashMap<i64, String> = modes.into_iter().map(|m| (m.id, m.name)).collect();

    // 4. Processing
    let mut wins = 0;
    let mut losses = 0;
    let mut current_streak = 0;
    let mut best_streak = 0;
    let mut pts_scored = 0;
    let mut pts_conceded = 0;
    
    // mode_name -> (wins, losses)
    let mut mode_stats_map: HashMap<String, (i64, i64)> = HashMap::new(); 
    // opponent_id -> (wins_against, losses_against)
    let mut opponent_stats_map: HashMap<i64, (i64, i64)> = HashMap::new(); 
    
    let mut recent_matches = Vec::new();
    
    for m in matches {
        let is_p1_side = m.player1_id == user_id || m.player3_id == Some(user_id);
        
        let p_score = if is_p1_side { m.score_p1 } else { m.score_p2 };
        let opp_score = if is_p1_side { m.score_p2 } else { m.score_p1 };
        
        let opponent_id = if is_p1_side { m.player2_id } else { m.player1_id }; // Default to Captain
        let opponent_name = user_map.get(&opponent_id).cloned().unwrap_or("Unknown".to_string());
        
        // Use captain check for winner determination
        let is_win = if is_p1_side { m.winner_id == Some(m.player1_id) } else { m.winner_id == Some(m.player2_id) }; 
        
        let mode_name = mode_map_name.get(&m.game_mode_id).cloned().unwrap_or("Unknown".to_string());
        
        pts_scored += p_score;
        pts_conceded += opp_score;
        
        if is_win {
            wins += 1;
            current_streak += 1;
            if current_streak > best_streak {
                best_streak = current_streak;
            }
            
            let entry = mode_stats_map.entry(mode_name.clone()).or_insert((0, 0));
            entry.0 += 1;
            
            let entry = opponent_stats_map.entry(opponent_id).or_insert((0, 0));
            entry.0 += 1;
        } else {
            losses += 1;
            current_streak = 0;
            
            let entry = mode_stats_map.entry(mode_name.clone()).or_insert((0, 0));
            entry.1 += 1;
            
            let entry = opponent_stats_map.entry(opponent_id).or_insert((0, 0));
            entry.1 += 1;
        }
        
        recent_matches.push(RecentMatch {
            match_id: m.id,
            date: m.start_time.to_rfc3339(),
            opponent_name,
            result: if is_win { "Win".to_string() } else { "Loss".to_string() },
            score_user: p_score,
            score_opponent: opp_score,
            mode_name,
        });
    }
    
    recent_matches.reverse();
    recent_matches.truncate(10);
    
    let nemesis = opponent_stats_map.iter()
        .max_by_key(|(_, stats)| stats.1) // max losses
        .map(|(oid, stats)| OpponentStat {
            opponent_id: *oid,
            opponent_name: user_map.get(oid).cloned().unwrap_or("Unknown".to_string()),
            count: stats.1
        });
        
    let victim = opponent_stats_map.iter()
        .max_by_key(|(_, stats)| stats.0) // max wins
        .map(|(oid, stats)| OpponentStat {
            opponent_id: *oid,
            opponent_name: user_map.get(oid).cloned().unwrap_or("Unknown".to_string()),
            count: stats.0
        });

    let mode_stats: Vec<ModeStat> = mode_stats_map.into_iter().map(|(name, (w, l))| {
        let total = w + l;
        let rate = if total > 0 { w as f64 / total as f64 } else { 0.0 };
        ModeStat {
            mode_name: name,
            wins: w,
            losses: l,
            win_rate: rate,
        }
    }).collect();
    
    let total_played = wins + losses;
    let win_rate = if total_played > 0 { wins as f64 / total_played as f64 } else { 0.0 };

    Ok(UserStatistics {
        user_id,
        wins,
        losses,
        matches_played: total_played,
        win_rate,
        current_streak,
        best_streak,
        points_scored: pts_scored,
        points_conceded: pts_conceded,
        mode_stats,
        recent_matches,
        nemesis,
        victim,
    })
}
