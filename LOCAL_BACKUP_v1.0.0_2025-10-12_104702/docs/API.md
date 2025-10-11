# WaxValue API Documentation

## Overview

WaxValue provides a comprehensive REST API for managing Discogs pricing automation. The API follows RESTful principles and uses JSON for data exchange.

## Base URL

- **Development**: `http://localhost:8000`
- **Production**: `https://api.waxvalue.com`

## Authentication

WaxValue uses JWT-based authentication for API access and OAuth 1.0a for Discogs integration.

### JWT Authentication

Include the JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Discogs OAuth 1.0a

The application uses OAuth 1.0a to securely connect with Discogs without storing user credentials.

## API Endpoints

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "token": "jwt-token"
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "string",
    "email": "string",
    "discogsUserId": 12345,
    "discogsUsername": "string"
  },
  "token": "jwt-token"
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "username": "string",
  "email": "string",
  "discogsUserId": 12345,
  "discogsUsername": "string",
  "firstName": "string",
  "lastName": "string",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Discogs OAuth Endpoints

#### Setup Discogs Authentication
```http
POST /auth/setup
Authorization: Bearer <token>
```

**Response:**
```json
{
  "authUrl": "https://www.discogs.com/oauth/authorize?oauth_token=...",
  "requestToken": "request-token",
  "requestTokenSecret": "request-token-secret"
}
```

#### Verify Discogs Authentication
```http
POST /auth/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "requestToken": "string",
  "verifierCode": "string"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "discogsUserId": 12345,
    "discogsUsername": "string"
  },
  "discogsUser": {
    "username": "string",
    "id": 12345
  }
}
```

#### Disconnect Discogs
```http
POST /auth/disconnect
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Account disconnected successfully"
}
```

### Dashboard Endpoints

#### Get Dashboard Summary
```http
GET /dashboard/summary
Authorization: Bearer <token>
```

**Response:**
```json
{
  "totalListings": 150,
  "suggestedUpdates": 25,
  "averageDelta": 8.5,
  "lastRunDate": "2024-01-01T09:00:00Z",
  "isRunning": false
}
```

### Inventory Endpoints

#### Get Pricing Suggestions
```http
GET /inventory/suggestions
Authorization: Bearer <token>
```

**Response:**
```json
{
  "suggestions": [
    {
      "listingId": 123456,
      "currentPrice": 25.00,
      "suggestedPrice": 28.50,
      "basis": "Median + 14%",
      "confidence": "high",
      "reasoning": "Market data shows strong demand",
      "condition": "Very Good Plus",
      "sleeveCondition": "Very Good",
      "marketData": {
        "median": 25.00,
        "mean": 26.20,
        "min": 20.00,
        "max": 35.00,
        "count": 12,
        "scarcity": "medium"
      },
      "release": {
        "title": "Sample Release",
        "images": [
          {
            "uri150": "https://img.discogs.com/..."
          }
        ]
      },
      "artist": {
        "name": "Sample Artist"
      }
    }
  ]
}
```

#### Apply Price Suggestion
```http
POST /inventory/apply
Authorization: Bearer <token>
Content-Type: application/json

{
  "listingId": 123456
}
```

**Response:**
```json
{
  "success": true,
  "message": "Price updated successfully",
  "data": {
    "listingId": 123456,
    "oldPrice": 25.00,
    "newPrice": 28.50,
    "status": "For Sale"
  }
}
```

#### Decline Price Suggestion
```http
POST /inventory/decline
Authorization: Bearer <token>
Content-Type: application/json

{
  "listingId": 123456
}
```

**Response:**
```json
{
  "message": "Price suggestion declined"
}
```

#### Update Listing Price
```http
POST /inventory/update-price
Authorization: Bearer <token>
Content-Type: application/json

{
  "listingId": 123456,
  "newPrice": 30.00
}
```

