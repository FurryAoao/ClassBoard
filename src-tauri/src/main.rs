#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{LogicalPosition, LogicalSize, Manager};

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
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            if let Some(win) = app.get_webview_window("main") {
                // 轻量常驻：置顶、不抢焦点（focus:false）、不进任务栏（配置里 skipTaskbar）
                // 注意：不要 set_focusable(false)，否则输入框无法打字；
                // “不抢焦点”靠 tauri.conf.json 的 "focus": false 实现。
                let _ = win.set_always_on_top(true);
                dock_bottom_right(&win, 208.0, 56.0);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![dock_window, set_window_size])
        .run(tauri::generate_context!())
        .expect("ClassBoard 启动失败");
}

/// 前端调用：重新吸附右下角（按当前窗口逻辑尺寸）
#[tauri::command]
fn dock_window(window: tauri::WebviewWindow, width: f64, height: f64) {
    dock_bottom_right(&window, width, height);
}

/// 前端调用：展开/收起时同步窗口尺寸（单窗口内视图切换，不开新窗口）
/// 用逻辑尺寸，Tauri 按系统缩放自动换算，三平台一致。
#[tauri::command]
fn set_window_size(window: tauri::WebviewWindow, width: f64, height: f64) {
    let _ = window.set_size(LogicalSize::new(width, height));
    dock_bottom_right(&window, width, height);
}
