# Backend VM Install Runbook

This runbook installs the `masswhisper` backend on a fresh Ubuntu VM and runs it as a `systemd` service.

It assumes:

- Ubuntu 24.04
- SSH access as `root`
- the repository is reachable from the VM
- the dedicated Neon database already exists
- the backend secrets are available outside git

## 1. Install Runtime Dependencies

```bash
apt update
apt install -y git curl ca-certificates build-essential

mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource.gpg.key \
  | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" \
  > /etc/apt/sources.list.d/nodesource.list
apt update
apt install -y nodejs

node -v
npm -v
```

## 2. Create The Service User

```bash
adduser --system --group --home /opt/masswhisper masswhisper
```

## 3. Clone The Repository

```bash
git clone https://github.com/clementvidon/masswhisper /opt/masswhisper
chown -R masswhisper:masswhisper /opt/masswhisper
```

## 4. Install Dependencies And Build Shared

```bash
cd /opt/masswhisper
npm ci
npm run build-shared
```

## 5. Create The Runtime Env File

```bash
mkdir /etc/masswhisper
touch /etc/masswhisper/backend.env
chown root:masswhisper /etc/masswhisper/backend.env
chmod 640 /etc/masswhisper/backend.env
```

Edit `/etc/masswhisper/backend.env` with:

```env
NODE_ENV=production
BIND_HOST=127.0.0.1
PORT=3000

LOG_PRETTY=false
LOG_LEVEL=info

DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...

REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
REDDIT_USERNAME=...
REDDIT_PASSWORD=...
REDDIT_URL=https://...
```

## 6. Run Database Migrations

```bash
set -a
source /etc/masswhisper/backend.env
set +a

cd /opt/masswhisper
npm --workspace backend run db:migrate
```

## 7. Install The Systemd Unit

Copy the versioned unit file:

```bash
cp /opt/masswhisper/deploy/systemd/masswhisper-topic.service \
  /etc/systemd/system/masswhisper-topic.service
```

## 8. Reload And Start The Service

```bash
systemctl daemon-reload
systemctl enable masswhisper-topic
systemctl start masswhisper-topic
systemctl status masswhisper-topic
```

## 9. Inspect Logs

```bash
journalctl -u masswhisper-topic -n 100 --no-pager
```

## 10. Verify Local Reachability

```bash
ss -ltnp | rg 3000
curl -i http://127.0.0.1:3000/report
```

At this stage:

- the backend runs as a long-lived service
- the backend is still private
- Nginx, `/health`, DNS/TLS, and cron are not configured yet
