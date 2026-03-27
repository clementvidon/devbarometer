module "topic_backend_instance" {
  source        = "./modules/topic-backend"
  topic_backend = var.topic_backend
}

locals {
  app_name    = "masswhisper"
  server_name = "${local.app_name}-${module.topic_backend_instance.service_name}"
  bootstrap = {
    node_version = "22.22.2"
    node_arch    = "linux-x64"
    service_user = local.app_name
    repo_url     = "https://github.com/clementvidon/masswhisper"
    repo_dir     = "/opt/masswhisper"
    service_name = "masswhisper-topic"
  }
}

resource "hcloud_ssh_key" "default" {
  name       = var.ssh_key_name
  public_key = file(pathexpand(var.ssh_public_key_path))
}

resource "hcloud_server" "vm" {
  name        = local.server_name
  server_type = var.server_type
  location    = var.server_location
  image       = var.server_image

  user_data = templatefile("${path.module}/cloud-init.yaml.tftpl", local.bootstrap)

  ssh_keys = [hcloud_ssh_key.default.id]

  public_net {
    ipv4_enabled = true
    ipv6_enabled = true
  }
}
