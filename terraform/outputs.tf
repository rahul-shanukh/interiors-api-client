output "artifact_registry_repository_name" {
  description = "Artifact Registry repository name"
  value       = google_artifact_registry_repository.backend-client.repository_id
}

output "artifact_registry_repository_url" {
  description = "Artifact Registry Docker repository URL"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.backend-client.repository_id}"
}

output "per_environment_secret_ids" {
  description = "Per-environment Secret Manager secret IDs"
  value = {
    for name, secret in google_secret_manager_secret.per_env_secrets :
    name => secret.secret_id
  }
}

output "shared_secret_ids" {
  description = "Shared Secret Manager shared secret IDs"
  value = {
    for name, secret in google_secret_manager_secret.shared_secrets :
    name => secret.secret_id
  }
}

output "cloud_build_deployer_service_account" {
  description = "Cloud Build deployer service account email"
  value       = "cloud-build-deployer@${var.project_id}.iam.gserviceaccount.com"
}
