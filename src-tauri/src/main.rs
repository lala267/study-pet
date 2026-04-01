#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database;

use tauri::{Manager, PhysicalPosition};

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            database::save_study_session,
            database::get_today_total_seconds
        ])
        .setup(|app| {
            let database_state = database::init_database(app.handle())
                .map_err(std::io::Error::other)?;
            app.manage(database_state);

            let window = app
                .get_webview_window("main")
                .expect("main window should exist");

            if let Some(monitor) = window.current_monitor()? {
                const WINDOW_MARGIN: i32 = 20;
                let size = window.outer_size()?;
                let work_area = monitor.work_area();
                let min_x = work_area.position.x + WINDOW_MARGIN;
                let min_y = work_area.position.y + WINDOW_MARGIN;
                let max_x = work_area.position.x + work_area.size.width as i32 - size.width as i32 - WINDOW_MARGIN;
                let max_y = work_area.position.y + work_area.size.height as i32 - size.height as i32 - WINDOW_MARGIN;
                let x = max_x.max(min_x);
                let y = max_y.max(min_y);
                window.set_position(PhysicalPosition::new(x, y))?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
