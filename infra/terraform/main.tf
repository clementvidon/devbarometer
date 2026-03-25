module "topic_backend_instance" {
  source        = "./modules/topic-backend"
  topic_backend = var.topic_backend
}
