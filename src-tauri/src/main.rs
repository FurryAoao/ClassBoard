#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{LogicalPosition, LogicalSize, Manager};

/// 右下角定位：主屏尺寸 - 窗口尺寸 - 边距（逻辑像素，Tauri 自动换算物理像素）
fn dock_bottom_right(window: &tauri::WebviewWindow, width: f64, height: f64) {
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
