const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const ROMS_DIR = path.join(__dirname, 'roms');
const COVER_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// System config: maps folder name to EmulatorJS system core + display info
const SYSTEM_CONFIG = {
  gba: {
    name: 'Game Boy Advance',
    core: 'mgba',
    extensions: ['.gba'],
    color: '#9333ea',
    icon: 'GBA',
    controls: 'gamepad'
  },
  gbc: {
    name: 'Game Boy Color',
    core: 'gambatte',
    extensions: ['.gbc', '.gb'],
    color: '#06b6d4',
    icon: 'GBC',
    controls: 'gamepad'
  },
  gb: {
    name: 'Game Boy',
    core: 'gambatte',
    extensions: ['.gb'],
    color: '#6b7280',
    icon: 'GB',
    controls: 'gamepad'
  },
  nds: {
    name: 'Nintendo DS',
    core: 'melonds',
    extensions: ['.nds'],
    color: '#ef4444',
    icon: 'NDS',
    controls: 'nds'
  },
  snes: {
    name: 'Super Nintendo',
    core: 'snes9x',
    extensions: ['.snes', '.sfc', '.fig'],
    color: '#f59e0b',
    icon: 'SNES',
    controls: 'gamepad'
  },
  n64: {
    name: 'Nintendo 64',
    core: 'mupen64plus_next',
    extensions: ['.n64', '.z64', '.v64'],
    color: '#10b981',
    icon: 'N64',
    controls: 'n64'
  },
  psx: {
    name: 'PlayStation',
    core: 'pcsx_rearmed',
    extensions: ['.iso', '.bin', '.img', '.pbp'],
    color: '#3b82f6',
    icon: 'PSX',
    controls: 'psx'
  }
};

// Scan ROMs directory and return game list
function scanRoms() {
  const games = [];
  for (const [system, config] of Object.entries(SYSTEM_CONFIG)) {
    const systemDir = path.join(ROMS_DIR, system);
    if (!fs.existsSync(systemDir)) continue;
    const files = fs.readdirSync(systemDir);
    const coverIndex = buildCoverIndex(systemDir);
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (config.extensions.includes(ext)) {
        const name = path.basename(file, ext)
          .replace(/[_\-]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const baseName = path.basename(file, ext);
        const coverPath = findCoverForRom(systemDir, baseName, name, coverIndex);
        games.push({
          id: `${system}-${encodeURIComponent(file)}`,
          name,
          file,
          system,
          systemName: config.name,
          core: config.core,
          color: config.color,
          icon: config.icon,
          controls: config.controls,
          romPath: `/roms/${system}/${encodeURIComponent(file)}`,
          coverPath: coverPath ? `/roms/${system}/${encodeURIComponent(coverPath)}` : null
        });
      }
    }
  }
  return games.sort((a, b) => a.name.localeCompare(b.name));
}

function buildCoverIndex(systemDir) {
  const index = new Map();
  const coverDirs = [systemDir, path.join(systemDir, 'covers')];

  for (const dir of coverDirs) {
    if (!fs.existsSync(dir)) continue;
    const isCoversSubdir = path.basename(dir).toLowerCase() === 'covers';
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const ext = path.extname(entry).toLowerCase();
      if (!COVER_EXTENSIONS.includes(ext)) continue;
      const base = path.basename(entry, ext);
      const relativePath = isCoversSubdir ? `covers/${entry}` : entry;
      index.set(normalizeName(base), relativePath);
      index.set(base.toLowerCase(), relativePath);
    }
  }

  return index;
}

function normalizeName(value) {
  return value
    .toLowerCase()
    .replace(/\[[^\]]*\]|\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findCoverForRom(systemDir, baseName, displayName, coverIndex) {
  // 1) Exact filename match in system folder (preserves current behavior)
  for (const ext of COVER_EXTENSIONS) {
    const coverFile = `${baseName}${ext}`;
    if (fs.existsSync(path.join(systemDir, coverFile))) {
      return coverFile;
    }
  }

  // 2) Case-insensitive and normalized matches in system folder or covers/
  const candidates = [
    baseName.toLowerCase(),
    displayName.toLowerCase(),
    normalizeName(baseName),
    normalizeName(displayName)
  ];
  for (const key of candidates) {
    const matched = coverIndex.get(key);
    if (matched) return matched;
  }

  return null;
}

// API: Get all games
app.get('/api/games', (req, res) => {
  try {
    const games = scanRoms();
    res.json({ games, systems: SYSTEM_CONFIG });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Search games
app.get('/api/games/search', (req, res) => {
  const query = (req.query.q || '').toLowerCase();
  const system = req.query.system;
  let games = scanRoms();
  if (query) games = games.filter(g => g.name.toLowerCase().includes(query));
  if (system && system !== 'all') games = games.filter(g => g.system === system);
  res.json({ games });
});

// Serve ROM files
app.use('/roms', express.static(ROMS_DIR, {
  setHeaders: (res, filePath) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Cache-Control', 'public, max-age=3600');
  }
}));

// Serve EmulatorJS from CDN via redirect (handled in frontend)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🎮 Retro Vault running at http://localhost:${PORT}`);
  console.log(`📁 ROMs directory: ${ROMS_DIR}`);
  console.log(`\nSupported systems:`);
  for (const [key, val] of Object.entries(SYSTEM_CONFIG)) {
    const dir = path.join(ROMS_DIR, key);
    const count = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f =>
      val.extensions.includes(path.extname(f).toLowerCase())
    ).length : 0;
    console.log(`  ${val.icon.padEnd(5)} → roms/${key}/  (${count} games)`);
  }
  console.log(`\nTo expose to internet: cloudflared tunnel --url http://localhost:${PORT}\n`);
});
