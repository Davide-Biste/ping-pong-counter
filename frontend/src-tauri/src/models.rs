use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};

// --- User ---
#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
#[serde(rename_all = "camelCase")]
pub struct User {
    #[serde(rename = "_id")]
    pub id: i64,
    pub name: String,
    pub fun_nickname: Option<String>,
    pub avatar: Option<String>,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub wins: i64,
    pub matches_played: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateUserDto {
    pub name: String,
    pub fun_nickname: Option<String>,
    pub avatar: Option<String>,
    pub color: String,
    pub icon: String,
}

// --- GameMode ---
#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GameMode {
    #[serde(rename = "_id")]
    pub id: i64,
    pub name: String,
    pub points_to_win: i64,
    pub serves_before_change: i64,
    pub rules_description: Option<String>,
    pub is_deuce_enabled: bool,
    pub serves_in_deuce: i64,
    pub serve_type: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateGameModeDto {
    pub name: String,
    pub points_to_win: i64,
    pub serves_before_change: i64,
    pub rules_description: Option<String>,
    pub is_deuce_enabled: bool,
    pub serves_in_deuce: i64,
    pub serve_type: String,
}

// --- Match ---
#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Match {
    #[serde(rename = "_id")]
    pub id: i64,
    pub player1_id: i64,
    pub player2_id: i64,
    pub player3_id: Option<i64>, // Doubles partner for P1
    pub player4_id: Option<i64>, // Doubles partner for P2
    pub game_mode_id: i64,
    pub status: String, // 'in_progress', 'finished', 'abandoned'
    pub score_p1: i64,
    pub score_p2: i64,
    pub events: String, // JSON String
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub winner_id: Option<i64>,
    pub match_rules: String, // JSON String
}

// Structs for JSON fields parsing
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MatchEvent {
    #[serde(rename = "type")]
    pub event_type: String, // 'point', 'undo'
    pub element_id: Option<String>,
    pub timestamp: i64,
    pub score_snapshot: ScoreSnapshot,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScoreSnapshot {
    pub p1: i64,
    pub p2: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MatchRules {
    pub serves_in_deuce: i64,
    pub serve_type: String,
    pub first_server_id: Option<i64>,
}

// Populated Response structs (to mimic Mongoose populate)
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PopulatedMatch {
    #[serde(rename = "_id")]
    pub id: i64,
    pub player1: User,
    pub player2: User,
    pub player3: Option<User>,
    pub player4: Option<User>,
    pub game_mode: GameMode,
    pub status: String,
    pub score: ScoreSnapshot,
    pub events: Vec<MatchEvent>,
    pub match_rules: MatchRules,
    pub winner: Option<User>,
    pub first_server: Option<i64>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserStatistics {
    pub user_id: i64,
    pub wins: i64,
    pub losses: i64,
    pub matches_played: i64,
    pub win_rate: f64,
    pub current_streak: i64,
    pub best_streak: i64,
    pub points_scored: i64,
    pub points_conceded: i64,
    pub mode_stats: Vec<ModeStat>,
    pub recent_matches: Vec<RecentMatch>,
    pub nemesis: Option<OpponentStat>,
    pub victim: Option<OpponentStat>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModeStat {
    pub mode_name: String,
    pub wins: i64,
    pub losses: i64,
    pub win_rate: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OpponentStat {
    pub opponent_id: i64,
    pub opponent_name: String,
    pub count: i64, 
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecentMatch {
    pub match_id: i64,
    pub date: String,
    pub opponent_name: String,
    pub result: String, // 'Win' or 'Loss'
    pub score_user: i64,
    pub score_opponent: i64,
    pub mode_name: String,
}

