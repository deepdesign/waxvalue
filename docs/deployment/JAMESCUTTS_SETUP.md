# waxvalue on waxvalue.jamescutts.me — setup checklist

Frontend auto-deploys from GitHub on **Hostinger**. The API stays on your **VPS** at **api.jamescutts.me**.

---

## Part A — DNS (5 minutes, Hostinger or wherever `jamescutts.me` DNS lives)

1. Log in to **Hostinger** → **Domains** → **jamescutts.me** → **DNS / DNS Zone**.
2. **Add record:**

   | Type | Name | Points to | TTL |
   |------|------|-----------|-----|
   | **A** | `api` | `195.35.15.194` | 300 (or default) |

   This creates **api.jamescutts.me** → your VPS (same IP as waxvalue.com).

3. Wait 5–30 minutes. Test on your PC:

   ```powershell
   nslookup api.jamescutts.me
   ```

   You should see `195.35.15.194`.

> **Note:** `waxvalue.jamescutts.me` is handled by Hostinger’s Git deploy — you do **not** need an A record for that unless Hostinger asks for one.

---

## Part B — VPS (one script, ~2 minutes)

### 1. Open PowerShell and SSH in

```powershell
ssh -p 65002 u728332901@195.35.15.194
```

(Use the port/user from Hostinger **VPS → SSH access** if different. Enter password when prompted.)

### 2. Pull code and run the setup script

Paste this **whole block**:

```bash
cd /var/www/waxvalue 2>/dev/null || cd ~/waxvalue
git pull origin master
sudo FRONTEND_URL=https://waxvalue.jamescutts.me bash deployment-scripts/setup-api-jamescutts.sh
```

If `git pull` fails, upload the repo first or skip pull and run only the `sudo ... setup-api-jamescutts.sh` line after files exist.

### 3. Confirm API is up

```bash
curl -sI https://api.jamescutts.me/docs | head -3
```

You want `HTTP/2 200` or `HTTP/1.1 200`.

If SSL fails, DNS may not be ready yet — wait and re-run:

```bash
sudo certbot --nginx -d api.jamescutts.me
```

---

## Part C — Discogs (3 minutes, browser only)

1. Open https://www.discogs.com/settings/developers  
2. Open your **Waxvalue** application (or create one).  
3. Set:

   | Field | Value |
   |-------|--------|
   | **Callback URL** | `https://waxvalue.jamescutts.me/auth/callback` |
   | **Application URL** | `https://waxvalue.jamescutts.me` |

4. **Save**.

Discogs keys must already be in **`/var/www/waxvalue/backend/.env`** on the VPS:

- `DISCOGS_CONSUMER_KEY`
- `DISCOGS_CONSUMER_SECRET`

If OAuth still fails, SSH in and check:

```bash
grep DISCOGS /var/www/waxvalue/backend/.env
pm2 logs waxvalue-backend --lines 30
```

---

## Part D — Hostinger (you already did most of this)

Environment variables on the Node/Next deploy:

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_BACKEND_URL` | `https://api.jamescutts.me` |
| `NODE_ENV` | `production` |

Redeploy after any env change.

---

## Final test

1. https://waxvalue.jamescutts.me — loads  
2. https://api.jamescutts.me/docs — FastAPI docs  
3. Click **Connect Discogs** — redirects to Discogs, then back to `/auth/callback`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `nslookup api` wrong IP | Fix DNS A record (Part A) |
| API 502 / connection refused | `pm2 status` → start backend: `bash deployment-scripts/deploy-on-vps.sh` |
| Discogs “invalid callback” | Callback URL must match Part C exactly |
| CORS errors | `grep FRONTEND_URL backend/.env` must be `https://waxvalue.jamescutts.me`, then `pm2 restart waxvalue-backend` |

---

## Optional: stop old frontend on VPS

If the site is only on Hostinger now:

```bash
pm2 delete waxvalue-frontend
pm2 save
```

Keep **waxvalue-backend** running.
