output "service_name" {
  value = module.topic_backend_instance.service_name
}

output "frontend_path" {
  value = module.topic_backend_instance.frontend_path
}

output "backend_api_prefix" {
  value = module.topic_backend_instance.backend_api_prefix
}
