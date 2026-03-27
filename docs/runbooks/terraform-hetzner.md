# Terraform Hetzner Runbook

This runbook provisions a Hetzner VM for the `masswhisper backend` and bootstraps the machine with cloud-init.

It assumes:

- Terraform is installed locally
- a valid Hetzner Cloud API token already exists
- the topic manifest already exists

## 1. Export The Hetzner Token

Terraform reads the Hetzner cloud api token from the shell environment.

Example secure approach:

```bash
export HCLOUD_TOKEN="$(pass show masswhisper/infra/hcloud/token)"
```

## 2. Generate The Terraform Input

```bash
npm run generate-topic-tf-input -- instances/fr-dev-job-market/prod.yaml
```

Expected result:

- `infra/terraform/generated/fr-dev-job-market-prod.tfvars.json`

## 3. Initialize Terraform

```bash
terraform -chdir=infra/terraform init
```

## 4. Review The Plan

```bash
terraform -chdir=infra/terraform plan -var-file=generated/fr-dev-job-market-prod.tfvars.json
```

Expected result:

- the Hetzner SSH key is created or reused
- the Hetzner server is created or updated
- the server IP is exposed as an output

## 5. Apply The Plan

```bash
terraform -chdir=infra/terraform apply -var-file=generated/fr-dev-job-market-prod.tfvars.json
```

## 6. Read The Outputs

```bash
terraform -chdir=infra/terraform output
terraform -chdir=infra/terraform output server_ip
```

Expected result:

- the VM exists
- the public IPv4 is available

## 7. Verify Cloud-Init And Bootstrap

```bash
server_ip="$(terraform -chdir=infra/terraform output -raw server_ip)"
ssh "root@$server_ip" '
  set -eu
  echo "node: $(node -v)"
  echo "npm: $(npm -v)"
  id -u masswhisper >/dev/null
  echo "user: ok"
  test -d /opt/masswhisper
  echo "repo: ok"
  echo "env: $(stat -c "%U:%G %a" /etc/masswhisper/backend.env)"
  test -f /etc/systemd/system/masswhisper-topic.service
  echo "unit: ok"
'
```

If the step fails, inspect the cloud-init logs:

```bash
ssh "root@$server_ip" 'journalctl -u cloud-init -u cloud-final -n 40 --no-pager'
```

Expected result:

- cloud-init completed successfully
- Node.js and npm are installed
- the masswhisper system user exists
- the repository is present in /opt/masswhisper
- /etc/masswhisper/backend.env exists and still needs secrets
- the versioned systemd unit is installed

## State After This Runbook

- the VM exists
- SSH access works
- the backend runtime is bootstrapped
- secrets, migrations, and service start are still manual
