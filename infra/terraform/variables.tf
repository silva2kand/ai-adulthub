variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "docker_image" {
  description = "Docker image for the application"
  type        = string
  default     = "your-registry/adult-aggregator:latest"
}