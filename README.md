# ClassBoard 师者屏隅轻辅

> 悬停即启，一窗百用，默认唯时，诸能可择。—— **单悬停窗口**，所有功能在同一窗口内卡片/标签/视图切换，不开新窗口

## 核心规则（已落实）

- 单悬停窗口：`src-tauri/tauri.conf.json` 只声明 `main` 一个窗口，无其他 `WebviewWindow`/`open` 新窗代码
- 首次启动默认只开时钟：`src/store/useSettings.ts` 的 `DEFAULTS` 仅 `clock: true`，其余 14 项全 `false`
- 设置在同一窗口内：标题栏设置钮 → `SettingsView` 同窗切换
- 关闭功能后：隐藏入口（标签栏 `visible = enabled` 过滤）＋ 停止后台任务（组件卸载清 `setInterval`）＋ 保留数据（SQLite `kv` + localStorage 双存）
- 开启后出现在同一悬停窗口内：`openFeature()` 同窗 `view=feature` 切换
- 收起为右下角小胶囊（232×56 显示时间）；悬停展开 368×560；移出收起； 可固定；标题栏可拖拽；`Alt+Space` / `Ctrl+\`` 唤起、`Esc` 收起（KDE 占 Alt+Space 时用备用键）
- 深浅色跟随系统（`prefers-color-scheme` + Tailwind `darkMode: media`）、圆角 3xl、毛玻璃 `.glass`、pop/slide 动画、不抢焦点（`focus:false` + `alwaysOnTop` + `skipTaskbar`）、不打扰
- 本地优先：`tauri-plugin-sql` (`sqlite:classboard.db` 表 `kv`) + localStorage 兜底；设置页可导出/导入全量 JSON，不登录不联网

## 15 个可开关功能（`src/features/`）

| 功能 | 文件 | 说明 |
|---|---|---|
| 时钟（默认开） | `ClockCard.tsx` | 时:分:秒 + 日期星期 |
| 教学白板/投屏状态 | `BoardCard.tsx` | 画布速写 + 投屏标记 + 备注 |
| 快捷方式 | `ShortcutsCard.tsx` | 文件/文件夹/网址，opener 打开 |
| 课程表 | `ScheduleCard.tsx` | 周课表 + 当前课程高亮 |
| 日历 | `CalendarCard.tsx` | 月视图 + 每日日程 |
| 计时器 | `TimerCard.tsx` | 正/倒计时，卸载清 timer |
| 随机点名/分组 | `PickerCard.tsx` | 名单持久化 + 滚动抽取 |
| 待办 | `TodosCard.tsx` | 清单 + 回车快加 |
| 全局搜索 | `SearchCard.tsx` | 搜功能名 + 本地 kv 数据 |
| 专注模式 | `FocusCard.tsx` | 免打扰 + 专注计时 |
| 截图/录屏 | `CaptureCard.tsx` | 各平台原生能力入口（轻量不内置引擎） |
| 剪贴板历史 | `ClipboardCard.tsx` | 手动收藏 ≤30 条（轻量不常驻监听） |
| 天气/小部件 | `WeatherCard.tsx` | 手动记录 + 备忘，不强制联网 |
| 多屏/投屏控制 | `DisplayCard.tsx` | 镜像/扩展/停止 + 显示器检测 |
| 插件扩展 | `PluginsCard.tsx` | 自定义文本小部件 |

## 运行

```bash
npm install
npm run dev          # 浏览器预览悬停交互（Tauri API 自动降级）
npm run tauri        # 桌面端：右下角胶囊，悬停展开
npm run build        # 前端构建 → dist/
npm run tauri:build  # 三平台打包（Windows .exe / Linux .AppImage/.deb / macOS .dmg）
```

> 本机无 Rust 时 `npm run build` 已验证通过（tsc + vite）；`tauri:build` 需在各平台装 Rust 稳定版后执行。
> 三端构建由 GitHub Actions 自动跑（`build.yml`），每推必建，产物在 Actions 页下载。

## 版本演进

| 版本 | 主题 | 内容 |
|---|---|---|
| v0.2 | 课堂闭环 | 单实例（重复启动唤出已有窗口）+ 开机自启（设置页开关）；搜索/备份跳过白板大图 |
| v0.3 | 上课流 | `useLesson` 共享课堂会话；课表一键开课跳点名；点名考勤打标 + 导出 CSV；计时/专注/胶囊联动；备用唤起键 `Ctrl+\`` |
| v0.4 | 下课流 | 下课小结（一句话记入待办/小部件，自动跳转）；下一节课间倒计时 |
| v0.5 | 稳字当头 | 窗口位置记忆（拖后记住，启动恢复）；缩放右下角锚定；备份版本兼容（`app/version/exportedAt`） |
| v0.6 | 打磨 | 搜索跳过内部键；文档去符号化 + 补全版本记录 |
| v0.7 | 周览·秒开 | 课表周一到周日分组（今天高亮）；15 张功能卡懒加载，首屏秒出 |

## 课堂使用流

开课：课表点“一键开课”→ 自动跳点名 → 点到谁记谁（到/缺/假）→ 计时器按环节走（导入/讲授/练习/展示/总结）→ 时间到一键下课回课表 → 写一句话小结 → 记入待办/小部件。
课间：课表显示下一节课间倒计时。考勤：点名卡“导出考勤 CSV”（Excel 直接认中文）。

## 验收对照

1. 三平台可运行：Tauri 2 + `bundle.targets=all`，图标 `src-tauri/icons/` 已生成；Wayland 定位交由 KWin（见 main.rs 注释）。
2. 单悬停窗口默认只有时钟：窗口唯一；`DEFAULTS` 仅时钟开；收起胶囊只显示时间。
3. 设置开关 → 同窗出现：`SettingsView` 开关 → `ExpandedPanel` 标签栏即时增减 → 内容区同窗切换。
4. 深浅色/圆角/动画/悬停正常：`index.css` glass + media 深色 + keyframes；`App.tsx` mouseEnter/Leave + pinned 逻辑。
5. 关闭不加载不显示不运行：`renderFeature` 对 `enabled` 守卫 + 条件挂载；`useNow`/计时器 `useEffect` 卸载清理；数据走 `kvGet/kvSet` 保留。
