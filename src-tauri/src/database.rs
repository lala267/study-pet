use std::{
    fs,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};

use rusqlite::{params, Connection};
use serde::Deserialize;
use tauri::{AppHandle, Manager, State};

pub struct DatabaseState {
    db_path: PathBuf,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveStudySessionPayload {
    pub start_time: String,
    pub end_time: String,
    pub duration_seconds: i64,
    pub status: String,
    pub mode: String,
    pub date_key: String,
}

pub fn init_database(app: &AppHandle) -> Result<DatabaseState, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("failed to resolve app data dir: {error}"))?;

    fs::create_dir_all(&app_data_dir)
        .map_err(|error| format!("failed to create app data dir: {error}"))?;

    let db_path = app_data_dir.join("study_sessions.sqlite3");
    initialize_schema(&db_path)?;

    Ok(DatabaseState { db_path })
}

fn initialize_schema(db_path: &Path) -> Result<(), String> {
    let conn = Connection::open(db_path)
        .map_err(|error| format!("failed to open sqlite database: {error}"))?;

    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS study_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            duration_seconds INTEGER NOT NULL,
            status TEXT NOT NULL,
            mode TEXT NOT NULL,
            date_key TEXT NOT NULL,
            created_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_study_sessions_date_key
        ON study_sessions(date_key);
        "#,
    )
    .map_err(|error| format!("failed to initialize study_sessions table: {error}"))?;

    Ok(())
}

fn open_connection(state: &DatabaseState) -> Result<Connection, String> {
    Connection::open(&state.db_path)
        .map_err(|error| format!("failed to open sqlite database: {error}"))
}

#[tauri::command]
pub fn save_study_session(
    payload: SaveStudySessionPayload,
    state: State<'_, DatabaseState>,
) -> Result<(), String> {
    let conn = open_connection(&state)?;
    let created_at = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| format!("failed to read current time: {error}"))?
        .as_secs() as i64;

    conn.execute(
        r#"
        INSERT INTO study_sessions (
            start_time,
            end_time,
            duration_seconds,
            status,
            mode,
            date_key,
            created_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
        "#,
        params![
            payload.start_time,
            payload.end_time,
            payload.duration_seconds,
            payload.status,
            payload.mode,
            payload.date_key,
            created_at
        ],
    )
    .map_err(|error| format!("failed to insert study session: {error}"))?;

    Ok(())
}

#[tauri::command]
pub fn get_today_total_seconds(
    date_key: String,
    state: State<'_, DatabaseState>,
) -> Result<i64, String> {
    let conn = open_connection(&state)?;

    conn.query_row(
        "SELECT COALESCE(SUM(duration_seconds), 0) FROM study_sessions WHERE date_key = ?1",
        params![date_key],
        |row| row.get(0),
    )
    .map_err(|error| format!("failed to query today total seconds: {error}"))
}
