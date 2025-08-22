# ---------- CONFIGURATION ----------
PROJECT_ID := your-gcp-project-id
REGION := us-central1
SERVICE_NAME := telegram-bot
IMAGE_NAME := gcr.io/$(PROJECT_ID)/$(SERVICE_NAME)
PORT := 8081
ENV_FILE := .env

# ---------- COMMANDS ----------

# Build the Docker image locally
build:
	docker build -t $(SERVICE_NAME) -f Dockerfile .

# Tag the local image for Google Container Registry
tag:
	docker tag $(SERVICE_NAME) $(IMAGE_NAME)

# Push the tagged image to GCR
push:
	docker push $(IMAGE_NAME)

# Deploy the image to Cloud Run
deploy:
	gcloud run deploy $(SERVICE_NAME) \
		--image $(IMAGE_NAME) \
		--platform managed \
		--region $(REGION) \
		--allow-unauthenticated \
		--set-env-vars TELEGRAM_TOKEN=$$(grep TELEGRAM_TOKEN $(ENV_FILE) | cut -d '=' -f2),MONGO_URI=$$(grep MONGO_URI $(ENV_FILE) | cut -d '=' -f2),PUBLIC_URL=$$(grep PUBLIC_URL $(ENV_FILE) | cut -d '=' -f2) \
		--port $(PORT)

# Combine build, tag, push, and deploy
release: build tag push deploy

# View logs from Cloud Run
logs:
	gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$(SERVICE_NAME)" \
		--project=$(PROJECT_ID) \
		--limit=100 \
		--format="table(timestamp, severity, textPayload)"

# Clean local Docker image
clean:
	docker rmi -f $(SERVICE_NAME) $(IMAGE_NAME) || true

.PHONY: build tag push deploy release logs clean
