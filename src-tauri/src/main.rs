#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

use tauri::{utils::config::AppUrl, WindowUrl};

// Create the command:
// This command must be async so that it doesn't run on the main thread.
#[tauri::command]
async fn close_splashscreen(window: tauri::Window) {
    // Close splashscreen
    if let Some(splashscreen) = window.get_window("splashscreen") {
        splashscreen.close().unwrap();
    }
    // Show main window
    window.get_window("main").unwrap().show().unwrap();
}

// Tauri by default uses HTTPS, so use the localhost plugin to downgrade back to
// HTTP. However, when running tauri dev, we already have a localhost server
// provided by vite, so don't enable it
#[cfg(debug_assertions)]
const USE_LOCALHOST_SERVER: bool = false;
#[cfg(not(debug_assertions))]
const USE_LOCALHOST_SERVER: bool = true;

fn main() {
    let port = portpicker::pick_unused_port().expect("failed to find unused port");

    let window_url = if USE_LOCALHOST_SERVER {
        WindowUrl::External(format!("http://localhost:{}", port).parse().unwrap())
    } else {
        WindowUrl::App("index.html".into())
    };

    let mut context = tauri::generate_context!();
    let mut builder = tauri::Builder::default();

    if USE_LOCALHOST_SERVER {
        // rewrite the config so the IPC is enabled on this URL
        context.config_mut().build.dist_dir = AppUrl::Url(window_url.clone());
        context.config_mut().build.dev_path = AppUrl::Url(window_url.clone());
        builder = builder.plugin(tauri_plugin_localhost::Builder::new(port).build());
    }


    builder
        .invoke_handler(tauri::generate_handler![close_splashscreen])
        .plugin(tauri_plugin_store::Builder::default().build())
        .run(context)
        .expect("error while running tauri application");
    // tauri::Builder::default()
    //     .run(tauri::generate_context!())
    //     .expect("error while running tauri application");
}
