#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;
use std::thread;

use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::webview::PageLoadEvent;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

const DEV_PORT: u16 = 4321;
const IS_DEV: bool = cfg!(debug_assertions);

struct AppState {
    zoom: Mutex<f64>,
}

// ── Helpers ───────────────────────────────────────

fn dev_url() -> String {
    format!("http://localhost:{DEV_PORT}/")
}

// ── Refresh / Zoom ───────────────────────────────

fn do_refresh(app_handle: &AppHandle) {
    if let Some(w) = app_handle.get_webview_window("main") {
        if IS_DEV {
            let _ = w.navigate(
                dev_url()
                    .parse()
                    .expect("BUG: dev_url produced an invalid URL"),
            );
        } else {
            let _ = w.eval("window.location.reload()");
        }
    }
}

fn apply_zoom(app_handle: &AppHandle, level: f64) {
    let state = app_handle.state::<AppState>();
    *state.zoom.lock().unwrap() = level;
    if let Some(w) = app_handle.get_webview_window("main") {
        let _ = w.eval(&format!("document.body.style.zoom = '{level}'"));
    }
}

// ── Main ──────────────────────────────────────────

fn main() {
    let app_state = AppState {
        zoom: Mutex::new(1.0),
    };

    tauri::Builder::default()
        .manage(app_state)
        .setup(move |app| {
            // ── Menu ──
            let app_menu = SubmenuBuilder::new(app, "ZudoDoc")
                .about(None)
                .separator()
                .quit()
                .build()?;

            let edit_menu = SubmenuBuilder::new(app, "Edit")
                .undo()
                .redo()
                .separator()
                .cut()
                .copy()
                .paste()
                .select_all()
                .build()?;

            let view_menu = SubmenuBuilder::new(app, "View")
                .item(
                    &MenuItemBuilder::with_id("refresh", "Refresh")
                        .accelerator("CmdOrCtrl+R")
                        .build(app)?,
                )
                .item(
                    &MenuItemBuilder::with_id("devtools", "Toggle Developer Tools")
                        .accelerator("CmdOrCtrl+Alt+I")
                        .build(app)?,
                )
                .separator()
                .item(
                    &MenuItemBuilder::with_id("actual_size", "Actual Size")
                        .accelerator("CmdOrCtrl+0")
                        .build(app)?,
                )
                .item(
                    &MenuItemBuilder::with_id("zoom_in", "Zoom In")
                        .accelerator("CmdOrCtrl+=")
                        .build(app)?,
                )
                .item(
                    &MenuItemBuilder::with_id("zoom_out", "Zoom Out")
                        .accelerator("CmdOrCtrl+-")
                        .build(app)?,
                )
                .build()?;

            let menu = MenuBuilder::new(app)
                .item(&app_menu)
                .item(&edit_menu)
                .item(&view_menu)
                .build()?;

            app.set_menu(menu)?;

            app.on_menu_event(|app_handle, event| match event.id().as_ref() {
                "refresh" => {
                    let handle = app_handle.clone();
                    thread::spawn(move || do_refresh(&handle));
                }
                "devtools" => {
                    if let Some(w) = app_handle.get_webview_window("main") {
                        if w.is_devtools_open() {
                            w.close_devtools();
                        } else {
                            w.open_devtools();
                        }
                    }
                }
                "actual_size" => apply_zoom(app_handle, 1.0),
                "zoom_in" => {
                    let state = app_handle.state::<AppState>();
                    let z = (*state.zoom.lock().unwrap() + 0.1).min(3.0);
                    apply_zoom(app_handle, z);
                }
                "zoom_out" => {
                    let state = app_handle.state::<AppState>();
                    let z = (*state.zoom.lock().unwrap() - 0.1).max(0.1);
                    apply_zoom(app_handle, z);
                }
                _ => {}
            });

            // ── Window ──
            // Dev: connect to Astro dev server via devUrl
            // Production: Tauri serves embedded dist/ files via frontendDist
            let initial_url = if IS_DEV {
                WebviewUrl::External(
                    dev_url()
                        .parse()
                        .expect("BUG: dev_url produced an invalid URL"),
                )
            } else {
                WebviewUrl::default()
            };

            let window =
                WebviewWindowBuilder::new(app, "main", initial_url)
                    .title("ZudoDoc")
                    .inner_size(1200.0, 800.0)
                    .visible(false)
                    .on_navigation(|url| {
                        let s = url.as_str();
                        // Allow internal schemes and the local dev / bundled app origins.
                        // - http://localhost, https://localhost          : Astro dev server
                        // - tauri://                                     : bundled app (macOS/Linux)
                        // - http://tauri.localhost, https://tauri.localhost
                        //                                                : bundled app (Windows)
                        // - asset://                                     : Tauri asset protocol
                        // - data:                                        : inline data URLs
                        if s.starts_with("http://localhost")
                            || s.starts_with("https://localhost")
                            || s.starts_with("http://tauri.localhost")
                            || s.starts_with("https://tauri.localhost")
                            || s.starts_with("tauri://")
                            || s.starts_with("asset://")
                            || s.starts_with("data:")
                        {
                            return true;
                        }
                        // External http/https links -> default OS browser.
                        if s.starts_with("http://") || s.starts_with("https://") {
                            let owned = s.to_string();
                            tauri::async_runtime::spawn_blocking(move || {
                                let _ = open::that(owned);
                            });
                            return false;
                        }
                        // mailto: -> default mail client.
                        if s.starts_with("mailto:") {
                            let owned = s.to_string();
                            tauri::async_runtime::spawn_blocking(move || {
                                let _ = open::that(owned);
                            });
                            return false;
                        }
                        // Block any other scheme (javascript:, file:, etc.).
                        false
                    })
                    .build()?;

            // Show window after page loads to avoid white flash
            let win = window.clone();
            window.on_window_event(move |event| {
                if let tauri::WindowEvent::Focused(true) = event {
                    if !win.is_visible().unwrap_or(false) {
                        let _ = win.show();
                    }
                }
            });

            // Fallback: show after a short delay if focus event doesn't fire
            let win = window.clone();
            thread::spawn(move || {
                thread::sleep(std::time::Duration::from_millis(500));
                let _ = win.show();
            });

            Ok(())
        })
        .on_page_load(|webview, payload| {
            if webview.label() == "main"
                && matches!(payload.event(), PageLoadEvent::Finished)
            {
                let _ = webview.window().show();
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let tauri::RunEvent::WindowEvent {
                event: tauri::WindowEvent::Destroyed,
                ..
            } = &event
            {
                app_handle.exit(0);
            }
        });
}
