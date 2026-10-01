# Arch Linux + KDE Plasma 运行指南

ClassBoard 在 Arch 上优先**本地编译**（各发行版 webkit 版本不同，Ubuntu 打的包在 Arch 上常缺库）。

## 方式一：本地编译（最稳，推荐）

```bash
sudo pacman -S --needed base-devel rust nodejs npm webkit2gtk-4.1 gtk3 \
  libappindicator-gtk3 librsvg fuse2 konsole
git clone https://github.com/FurryAoao/ClassBoard.git
cd ClassBoard/packaging/arch
makepkg -si
classboard
```

`fuse2` 是给 AppImage 用的，`makepkg` 本地编译其实用不到，但装上没坏处。

## 方式二：用 Actions 产物里的 .deb / AppImage

- `.deb` 在 Arch 上**不要直接装**（那是给 Debian 系的），转一下：
  ```bash
  yay -S debtap && sudo debtap -u
  debtap classboard_*.deb && sudo pacman -U *.pkg.tar.zst
  ```
- `AppImage`：`chmod +x *.AppImage` 后直接跑，缺库会报 `error while loading shared libraries`，按名字 `pacman -S` 装即可。

## 常见报错

### 「执行子进程 xterm 失败（没有那个文件或目录）」

这是 Plasma 的启动器在用**终端方式**起程序，但系统里没装 `xterm`。
ClassBoard 是 GUI 程序，不需要终端，两步解决：

1. 装个终端兜底（任选其一）：
   ```bash
   sudo pacman -S konsole   # Plasma 原生，最配
   # 或 sudo pacman -S xterm
   ```
2. 检查启动它的 `.desktop` 文件里必须是 `Terminal=false`
   （仓库 `packaging/arch/classboard.desktop` 已是 `false`；
   若你是从别处拷的启动器，把 `Terminal=true` 改成 `false` 即可）

改完刷新一下：`kbuildsycoca6`，再从启动器打开。

### 窗口不在右下角 / 位置记不住

Wayland 下客户端自己定不了位置（KWin 说了算），这是有意为之。
首次手动拖到右下角，然后：系统设置 → 窗口管理 → 窗口规则 → 新建 →
窗口类填 `classboard` → 初始位置 → 右下 → 记住。

### Alt+Space 没反应

Plasma 默认把 `Alt+Space` 占了（KWin 窗口菜单）。
系统设置 → 快捷键 → KWin → 把“激活窗口菜单”换个键，
再在 ClassBoard 里用 `Alt+Space` 唤起；v0.3 起也可用备用键 `Ctrl+\``（反引号），无需改 KWin 配置。
