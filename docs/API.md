# IKE-BOT API Documentation

## Overview

The IKE-BOT API is a fully functional Node.js/TypeScript REST API that provides authentication, CRUD operations, Notion integration, and webhook handling for the IKE-BOT trust automation engine.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "user"
    },
    "token": "jwt-token"
  },
  "message": "User registered successfully"
}
```

#### POST /api/auth/login
Login with existing credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "user"
    },
    "token": "jwt-token"
  },
  "message": "Login successful"
}
```

#### GET /api/auth/profile
Get current user profile (requires authentication).

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user",
    "created_at": "2023-01-01T00:00:00Z"
  }
}
```

## CRUD Operations

The API provides generic CRUD endpoints for different resources:

### Filings

#### POST /api/filings
Create a new filing.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "type": "UCC",
  "status": "Draft",
  "content": {
    "debtor": "John Doe",
    "amount": 10000
  }
}
```

#### GET /api/filings
Get all filings with optional filters.

**Query Parameters:**
- `limit`: Number of results (default: 100)
- `offset`: Pagination offset (default: 0)
- `status`: Filter by status
- `type`: Filter by type

#### GET /api/filings/:id
Get a specific filing by ID.

#### PUT /api/filings/:id
Update a filing.

#### DELETE /api/filings/:id
Delete a filing.

### Documents

Same CRUD operations available at `/api/documents`

### Logs

Same CRUD operations available at `/api/logs`

## Notion Integration

### POST /api/notion/activity
Log an activity to Notion.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Filed UCC Lien",
  "status": "Completed",
  "type": "Filing",
  "description": "Successfully filed UCC lien for client",
  "metadata": {
    "client": "John Doe",
    "amount": 10000
  }
}
```

### POST /api/notion/filings
Create a filing in Notion database.

**Request Body:**
```json
{
  "title": "UCC Lien - John Doe",
  "type": "UCC",
  "status": "Filed",
  "content": {}
}
```

### GET /api/notion/database/:databaseId
Get all entries from a Notion database.

### PATCH /api/notion/page/:pageId
Update a Notion page.

**Request Body:**
```json
{
  "properties": {
    "Status": {
      "select": {
        "name": "Completed"
      }
    }
  }
}
```

## Webhook Integration

### POST /api/webhooks/make
Receive webhooks from Make.com (no authentication required).

**Request Body:**
```json
{
  "event": "filing.created",
  "data": {
    "type": "UCC",
    "title": "New UCC Filing",
    "status": "Draft"
  },
  "timestamp": "2023-01-01T00:00:00Z"
}
```

**Supported Events:**
- `filing.created`: New filing created
- `filing.updated`: Filing updated
- `activity.log`: Log an activity

### GET /api/webhooks/make
Get webhook documentation and supported events.

## Health Check

### GET /api/health
Check API health status.

**Response:**
```json
{
  "success": true,
  "message": "IKE-BOT API is running",
  "timestamp": "2023-01-01T00:00:00Z"
}
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production use.

## CORS

CORS is enabled for all origins in development. Configure appropriately for production.
