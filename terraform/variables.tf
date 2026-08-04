variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
  default     = "project-489515"
}

variable "region" {
  description = "Google Cloud Region"
  type        = string
  default     = "asia-south1"
}

variable "artifact_registry_name" {
  description = "Artifact Registry repository name"
  type        = string
  default     = "interiors-backend-client"
}

variable "service_name" {
  description = "Cloud Run service name"
  type        = string
  default     = "interiors-api-client"
}

variable "enable_cloud_run_iam" {
  description = "Whether to grant the Cloud Tasks OIDC service account permission to invoke Cloud Run. Set to false for local/ngrok development."
  type        = bool
  default     = false
}
