# IKE BOT API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
Currently, the API uses Supabase's built-in authentication. Include the Supabase anonymous key in your requests.

## Response Format
All responses follow this format:
```json
{
  "success": true|false,
  "data": {...} | [...],
  "error": "error message" // only present on failure
}
```

---

## Beneficiaries

### Get All Beneficiaries
```http
GET /api/beneficiaries
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "555-1234",
      "relationship": "Spouse",
      "trust_id": "trust_123",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Get Beneficiary by ID
```http
GET /api/beneficiaries/:id
```

**Parameters**
- `id` (string, UUID) - Beneficiary ID

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "relationship": "Spouse",
    "trust_id": "trust_123",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### Create Beneficiary
```http
POST /api/beneficiaries
```

**Request Body**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-1234",
  "relationship": "Spouse",
  "trust_id": "trust_123"
}
```

**Required Fields**
- `name` (string)
- `email` (string)
- `relationship` (string)
- `trust_id` (string)

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "relationship": "Spouse",
    "trust_id": "trust_123",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### Update Beneficiary
```http
PUT /api/beneficiaries/:id
```

**Parameters**
- `id` (string, UUID) - Beneficiary ID

**Request Body** (partial update supported)
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "555-1234",
    "relationship": "Spouse",
    "trust_id": "trust_123",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z"
  }
}
```

### Delete Beneficiary
```http
DELETE /api/beneficiaries/:id
```

**Parameters**
- `id` (string, UUID) - Beneficiary ID

**Response (200 OK)**
```json
{
  "success": true,
  "message": "Beneficiary deleted successfully"
}
```

---

## Disputes

### Get All Disputes
```http
GET /api/disputes
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Payment Dispute",
      "description": "Issue with payment processing",
      "status": "open",
      "priority": "high",
      "trust_id": "trust_123",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Get Dispute by ID
```http
GET /api/disputes/:id
```

**Parameters**
- `id` (string, UUID) - Dispute ID

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Payment Dispute",
    "description": "Issue with payment processing",
    "status": "open",
    "priority": "high",
    "trust_id": "trust_123",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### Create Dispute
```http
POST /api/disputes
```

**Request Body**
```json
{
  "title": "Payment Dispute",
  "description": "Issue with payment processing",
  "status": "open",
  "priority": "high",
  "trust_id": "trust_123"
}
```

**Required Fields**
- `title` (string)
- `description` (string)
- `status` (enum: "open" | "in_progress" | "resolved" | "closed")
- `priority` (enum: "low" | "medium" | "high" | "critical")
- `trust_id` (string)

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Payment Dispute",
    "description": "Issue with payment processing",
    "status": "open",
    "priority": "high",
    "trust_id": "trust_123",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### Update Dispute
```http
PUT /api/disputes/:id
```

**Parameters**
- `id` (string, UUID) - Dispute ID

**Request Body** (partial update supported)
```json
{
  "status": "resolved",
  "description": "Issue has been resolved"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Payment Dispute",
    "description": "Issue has been resolved",
    "status": "resolved",
    "priority": "high",
    "trust_id": "trust_123",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z"
  }
}
```

### Delete Dispute
```http
DELETE /api/disputes/:id
```

**Parameters**
- `id` (string, UUID) - Dispute ID

**Response (200 OK)**
```json
{
  "success": true,
  "message": "Dispute deleted successfully"
}
```

---

## Billing Alerts

### Get All Billing Alerts
```http
GET /api/billing-alerts
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "amount": 1500.50,
      "due_date": "2024-12-31",
      "description": "Quarterly trust management fee",
      "status": "pending",
      "trust_id": "trust_123",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Get Billing Alert by ID
```http
GET /api/billing-alerts/:id
```

**Parameters**
- `id` (string, UUID) - Billing alert ID

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "amount": 1500.50,
    "due_date": "2024-12-31",
    "description": "Quarterly trust management fee",
    "status": "pending",
    "trust_id": "trust_123",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### Create Billing Alert
```http
POST /api/billing-alerts
```

**Request Body**
```json
{
  "amount": 1500.50,
  "due_date": "2024-12-31",
  "description": "Quarterly trust management fee",
  "status": "pending",
  "trust_id": "trust_123"
}
```

**Required Fields**
- `amount` (number, decimal)
- `due_date` (string, date format: YYYY-MM-DD)
- `description` (string)
- `status` (enum: "pending" | "paid" | "overdue" | "cancelled")
- `trust_id` (string)

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "amount": 1500.50,
    "due_date": "2024-12-31",
    "description": "Quarterly trust management fee",
    "status": "pending",
    "trust_id": "trust_123",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### Update Billing Alert
```http
PUT /api/billing-alerts/:id
```

**Parameters**
- `id` (string, UUID) - Billing alert ID

**Request Body** (partial update supported)
```json
{
  "status": "paid",
  "amount": 1600.00
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "amount": 1600.00,
    "due_date": "2024-12-31",
    "description": "Quarterly trust management fee",
    "status": "paid",
    "trust_id": "trust_123",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z"
  }
}
```

### Delete Billing Alert
```http
DELETE /api/billing-alerts/:id
```

**Parameters**
- `id` (string, UUID) - Billing alert ID

**Response (200 OK)**
```json
{
  "success": true,
  "message": "Billing alert deleted successfully"
}
```

---

## Error Responses

All error responses follow this format:

**4xx Client Errors**
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

**5xx Server Errors**
```json
{
  "success": false,
  "error": "Internal server error message"
}
```

### Common HTTP Status Codes
- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error
