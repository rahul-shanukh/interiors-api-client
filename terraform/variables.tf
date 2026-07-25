variable "project_id" {
    description = "Google Cloud Project ID"
    type = string
    default = "project-489515"
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