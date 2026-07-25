variable "environments" {
  default = ["dev", "preprod", "prod"]
}

# Per-environment secrets (only Mongo + Session differ per env)
variable "per_env_secret_keys" {
  default = ["MONGO_URI", "SESSION_SECRET"]
}

resource "google_secret_manager_secret" "per_env_secrets" {
  for_each = {
    for pair in setproduct(var.per_env_secret_keys, var.environments) :
    "${pair[0]}_${upper(pair[1])}" => pair
  }

  secret_id = each.key
  replication {
    auto {}
  }
}

# Shared secrets (same across dev/preprod/prod)
variable "shared_secret_keys" {
  default = ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "RECAPTCHA_SECRET_KEY"]
}

resource "google_secret_manager_secret" "shared_secrets" {
  for_each = toset(var.shared_secret_keys)

  secret_id = each.key
  replication {
    auto {}
  }
}