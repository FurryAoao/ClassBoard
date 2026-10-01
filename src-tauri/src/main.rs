#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{LogicalPosition, LogicalSize, Manager, Position};

/// Wayland 下合成器不允许客户端随意定位窗口（set_position 经常被忽略），
/// 所以定位只是“尽力而为”的提示：X11 / Windows / macOS 上精确吸附右下角；
/// Wayland 上窗口出现在哪由 KWin 决定，用户首次拖一次即可，位置会被记住。
fn dock_bottom_right(window: &tauri::WebviewWindow, width: f64, height: f64) {
    // Wayland：跳过程序定位，避免与 KWin 规则打架
    #[cfg(target_os = "linux")]
    if std::env::var("WAYLAND_DISPLAY").is_ok() {
        return;
    }
    if let Ok(Some(monitor)) = window.primary_monitor() {
        let msize = monitor.size();
        let scale = monitor.scale_factor();
        let margin = 16.0;
        let x = (msize.width as f64 / scale) - width - margin;
        let y = (msize.height as f64 / scale) - height - margin;
        let _ = window.set_position(LogicalPosition::new(x, y));
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // 单实例：重复启动时唤出已有窗口，不开第二个胶囊
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.show();
                let _ = win.set_focus();
            }
        }))
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(|app| {
            if let Some(win) = app.get_webview_window("main") {
                // 轻量常驻：置顶、不抢焦点（focus:false）、不进任务栏（配置里 skipTaskbar）
                // 注意：不要 set_focusable(false)，否则输入框无法打字；
                // “不抢焦点”靠 tauri.conf.json 的 "focus": false 实现。
                let _ = win.set_always_on_top(true);
                dock_bottom_right(&win, 232.0, 56.0);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![dock_window, set_window_size, restore_position])
        .run(tauri::generate_context!())
        .expect("ClassBoard 启动失败");
}

/// 前端调用：重新吸附右下角（按当前窗口逻辑尺寸）
#[tauri::command]
fn dock_window(window: tauri::WebviewWindow, width: f64, height: f64) {
    dock_bottom_right(&window, width, height);
}

/// 前端调用：启动时恢复用户上次拖放的位置（逻辑像素）。
/// Wayland 下合成器忽略客户端定位，调用无副作用（仍由 KWin 决定）。
#[tauri::command]
fn restore_position(window: tauri::WebviewWindow, x: f64, y: f64) {
    #[cfg(target_os = "linux")]
    if std::env::var("WAYLAND_DISPLAY").is_ok() {
        return;
    }
    let _ = window.set_position(Position::Logical(LogicalPosition::new(x, y)));
}

/// 前端调用：展开/收起时同步窗口尺寸（单窗口内视图切换，不开新窗口）
/// 用逻辑尺寸，Tauri 按系统缩放自动换算，三平台一致。
/// 缩放时保持窗口右下角锚定：用户拖过的位置不会被拽回右下角，
/// 而是右下角不动、向上/左生长，收起时反向收缩。
/// Wayland 下 set_position 会被合成器忽略，调用无副作用。
#[tauri::command]
fn set_window_size(window: tauri::WebviewWindow, width: f64, height: f64) {
    let prev_pos = window.outer_position().ok();
    let prev_size = window.outer_size().ok();
    let _ = window.set_size(LogicalSize::new(width, height));
    if let (Some(p), Some(s)) = (prev_pos, prev_size) {
        if let Ok(scale) = window.scale_factor() {
            let sc = scale.max(1.0);
            let dx = (s.width as f64 / sc) - width;
            let dy = (s.height as f64 / sc) - height;
            if dx.abs() > 0.5 || dy.abs() > 0.5 {
                let nx = p.x as f64 / sc + dx;
                let ny = p.y as f64 / sc + dy;
                let _ = window.set_position(Position::Logical(LogicalPosition::new(nx, ny)));
            }
            return;
        }
    }
    dock_bottom_right(&window, width, height);
}
