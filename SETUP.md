# 🕹 Retro Vault — Setup Guide

## Folder Structure (on your hosting laptop)

```
retro-vault/
├── server.js           ← backend server
├── package.json
├── public/
│   └── index.html      ← the entire frontend UI
└── roms/               ← PUT YOUR ROMS HERE
    ├── gba/            → .gba files (Game Boy Advance)
    ├── gbc/            → .gbc files (Game Boy Color)
    ├── gb/             → .gb files  (Game Boy)
    ├── nds/            → .nds files (Nintendo DS)
    ├── snes/           → .sfc .snes files (Super Nintendo)
    ├── n64/            → .n64 .z64 files (Nintendo 64)
    └── psx/            → .bin .iso .pbp files (PlayStation 1)
```

---

## Step 1 — Install Node.js

Download from: https://nodejs.org  
Choose the LTS version. Just run the installer.

---

## Step 2 — Install dependencies

Open Terminal / Command Prompt in the `retro-vault` folder:

```bash
npm install
```

---

## Step 3 — Add your ROMs

Drop ROM files into the matching subfolder:
- `roms/gba/Pokemon Fire Red.gba`
- `roms/nds/Pokemon Black.nds`
- etc.

The server auto-detects them — no config needed.

---

## Step 4 — Start the server

```bash
npm start
```

You'll see something like:
```
🎮 Retro Vault running at http://localhost:3000
  GBA  → roms/gba/  (3 games)
  NDS  → roms/nds/  (5 games)
```

Open http://localhost:3000 to test locally first.

---

## Step 5 — Expose to the Internet (Cloudflare Tunnel)

This is FREE and doesn't require port forwarding or a static IP.

### Install cloudflared

**Windows:** Download from https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
Add it to your PATH, or run from the folder it's in.

**Mac:**
```bash
brew install cloudflare/cloudflare/cloudflared
```

**Linux:**
```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb
```

### Run the tunnel

In a **separate terminal** (keep server.js running in the first one):

```bash
cloudflared tunnel --url http://localhost:3000
```

You'll get a URL like:
```
https://retro-vault-abc123.trycloudflare.com
```

**Share this URL** with anyone — works from any device, anywhere in the world.

> The URL changes each time you restart cloudflared.
> For a permanent URL, sign up for a free Cloudflare account and create a named tunnel.

---

## Controls Reference

### PC / Desktop
- **Arrow keys** — D-Pad
- **Z** — B button
- **X** — A button
- **A** — Y button
- **S** — X button
- **Q** — L shoulder
- **E** — R shoulder
- **Enter** — Start
- **Shift** — Select

### Mobile / Tablet
On-screen touch controls appear automatically — D-pad on the left, ABXY on the right.
Shoulder buttons appear above for systems that need them.

### Physical Controller (USB or Bluetooth)
Plug in/pair before opening the game. The browser auto-detects it.
Controller icon appears in the top bar when connected.
Touch controls are hidden when a controller is detected.

---

## Tips

- **Performance:** Keep the laptop plugged in. Emulation (especially NDS/N64/PSX) uses CPU.
- **NDS games:** Two screens stack vertically. The bottom screen is touchable.
- **Save states:** Click "Save" in the top bar while a game is running.
- **Fullscreen on mobile:** Tap the fullscreen button in the top bar.
- **ROM names:** The game name shown in the library comes from the filename.
  Rename your files nicely: `Pokemon Red Version.gb` → shows as "Pokemon Red Version"

---

## Permanent Tunnel (optional, free)

If you want the same URL every time:

1. Sign up at https://dash.cloudflare.com (free)
2. Add your domain OR use Cloudflare's subdomain
3. Run:
```bash
cloudflared login
cloudflared tunnel create retro-vault
cloudflared tunnel route dns retro-vault games.yourdomain.com
cloudflared tunnel run --url http://localhost:3000 retro-vault
```

---

## Troubleshooting

**Games don't appear:**
- Make sure files are in the right `roms/` subfolder
- Check the file extension matches (`.gba` not `.GBA`)
- Restart the server after adding ROMs

**Emulator doesn't load:**
- You need an internet connection — EmulatorJS loads cores from their CDN
- Try a different browser (Chrome or Firefox work best)

**Slow performance:**
- N64 and PSX are the most demanding — try closing other apps
- NDS games vary a lot by title
- GBA/GBC/GB/SNES are very fast and should run perfectly