**Response:**
```json
{
  "success": true,
  "message": "Price updated successfully",
  "data": {
    "listingId": 123456,
    "oldPrice": 25.00,
    "newPrice": 30.00,
    "status": "For Sale"
  }
}
```

### Strategy Endpoints

#### Get Strategies
```http
GET /strategies
Authorization: Bearer <token>
```

**Response:**
```json
{
  "strategies": [
    {
      "id": 1,
      "name": "Conservative",
      "description": "Stay slightly below market median",
      "anchor": "median",
      "offsetType": "percentage",
      "offsetValue": -5.0,
      "conditionWeights": {
        "media": 0.8,
        "sleeve": 0.2
      },
      "scarcityBoost": null,
      "floor": 5.00,
      "ceiling": 500.00,
      "rounding": 0.50,
      "maxChangePercent": 15,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Create Strategy
```http
POST /strategies/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Custom Strategy",
  "anchor": "median",
  "offsetType": "percentage",
  "offsetValue": 10.0,
  "conditionWeights": {
    "media": 0.7,
    "sleeve": 0.3
  },
  "scarcityBoost": {
    "threshold": 5,
    "boostPercent": 20
  },
  "floor": 10.00,
  "ceiling": 1000.00,
  "rounding": 0.25,
  "maxChangePercent": 25,
  "isActive": false
}
```

**Response:**
```json
{
  "strategy": {
    "id": 2,
    "name": "Custom Strategy",
    "anchor": "median",
    "offsetType": "percentage",
    "offsetValue": 10.0,
    "conditionWeights": {
      "media": 0.7,
      "sleeve": 0.3
    },
    "scarcityBoost": {
      "threshold": 5,
      "boostPercent": 20
    },
    "floor": 10.00,
    "ceiling": 1000.00,
    "rounding": 0.25,
    "maxChangePercent": 25,
    "isActive": false,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "message": "Strategy created successfully"
}
```

#### Preview Strategy
```http
POST /strategies/preview
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Preview Strategy",
  "anchor": "median",
  "offsetType": "percentage",
  "offsetValue": 8.0,
  "conditionWeights": {
    "media": 0.6,
    "sleeve": 0.4
  }
}
```

**Response:**
```json
{
  "preview": [
    {
      "title": "Sample Release 1",
      "artist": "Sample Artist",
      "currentPrice": 25.00,
      "suggestedPrice": 27.00,
      "basis": "Median + 8%"
    },
    {
      "title": "Sample Release 2",
      "artist": "Another Artist",
      "currentPrice": 15.00,
      "suggestedPrice": 16.20,
      "basis": "Median + 8%"
    }
  ]
}
```

#### Apply Strategy Globally
```http
POST /strategies/apply-globally
Authorization: Bearer <token>
Content-Type: application/json

