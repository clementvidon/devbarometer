# Terraform Hetzner Runbook

This runbook provisions the minimal Hetzner VM baseline for the `masswhisper backend`.

It assumes:

- Terraform is installed locally
- a valid Hetzner Cloud API token already exists
- the topic manifest already exists

## 1. Export The Hetzner Token

Terraform reads the Hetzner token from the shell environment:

```bash
export HCLOUD_TOKEN=<your_hetzner_cloud_api_token>
```

## 2. Generate The Terraform Input

```bash
npm run generate-topic-tf-input -- instances/fr-dev-job-market/prod.yaml
```

Expected output:

- `infra/terraform/generated/fr-dev-job-market-prod.tfvars.json`

## 3. Initialize Terraform

```bash
cd infra/terraform
terraform init
```

## 4. Review The Plan

```bash
terraform plan -var-file=generated/fr-dev-job-market-prod.tfvars.json
```

Expected result:

- the Hetzner SSH key is created or reused
- the Hetzner server is created or updated
- the server IP is exposed as an output

## 5. Apply The Plan

```bash
terraform apply -var-file=generated/fr-dev-job-market-prod.tfvars.json
```

## 6. Read The Outputs

```bash
terraform output
terraform output server_ip
```

Expected result:

- the VM exists
- the public IPv4 is available

## 7. Verify SSH Access

```bash
ssh root@$(terraform output -raw server_ip)
```

Optional verification on the VM:

```bash
cat /etc/os-release
uname -a
```

At this stage:

- the VM baseline exists
- SSH access works
- runtime installation and backend deployment are not configured yet
