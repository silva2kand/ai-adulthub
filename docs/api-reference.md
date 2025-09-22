# API Reference

## Base URL
`http://localhost:4000/api`

## Authentication
All protected endpoints require a Bearer token in the Authorization header.

## Endpoints

### Search Videos
- **GET** `/search?q={query}`
- Search videos by title or description.

### Get Videos
- **GET** `/videos`
- Get all videos.

### Get Video by ID
- **GET** `/videos/{id}`
- Get a specific video.

### Delete User (GDPR)
- **DELETE** `/users/{id}`
- Delete a user account.

### Health Check
- **GET** `/health`
- Check service health.

### Metrics
- **GET** `/metrics`
- Prometheus metrics.

### API Docs
- **GET** `/api-docs`
- Swagger UI documentation.

## Swagger Documentation
Full API documentation available at `/api-docs` when running the application.