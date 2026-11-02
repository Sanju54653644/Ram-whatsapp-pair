import express from 'express';
import pino from 'pino';
import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3000);
const logger = pino({ level: 'silent' });
const slots = new Map();
const attempts = new Map();

app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Basic per-IP rate limit for the pairing endpoint.
function rateLimit(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const previous = attempts.get(ip) || [];
  const recent = previous.filter(t => now - t < 10 * 60 * 1000);
  if (recent.length >= 5) {
    return res.status(429).json({ error: 'Too many attempts. Please wait 10 minutes.' });
  }
  recent.push(now);
  attempts.set(ip, recent);
  next();
}

function validNumber(value) {
  return typeof value === 'string' && /^\d{8,15}$/.test(value);
}

app.post('/api/pair/:slot', rateLimit, async (req, res) => {
  const slot = req.params.slot;
  if (!['1', '2'].includes(slot)) {
    return res.status(404).json({ error: 'Unknown pair endpoint.' });
  }

  const number = String(req.body?.number || '').replace(/\D/g, '');
  if (!validNumber(number)) {
    return res.status(400).json({ error: 'Enter your full phone number with country code, digits only.' });
  }

  try {
    const existing = slots.get(slot);
    if (existing?.number === number && existing.code) {
      return res.json({ code: existing.code, message: 'Use this code in WhatsApp Linked Devices.' });
    }
    if (existing?.sock) {
      try { existing.sock.end(undefined); } catch {}
      slots.delete(slot);
    }

    const authDir = path.join(__dirname, 'sessions', `pair${slot}`);
    await fs.mkdir(authDir, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    if (state.creds.registered) {
      return res.status(409).json({
        error: `PAIR ${slot} already has a linked WhatsApp session. Remove sessions/pair${slot} only if you intentionally want to relink it.`
      });
    }

    const sock = makeWASocket({
      auth: state,
      logger,
      browser: ['RAM-MD', 'Chrome', '1.0.0'],
      markOnlineOnConnect: false,
      syncFullHistory: false
    });
    sock.ev.on('creds.update', saveCreds);

    const entry = { number, sock, code: null };
    slots.set(slot, entry);

    // Give the socket a moment to initialize before requesting the pairing code.
    await new Promise(resolve => setTimeout(resolve, 1500));
    const code = await sock.requestPairingCode(number);
    entry.code = code;

    return res.json({
      code,
      message: 'On WhatsApp: Settings > Linked devices > Link a device > Link with phone number instead.'
    });
  } catch (error) {
    console.error(`PAIR ${slot} error:`, error?.message || error);
    return res.status(500).json({ error: 'Could not create a pairing code. Check server logs and try again.' });
  }
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'RAM-MD' }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`RAM-MD is running on port ${PORT}`);
});
