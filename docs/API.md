# GULA API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Auth

#### POST /auth/signup
Creates a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "password123",
  "age": 35,
  "sex": "M",
  "weight": 75,
  "goals": "Improve cardiovascular health"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "age": 35,
    "sex": "M"
  }
}
```

#### POST /auth/login
Authenticates user and returns JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_123",
    "email": "user@example.com"
  }
}
```

### Exams

#### POST /exams/upload
Uploads and processes a PDF exam file.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: `pdf` (file)

**Response:**
```json
{
  "examId": "exam_456",
  "userId": "user_123",
  "healthScore": 73,
  "biomarkers": [
    {
      "biomarker": "LDL",
      "value": 145,
      "unit": "mg/dL",
      "status": "OUT_OF_RANGE",
      "trafficLight": "ORANGE",
      "weight": 18,
      "contribution": 7.2,
      "riskKey": "ldl.out_of_range.risk",
      "recommendationKeys": [
        "ldl.reduce_saturated_fat",
        "ldl.increase_fiber",
        "ldl.add_cardio"
      ]
    }
  ],
  "priorities": [
    {
      "biomarker": "LDL",
      "urgency": "HIGH",
      "messageKey": "ldl.priority.high"
    }
  ]
}
```

#### GET /exams/:examId
Retrieves exam results by ID.

**Response:**
Same format as upload response.

#### GET /exams
Lists all exams for the authenticated user.

**Response:**
```json
{
  "exams": [
    {
      "id": "exam_456",
      "uploadedAt": "2024-01-15T10:30:00Z",
      "status": "completed",
      "healthScore": 73
    }
  ]
}
```

### Users

#### GET /users/me
Gets current user profile.

**Response:**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "age": 35,
  "sex": "M",
  "weight": 75,
  "goals": "Improve cardiovascular health"
}
```

#### PATCH /users/me
Updates current user profile.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "age": 36,
  "weight": 74
}
```

**Response:**
Updated user object.

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message here"
}
```

Status codes:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