{
  "strategyId": 1
}
```

**Response:**
```json
{
  "message": "Strategy applied globally",
  "strategyId": 1
}
```

### Logs Endpoints

#### Get Run Logs
```http
GET /logs
Authorization: Bearer <token>
```

**Response:**
```json
{
  "logs": [
    {
      "id": "run_123",
      "userId": 1,
      "runDate": "2024-01-01T09:00:00Z",
      "isDryRun": true,
      "itemsScanned": 25,
      "itemsUpdated": 0,
      "itemsSkipped": 5,
      "errors": 0,
      "status": "completed",
      "strategyName": "Conservative",
      "durationSeconds": 45.2
    }
  ]
}
```

#### Get Run Snapshots
```http
GET /logs/{run_id}/snapshots
Authorization: Bearer <token>
```

**Response:**
```json
{
  "snapshots": [
    {
      "id": "snapshot_123",
      "runLogId": "run_123",
      "listingId": 123456,
      "beforePrice": 25.00,
      "suggestedPrice": 23.75,
      "decision": "applied",
      "confidence": "high",
      "reasoning": "Median - 5% with high confidence",
      "marketData": {
        "median": 25.00,
        "mean": 25.80,
        "min": 20.00,
        "max": 35.00,
        "count": 12,
        "scarcity": "medium"
      }
    }
  ]
}
```

### Metrics Endpoints

#### Get Portfolio Metrics
```http
GET /metrics/portfolio
Authorization: Bearer <token>
```

**Response:**
```json
{
  "totalListings": 150,
  "belowP25": 25,
  "betweenP25P75": 100,
  "aboveP75": 25,
  "averageDelta": 8.5,
  "underpriced": 30,
  "overpriced": 20
}
```

#### Get Trend Metrics
```http
GET /metrics/trends
Authorization: Bearer <token>
```

**Response:**
```json
{
  "trends": [
    {
      "date": "2024-01-01",
      "userAverage": 25.50,
      "marketMedian": 24.80
    },
    {
      "date": "2024-01-02",
      "userAverage": 26.20,
      "marketMedian": 25.10
    }
  ]
}
```

#### Get Distribution Metrics
```http
GET /metrics/distribution
Authorization: Bearer <token>
```

**Response:**
```json
{
  "distribution": [
    {
      "priceRange": "$0-10",
      "count": 15,
      "userListings": 5
    },
    {
      "priceRange": "$10-25",
      "count": 45,
      "userListings": 20
    },
    {
      "priceRange": "$25-50",
      "count": 30,
      "userListings": 15
    }
  ]
}
```

### Settings Endpoints

#### Get User Settings
```http
GET /settings
Authorization: Bearer <token>
```

**Response:**
```json
{
  "currency": "USD",
  "defaultDryRun": true,
  "dailySchedule": "09:00",
  "globalFloor": 5.00,
  "globalCeiling": 1000.00,
  "maxChangePercent": 25,
  "apiRateLimitSeconds": 1.2,
  "logRetentionDays": 90,
  "autoUpdateIncreases": false,
  "alertThreshold": 25
}
```

#### Update User Settings
```http
POST /settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "currency": "EUR",
  "defaultDryRun": false,
  "dailySchedule": "10:00",
  "globalFloor": 10.00,
  "globalCeiling": 500.00,
  "maxChangePercent": 30,
  "autoUpdateIncreases": true,
  "alertThreshold": 20
}
```

**Response:**
```json
{
  "message": "Settings updated successfully"
}
```

### Simulation Endpoints

#### Run Simulation
```http
POST /simulate
Authorization: Bearer <token>
Content-Type: application/json

{
  "scope": "global",
  "strategyId": 1,
  "params": {
    "offsetValue": 8
  }
}
```

**Response:**
```json
{
  "id": "sim_123",
  "userId": 1,
  "runDate": "2024-01-01T09:00:00Z",
  "isDryRun": true,
  "totalListings": 25,
  "suggestedUpdates": 15,
  "averageDelta": 8.5,
  "suggestions": [
    {
      "listingId": 123456,
      "currentPrice": 25.00,
      "suggestedPrice": 27.00,
      "basis": "Median + 8%",
      "confidence": "high",
      "reasoning": "Strong market data support"
    }
  ],
  "status": "completed"
}
```

#### Reprice Inventory
```http
POST /reprice
Authorization: Bearer <token>
Content-Type: application/json

