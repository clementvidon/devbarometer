locals {
  service_name       = "${var.topic_backend.topic_slug}-${var.topic_backend.environment}"
  frontend_path      = "/${var.topic_backend.topic_slug}"
  backend_api_prefix = "/api/v1/topics/${var.topic_backend.topic_slug}"
}
