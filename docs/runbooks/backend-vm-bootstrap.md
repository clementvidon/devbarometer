# Backend VM Post-Boot Runbook

This runbook completes the `masswhisper` backend setup on a VM already bootstrapped by Terraform + cloud-init.

It assumes:

- Ubuntu 24.04
- SSH access as `root`
- the repository is reachable from the VM
- the dedicated Neon database already exists
- the backend secrets are available outside git

## 1. Transfer The Runtime Env File Securely

Transfer the backend env file to `/etc/masswhisper/backend.env` over SSH.

Ensure:

- owner is `root:masswhisper`
- mode is `640`
- the file is never committed to git

Example secure approach:

```bash
server_ip="$(terraform -chdir=infra/terraform output -raw server_ip)"
pass show masswhisper/runtime/fr-dev-job-market-prod/backend.env | \
ssh "root@$server_ip" '
  set -euo pipefail
  install -d -m 755 /etc/masswhisper
  tmp=$(mktemp)
  trap "rm -f \"$tmp\"" EXIT
  cat > "$tmp"
  install -o root -g masswhisper -m 640 "$tmp" /etc/masswhisper/backend.env
'
```

If the service was already running, restart it after updating the env file.

## 2. Run Database Migrations

```bash
server_ip="$(terraform -chdir=infra/terraform output -raw server_ip)"
ssh "root@$server_ip" '
set -a
source /etc/masswhisper/backend.env
set +a

cd /opt/masswhisper
npm --workspace backend run db:migrate
'
```

## 3. Enable And Start The Service

```bash
server_ip="$(terraform -chdir=infra/terraform output -raw server_ip)"
ssh "root@$server_ip" '
systemctl enable masswhisper-topic
systemctl start masswhisper-topic
systemctl status masswhisper-topic
'
```

## 4. Inspect Logs

```bash
server_ip="$(terraform -chdir=infra/terraform output -raw server_ip)"
ssh "root@$server_ip" 'journalctl -u masswhisper-topic -n 100 --no-pager'
```

## 5. Verify Local Reachability

```bash
server_ip="$(terraform -chdir=infra/terraform output -raw server_ip)"
ssh "root@$server_ip" '
ss -ltnp | grep 3000
curl -i http://127.0.0.1:3000/report
'
```

## State After This Runbook

- the backend runs as a long-lived service
- the backend is still private
- Nginx, `/health`, DNS/TLS, and cron are not configured yet
