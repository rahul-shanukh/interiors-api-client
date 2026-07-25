locals {
  cloud_build_service_account = "cloud-build-deployer@${var.project_id}.iam.gserviceaccount.com"
}

resource "google_project_iam_member" "cloud_build_viewer" {
  project = var.project_id
  role    = "roles/cloudbuild.builds.viewer"
  member  = "serviceAccount:${local.cloud_build_service_account}"
}