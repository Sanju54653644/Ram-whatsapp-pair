# RAM-MD Pairing Website

A mobile-friendly black/red WhatsApp pairing-code website with two endpoints: PAIR 1 and PAIR 2.

## Requirements
- Node.js 20 or newer
- Persistent disk storage (the `sessions/` directory must survive restarts)

## Install and run
```bash
npm install
npm start
```
Open `http://YOUR_SERVER_IP:3000`.

## Pterodactyl
1. Create a Node.js server/egg.
2. Upload this project ZIP and extract it in the server directory.
3. Set the startup command to `npm start`.
4. Set the server allocation port as `PORT` if your egg requires it (otherwise the app defaults to 3000).
5. Make sure the allocated port is used by the panel and is reachable through your domain/reverse proxy.
6. Keep `sessions/` on persistent storage; do not delete it after pairing.

## Important
- Use only your own WhatsApp number and obtain the account owner's consent.
- Never share or publish the `sessions/` folder. It contains login credentials.
- PAIR 1 and PAIR 2 are separate session slots. A slot can hold one linked account at a time.
- This project uses the unofficial Baileys WhatsApp Web library, not the official WhatsApp Business Platform. WhatsApp may change its protocol or restrict accounts using unofficial clients.
- For a production public service, add HTTPS, stronger access controls, monitoring, and persistent session backups.
- Do not expose this endpoint publicly for unrestricted use. The included per-IP limit is only a basic safeguard.
