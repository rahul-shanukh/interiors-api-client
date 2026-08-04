locals {
  cloud_build_service_account = "cloud-build-deployer@${var.project_id}.iam.gserviceaccount.com"
}

resource "google_project_iam_member" "cloud_build_viewer" {
  project = var.project_id
  role    = "roles/cloudbuild.builds.viewer"
  member  = "serviceAccount:${local.cloud_build_service_account}"
}

resource "google_project_iam_member" "cloud_build_log_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:cloud-build-deployer@${var.project_id}.iam.gserviceaccount.com"
}

resource "google_project_iam_member" "cloud_run_runtime_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:296782074920-compute@developer.gserviceaccount.com"
}
