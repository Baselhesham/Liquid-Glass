<div align="center">

# 🫧 Liquid Glass

**A frosted liquid-glass theme for Discord that follows the album art of whatever you're playing on Spotify.**

<!-- Put a screenshot or GIF of your Discord here: save it as assets/preview.png (or .gif) -->
![Liquid Glass preview](assets/preview.png)

</div>

---

## ✨ Features

**Liquid Glass theme**
- Floating, frosted glass panels with heavy blur and soft glowing edges
- Smooth hover animations: server icons zoom, channels glide, reactions pop
- Glass menus, popouts, settings and search
- Clean spacing, built on the [Midnight](https://github.com/refact0r/midnight-discord) layout

**AlbumGlass plugin** (optional, makes the theme react to your music)
- 🎨 **Fluid album background:** your album cover turns into a slowly warping, blurred background (the Apple Music effect), powered by [Kawarp](https://github.com/better-lyrics/kawarp)
- 🌈 **Full recolor:** panels, glass tint, text, borders and accents all change to match the album
- 🔆 **Auto-brighten:** dark covers still give a colorful background
- 💓 **Beat pulse:** the background breathes slightly while music plays
- 📊 **Side visualizer:** optional, off by default
- ⚙️ **Fully customizable:** glass amount, blur, warp, speed, darkness, quality and more

---

## 📦 Install

> **Windows only.** You need [Discord](https://discord.com/download) (desktop app) and a Spotify account connected to Discord.

### Option A: Theme only (easy, 1 minute)

Works with **Vencord** or **BetterDiscord**. No music syncing.

1. Download [`theme/LiquidGlass.theme.css`](theme/LiquidGlass.theme.css)
2. In Discord: **Settings → Themes → Open Themes Folder**
3. Drop the file in, then turn **Liquid Glass** on
4. Turn off any other theme you had enabled

### Option B: Theme + AlbumGlass plugin (full experience, about 15 minutes, one time)

Custom Vencord plugins only work in a version of Vencord you build yourself. `INSTALL.bat` does all of that for you.

1. Install **[Git](https://git-scm.com)** (click Next on every screen)
2. Install **[Node.js LTS](https://nodejs.org)** (leave *"Tools for Native Modules"* **unchecked**)
3. **Restart your PC**
4. Download this repo: green **Code** button → **Download ZIP**, then right-click it → **Extract All**
5. Double-click **`INSTALL.bat`**
   *If Windows shows a blue warning: **More info → Run anyway***
6. When a menu appears, pick your Discord and press **Enter**
7. Open Discord:
   - **Settings → Themes** → turn on **Liquid Glass** (and turn off other themes)
   - **Settings → Plugins** → turn on **AlbumGlass**
8. Play a song on Spotify 🎵

**Make sure Discord can see your music:**
- **Settings → Connections → Spotify** → turn on *"Display Spotify as your status"*
- **Settings → Activity Privacy** → turn on *"Share my activity"*
- Don't use **Invisible** status, because it hides your activity

---

## 🔄 Updating

Download the newest version of this repo, extract it, and double-click **`UPDATE.bat`**. It copies the new files, rebuilds, and restarts Discord.

---

## ⚙️ Customize

**Plugin settings:** Settings → Plugins → AlbumGlass → ⚙️

| Setting | What it does |
|---|---|
| Recolour the whole theme | Panels, text, borders and accents follow the album |
| Glass see-through amount | Higher means more of the moving background shows through |
| Frosted blur | Blur strength on panels |
| Warp strength | How much the background swirls |
| Motion speed | How fast it moves |
| Colour boost | Background saturation |
| Darken background | Raise it if text is hard to read on bright albums |
| Quality | Use **Low** if your PC or laptop gets loud or slow |
| Brighten dark covers | Keeps dark albums colorful |
| Beat pulse | Background breathes on the beat |
| Side visualizer | Bars on the window edges (side, layer, width, BPM, intensity) |

**Theme settings:** open `LiquidGlass.theme.css` in Notepad. The top section has variables for spacing (`--gap`), blur (`--blur-amount`), wallpaper (`--background-image-url`) and animation speed (`--lg-smooth-speed`).

---

## 🛠️ Troubleshooting

| Problem | Fix |
|---|---|
| Installer says it can't reach GitHub | Your internet provider may block GitHub from the command line. Turn on a VPN (e.g. Cloudflare 1.1.1.1 / WARP) and run it again |
| "Could not download the Vencord installer" | Download [VencordInstallerCli.exe](https://github.com/Vencord/Installer/releases/latest/download/VencordInstallerCli.exe) in your browser, put it next to `INSTALL.bat`, and run it again |
| Theme doesn't change | Turn off every other theme in Settings → Themes |
| Background doesn't follow the music | Check that your profile says **Listening to Spotify** (see the steps under Install) |
| Laptop fans get loud | AlbumGlass settings → Quality → **Low** |

---

## ❓ Is this safe?

Everything here is plain text you can read: a CSS file, a TypeScript plugin, and two `.bat` scripts. The installer only downloads Vencord from its [official GitHub](https://github.com/Vendicated/Vencord) and the official [Vencord installer](https://github.com/Vencord/Installer).

> ⚠️ Client mods like Vencord are against Discord's Terms of Service. Lots of people use them, but use them at your own risk.

---

## 💜 Credits

- **[Midnight](https://github.com/refact0r/midnight-discord)** by refact0r: layout & spacing (MIT)
- **[Kawarp](https://github.com/better-lyrics/kawarp)** by Better Lyrics: fluid album background renderer (MIT, license in `plugin/albumGlass/KAWARP-LICENSE.txt`)
- **[Liquify](https://github.com/NMWplays/Liquify)** by NMWplays: the Spotify theme that inspired the look
- **[Vencord](https://github.com/Vendicated/Vencord)**: the client mod this plugin runs on

## 📄 License

[GPL-3.0](LICENSE), the same license as Vencord, which this plugin is built for. Bundled third-party code keeps its own license (see Credits).

Made by **[Baselhesham](https://github.com/Baselhesham)**