{
  "scope": "global",
  "approvedListingIds": [123456, 123457],
  "strategyId": 1,
  "params": {
    "offsetValue": 8
  }
}
```

**Response:**
```json
{
  "runId": 123,
  "dryRun": false,
  "summary": {
    "scanned": 25,
    "autoApplied": 5,
    "userApplied": 10,
    "flagged": 3,
    "declined": 2,
    "errors": 0
  },
  "items": [
    {
      "listingId": 123456,
      "oldPrice": 25.00,
      "newPrice": 27.00,
      "currency": "USD",
      "decision": "user_applied",
      "reason": "Approved by user",
      "confidence": 0.85,
      "discogsStatus": "For Sale",
      "httpStatus": 200,
      "ratelimitRemaining": "1199",
      "ratelimitReset": "2024-01-01T10:00:00Z"
    }
  ]
}
```

## Error Handling

All API endpoints return appropriate HTTP status codes and error messages:

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error

### Error Response Format

```json
{
  "status": "error",
  "error": "Error type",
  "detail": "Detailed error message"
}
```

### Common Error Examples

#### Validation Error
```json
{
  "status": "error",
  "error": "Validation Error",
  "detail": "Username is required"
}
```

#### Authentication Error
```json
{
  "status": "error",
  "error": "Authentication Error",
  "detail": "Invalid or expired token"
}
```

#### Discogs API Error
```json
{
  "status": "error",
  "error": "Discogs API Error",
  "detail": "Rate limit exceeded. Please try again later."
}
```

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Authentication endpoints**: 10 requests per minute
- **General endpoints**: 100 requests per minute
- **Discogs integration**: Respects Discogs API limits (60 requests per minute)

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2024-01-01T10:00:00Z
```

## Data Models

### User
```typescript
interface User {
  id: number;
  username: string;
  email: string;
  discogsUserId?: number;
  discogsUsername?: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Strategy
```typescript
interface Strategy {
  id: number;
  userId: number;
  name: string;
  anchor: 'mean' | 'median' | 'mode' | 'cheapest' | 'most_expensive' | 'percentile';
  offsetType: 'percentage' | 'fixed';
  offsetValue: number;
  conditionWeights: {
    media: number;
    sleeve: number;
  };
  scarcityBoost?: {
    threshold: number;
    boostPercent: number;
  };
  floor?: number;
  ceiling?: number;
  rounding: number;
  maxChangePercent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### PriceSuggestion
```typescript
interface PriceSuggestion {
  listingId: number;
  currentPrice: number;
  suggestedPrice: number;
  basis: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  condition: string;
  sleeveCondition: string;
  marketData: {
    median: number;
    mean: number;
    min: number;
    max: number;
    count: number;
    p25: number;
    p75: number;
    p90: number;
    scarcity: 'high' | 'medium' | 'low';
  };
  release?: {
    title: string;
    images?: Array<{
      uri150: string;
    }>;
  };
  artist?: {
    name: string;
  };
}
```

## Webhooks

WaxValue supports webhooks for real-time notifications:

### Webhook Events

- `run.completed` - Pricing run completed
- `price.updated` - Price successfully updated
- `error.occurred` - Error during processing

### Webhook Payload

```json
{
  "event": "run.completed",
  "timestamp": "2024-01-01T09:00:00Z",
  "data": {
    "runId": 123,
    "userId": 1,
    "itemsScanned": 25,
    "itemsUpdated": 15,
    "status": "completed"
  }
}
```

## SDKs and Libraries

### JavaScript/TypeScript
```bash
npm install @waxvalue/api-client
```

```typescript
import { WaxValueClient } from '@waxvalue/api-client';

const client = new WaxValueClient({
  baseUrl: 'https://api.waxvalue.com',
  token: 'your-jwt-token'
});

const suggestions = await client.inventory.getSuggestions();
```

### Python
```bash
pip install waxvalue-api
```

```python
from waxvalue import WaxValueClient

client = WaxValueClient(
    base_url='https://api.waxvalue.com',
    token='your-jwt-token'
)

suggestions = client.inventory.get_suggestions()
```

## Support

For API support and questions:

- **Documentation**: [https://docs.waxvalue.com](https://docs.waxvalue.com)
- **Status Page**: [https://status.waxvalue.com](https://status.waxvalue.com)
- **Support Email**: api-support@waxvalue.com
- **GitHub Issues**: [https://github.com/deepdesign/waxvalue/issues](https://github.com/deepdesign/waxvalue/issues)
