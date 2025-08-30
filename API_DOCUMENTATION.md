# Travectio API Documentation

## Base URL
```
Development: http://localhost:5000
Production: https://your-domain.replit.app
```

## Authentication
All API endpoints require authentication via OpenID Connect sessions. Users must be logged in to access protected routes.

---

## Authentication Endpoints

### `GET /api/auth/user`
Get current authenticated user information.

**Response:**
```json
{
  "id": "45506370",
  "email": "rrivera@travectiosolutions.com",
  "firstName": "Roberto",
  "lastName": "Rivera",
  "isFounder": true,
  "isAdmin": true,
  "createdAt": "2024-07-25T20:35:00Z"
}
```

### `POST /api/auth/logout`
Logout current user and destroy session.

---

## Fleet Management Endpoints

### `GET /api/trucks`
Get all trucks for the authenticated user.

**Response:**
```json
[
  {
    "id": "681a5e52-1abe-4d9b-ae42-4fa05afe0b83",
    "userId": "45506370",
    "name": "Big Purple",
    "fixedCosts": 1200.00,
    "variableCosts": 1800.00,
    "totalMiles": 125000,
    "isActive": 1,
    "vin": "1HGBH41JXMN109186",
    "licensePlate": "TX-123ABC",
    "currentDriverId": "driver-123",
    "equipmentType": "Dry Van",
    "loadBoardIntegration": "manual",
    "elogsIntegration": "manual"
  }
]
```

### `POST /api/trucks`
Create a new truck.

**Request Body:**
```json
{
  "name": "Big Blue",
  "fixedCosts": 1200.00,
  "variableCosts": 1800.00,
  "equipmentType": "Reefer",
  "vin": "1HGBH41JXMN109187",
  "licensePlate": "TX-456DEF"
}
```

### `PUT /api/trucks/:id`
Update an existing truck.

### `DELETE /api/trucks/:id`
Delete a truck.

---

## Driver Management

### `GET /api/drivers`
Get all drivers for the authenticated user.

**Response:**
```json
[
  {
    "id": "driver-123",
    "userId": "45506370",
    "name": "Marty Rodriguez",
    "licenseNumber": "DL123456789",
    "phoneNumber": "+1-555-0123",
    "email": "marty@example.com",
    "isActive": 1,
    "currentTruckId": "681a5e52-1abe-4d9b-ae42-4fa05afe0b83"
  }
]
```

### `POST /api/drivers`
Create a new driver.

### `PUT /api/drivers/:id`
Update driver information.

### `DELETE /api/drivers/:id`
Remove a driver.

---

## Load Management

### `GET /api/loads`
Get all loads for the authenticated user.

**Response:**
```json
[
  {
    "id": "load-123",
    "userId": "45506370",
    "truckId": "681a5e52-1abe-4d9b-ae42-4fa05afe0b83",
    "origin": "Dallas, TX",
    "destination": "Houston, TX",
    "pickupDate": "2024-08-10T08:00:00Z",
    "deliveryDate": "2024-08-10T18:00:00Z",
    "loadPay": 1250.00,
    "miles": 240,
    "deadheadMiles": 50,
    "status": "delivered",
    "profit": 185.20
  }
]
```

### `POST /api/loads`
Create a new load.

**Request Body:**
```json
{
  "truckId": "681a5e52-1abe-4d9b-ae42-4fa05afe0b83",
  "origin": "Dallas, TX",
  "destination": "Houston, TX",
  "pickupDate": "2024-08-10T08:00:00Z",
  "deliveryDate": "2024-08-10T18:00:00Z",
  "loadPay": 1250.00,
  "miles": 240
}
```

### `PUT /api/loads/:id`
Update load information.

### `DELETE /api/loads/:id`
Delete a load.

---

## Analytics Endpoints

### `GET /api/metrics`
Get fleet performance metrics.

