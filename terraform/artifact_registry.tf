resource "google_artifact_registry_repository" "backend-client" {
  location = var.region
  repository_id = var.artifact_registry_name
  description = "Docker repository for Interiors backend"
  format = "DOCKER"
}