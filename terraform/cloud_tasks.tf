data "google_project" "current" {
  project_id = var.project_id
}

resource "google_project_service" "cloud_tasks" {
  project            = var.project_id
  service            = "cloudtasks.googleapis.com"
  disable_on_destroy = false
}

resource "google_service_account" "cloud_tasks_invoker" {
  project      = var.project_id
  account_id   = "cloud-tasks-invoker"
  display_name = "Cloud Tasks webhook invoker"
}

resource "google_service_account_iam_member" "cloud_tasks_can_mint_oidc_token" {
  service_account_id = google_service_account.cloud_tasks_invoker.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:service-${data.google_project.current.number}@gcp-sa-cloudtasks.iam.gserviceaccount.com"
}

resource "google_cloud_run_v2_service_iam_member" "cloud_tasks_can_invoke_api" {
  count = var.enable_cloud_run_iam ? 1 : 0

  project  = var.project_id
  location = var.region
  name     = var.service_name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.cloud_tasks_invoker.email}"
}

resource "google_project_iam_member" "api_can_enqueue_tasks" {
  project = var.project_id
  role    = "roles/cloudtasks.enqueuer"
  member  = "serviceAccount:${data.google_project.current.number}-compute@developer.gserviceaccount.com"
}

resource "google_cloud_tasks_queue" "notifications_high" {
  project  = var.project_id
  location = var.region
  name     = "notifications-high"

  rate_limits {
    max_dispatches_per_second = 10
    max_concurrent_dispatches = 20
  }

  retry_config {
    max_attempts       = 8
    max_retry_duration = "3600s"
    min_backoff        = "5s"
    max_backoff        = "300s"
    max_doublings      = 5
  }

  stackdriver_logging_config {
    sampling_ratio = 1.0
  }

  depends_on = [google_project_service.cloud_tasks]
}

resource "google_cloud_tasks_queue" "notifications" {
  project  = var.project_id
  location = var.region
  name     = "notifications"

  rate_limits {
    max_dispatches_per_second = 5
    max_concurrent_dispatches = 10
  }

  retry_config {
    max_attempts       = 8
    max_retry_duration = "3600s"
    min_backoff        = "5s"
    max_backoff        = "300s"
    max_doublings      = 5
  }

  stackdriver_logging_config {
    sampling_ratio = 1.0
  }

  depends_on = [google_project_service.cloud_tasks]
}

output "cloud_tasks_invoker_service_account_email" {
  value = google_service_account.cloud_tasks_invoker.email
}

output "notification_queue_names" {
  value = {
    high     = google_cloud_tasks_queue.notifications_high.name
    standard = google_cloud_tasks_queue.notifications.name
  }
}