**Response:**
```json
{
  "costPerMile": 5.24,
  "totalLoads": 15,
  "activeTrucks": 4,
  "totalRevenue": 18750.00,
  "totalProfit": 3250.00,
  "averageLoadPay": 1250.00,
  "profitMargin": 17.33
}
```

### `GET /api/fleet-summary`
Get comprehensive fleet summary.

**Response:**
```json
{
  "fleetSize": "small",
  "totalTrucks": 4,
  "activeTrucks": 4,
  "totalDrivers": 4,
  "totalLoads": 15,
  "weeklyRevenue": 5000.00,
  "weeklyProfit": 850.00,
  "utilizationRate": 85.5
}
```

### `GET /api/analytics/fleet`
Get detailed fleet analytics with time filtering.

**Query Parameters:**
- `period`: `week` | `month` | `quarter` | `year`
- `startDate`: ISO date string
- `endDate`: ISO date string

**Response:**
```json
{
  "period": "week",
  "metrics": {
    "revenue": 5000.00,
    "costs": 4150.00,
    "profit": 850.00,
    "miles": 1200,
    "loads": 5,
    "costPerMile": 3.46
  },
  "trends": {
    "revenueChange": 12.5,
    "profitChange": 8.3,
    "milesChange": -2.1
  }
}
```

---

## Cost Analysis

### `GET /api/trucks/:id/cost-breakdown`
Get detailed cost breakdown for a specific truck.

**Response:**
```json
{
  "truckId": "681a5e52-1abe-4d9b-ae42-4fa05afe0b83",
  "weekStarting": "2024-08-05T00:00:00Z",
  "fixedCosts": {
    "truckPayment": 300.00,
    "insurance": 250.00,
    "elogSubscription": 25.00,
    "total": 1200.00
  },
  "variableCosts": {
    "fuel": 800.00,
    "maintenance": 200.00,
    "tolls": 50.00,
    "total": 1800.00
  },
  "totalWeeklyCosts": 3000.00,
  "milesThisWeek": 1200,
  "costPerMile": 2.50
}
```

---

## User Management (Founder Only)

### `GET /api/admin/users`
Get all system users (founder access only).

**Response:**
```json
[
  {
    "id": "45506370",
    "email": "rrivera@travectiosolutions.com",
    "firstName": "Roberto",
    "lastName": "Rivera",
    "isFounder": true,
    "isAdmin": true,
    "isActive": true,
    "createdAt": "2024-07-25T20:35:00Z",
    "lastLogin": "2024-08-09T16:30:00Z"
  }
]
```

### `PUT /api/admin/users/:id/status`
Update user account status (activate/deactivate).

---

## Session Management

### `GET /api/admin/sessions`
Get active system sessions (founder access only).

**Response:**
```json
[
  {
    "sessionId": "sess_123456",
    "userId": "45506370",
    "userEmail": "rrivera@travectiosolutions.com",
    "createdAt": "2024-08-09T15:00:00Z",
    "lastAccess": "2024-08-09T16:30:00Z",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0..."
  }
]
```

### `DELETE /api/admin/sessions/:sessionId`
Terminate a specific session.

---

## Data Export

### `GET /api/export/fleet-data`
Export complete fleet data for backup purposes.

**Query Parameters:**
- `format`: `json` | `csv`
- `tables`: Comma-separated list of table names

---

## Error Responses

All endpoints return standardized error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error details",
  "timestamp": "2024-08-09T16:30:00Z"
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- 100 requests per minute per user
- 1000 requests per hour per user
- Admin endpoints: 50 requests per minute

---

## Data Types

### Truck Equipment Types
- `"Dry Van"`
- `"Reefer"`
- `"Flatbed"`

### Load Status
- `"pending"`
- `"in_transit"`
- `"delivered"`
- `"cancelled"`

### User Roles
- `isFounder`: Boolean - Complete system access
- `isAdmin`: Boolean - Administrative privileges
- Regular users: Fleet-specific access only

---

This API documentation covers all major endpoints in the Travectio Fleet Management System. For implementation details, refer to `server/routes.ts`.