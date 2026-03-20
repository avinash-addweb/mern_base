# Base Schema & Log Levels

[Back to Overview](./README.md)

---

## Base Schema (All Log Types)

Every log entry **MUST** include these core fields:

| Field             | Type            | Required    | Description                                                            |
| ----------------- | --------------- | ----------- | ---------------------------------------------------------------------- |
| `timestamp`       | ISO 8601 string | **Yes**     | When the event occurred (e.g., `2026-01-22T10:30:00.123Z`)             |
| `level`           | enum            | **Yes**     | One of: `Verbose`, `Debug`, `Information`, `Warning`, `Error`, `Fatal` |
| `message`         | string          | **Yes**     | Human-readable description of the event                                |
| `service`         | string          | **Yes**     | Application/microservice name (e.g., `user-service`, `payment-api`)    |
| `environment`     | string          | **Yes**     | Deployment environment (e.g., `production`, `staging`, `development`)  |
| `traceId`         | string          | Recommended | Distributed tracing correlation ID                                     |
| `spanId`          | string          | Optional    | Span ID for distributed tracing                                        |
| `messageTemplate` | string          | Optional    | Structured log template (e.g., `User {UserId} logged in`)              |
| `properties`      | object          | Optional    | Additional custom fields (level-specific and business data)            |

---

## Log Levels

### 1. Verbose

**Purpose:** Extremely detailed diagnostic information, typically only enabled during development or debugging specific issues.

**Mandatory Fields:** Base fields only

**Recommended Additional Fields (in `properties`):**

| Field        | Type   | Description             |
| ------------ | ------ | ----------------------- |
| `method`     | string | Method/function name    |
| `class`      | string | Class/module name       |
| `lineNumber` | number | Source code line number |

**Example:**

```json
{
  "timestamp": "2026-01-22T10:30:00.123Z",
  "level": "Verbose",
  "message": "Entering calculateDiscount with amount=150.00",
  "service": "pricing-service",
  "environment": "development",
  "properties": {
    "method": "calculateDiscount",
    "class": "PricingEngine",
    "inputParams": { "amount": 150.0, "customerId": "C123" }
  }
}
```

---

### 2. Debug

**Purpose:** Detailed debugging information useful during development.

**Mandatory Fields:** Base fields only

**Recommended Additional Fields (in `properties`):**

| Field      | Type   | Description                    |
| ---------- | ------ | ------------------------------ |
| `method`   | string | Method/function name           |
| `module`   | string | Module/component name          |
| `duration` | number | Execution time in milliseconds |

**Example:**

```json
{
  "timestamp": "2026-01-22T10:30:00.456Z",
  "level": "Debug",
  "message": "Cache lookup for key user:123",
  "service": "user-service",
  "environment": "staging",
  "traceId": "abc123def456",
  "properties": {
    "module": "CacheManager",
    "cacheKey": "user:123",
    "cacheHit": true,
    "duration": 2
  }
}
```

---

### 3. Information

**Purpose:** General operational events, business activities, and application flow.

**Mandatory Fields:**

| Field       | Type   | Required | Description                         |
| ----------- | ------ | -------- | ----------------------------------- |
| Base fields | -      | **Yes**  | All base schema fields              |
| `eventType` | string | **Yes**  | Category of event (in `properties`) |

**Recommended Additional Fields (in `properties`):**

| Field        | Type   | Description                                          |
| ------------ | ------ | ---------------------------------------------------- |
| `userId`     | string | User identifier (if user-related)                    |
| `entityId`   | string | Primary entity ID (orderId, productId, etc.)         |
| `entityType` | string | Type of entity (Order, User, Product, etc.)          |
| `action`     | string | Action performed (created, updated, deleted, viewed) |
| `duration`   | number | Operation duration in milliseconds                   |
| `metadata`   | object | Additional business context                          |

**Example:**

```json
{
  "timestamp": "2026-01-22T10:30:01.789Z",
  "level": "Information",
  "message": "Order ORD-456 created successfully for user U-123",
  "messageTemplate": "Order {OrderId} created successfully for user {UserId}",
  "service": "order-service",
  "environment": "production",
  "traceId": "abc123def456",
  "properties": {
    "eventType": "ORDER_CREATED",
    "userId": "U-123",
    "entityId": "ORD-456",
    "entityType": "Order",
    "action": "created",
    "orderTotal": 299.99,
    "itemCount": 3
  }
}
```

---

### 4. Warning

**Purpose:** Potentially harmful situations, degraded performance, or recoverable issues.

**Mandatory Fields:**

| Field         | Type   | Required | Description                                                 |
| ------------- | ------ | -------- | ----------------------------------------------------------- |
| Base fields   | -      | **Yes**  | All base schema fields                                      |
| `warningCode` | string | **Yes**  | Unique warning identifier (in `properties`)                 |
| `component`   | string | **Yes**  | Component/module where warning originated (in `properties`) |

**Recommended Additional Fields (in `properties`):**

| Field            | Type          | Description                           |
| ---------------- | ------------- | ------------------------------------- |
| `threshold`      | number/string | Threshold that triggered the warning  |
| `currentValue`   | number/string | Current value that caused the warning |
| `recommendation` | string        | Suggested action to resolve           |
| `affectedEntity` | string        | Entity affected by the warning        |

**Example:**

```json
{
  "timestamp": "2026-01-22T10:30:02.123Z",
  "level": "Warning",
  "message": "API rate limit at 85% for client APP-789",
  "service": "api-gateway",
  "environment": "production",
  "traceId": "abc123def456",
  "properties": {
    "warningCode": "RATE_LIMIT_APPROACHING",
    "component": "RateLimiter",
    "clientId": "APP-789",
    "threshold": 1000,
    "currentValue": 850,
    "windowMinutes": 15,
    "recommendation": "Consider upgrading rate limit tier"
  }
}
```

---

### 5. Error

**Purpose:** Error events that allow the application to continue running.

**Mandatory Fields:**

| Field       | Type   | Required | Description                                             |
| ----------- | ------ | -------- | ------------------------------------------------------- |
| Base fields | -      | **Yes**  | All base schema fields                                  |
| `errorCode` | string | **Yes**  | Unique error identifier (in `properties`)               |
| `errorType` | string | **Yes**  | Error category (in `properties`)                        |
| `component` | string | **Yes**  | Component/module where error occurred (in `properties`) |

**Standard Error Types:**

- `DatabaseError` - Database connection or query failures
- `ValidationError` - Input validation failures
- `NetworkError` - Network/HTTP failures
- `AuthenticationError` - Auth failures
- `AuthorizationError` - Permission denied
- `PaymentError` - Payment processing failures
- `IntegrationError` - Third-party service failures
- `TimeoutError` - Operation timeouts
- `ConfigurationError` - Configuration issues

**Recommended Additional Fields (in `properties`):**

| Field          | Type    | Description                                                  |
| -------------- | ------- | ------------------------------------------------------------ |
| `exception`    | string  | Full exception/stack trace (use top-level `exception` field) |
| `errorMessage` | string  | Technical error message                                      |
| `userId`       | string  | Affected user (if applicable)                                |
| `requestId`    | string  | Request identifier                                           |
| `inputData`    | object  | Input that caused the error (sanitized - no PII)             |
| `retryable`    | boolean | Whether the operation can be retried                         |
| `httpStatus`   | number  | HTTP status code (for API errors)                            |

**Example:**

```json
{
  "timestamp": "2026-01-22T10:30:03.456Z",
  "level": "Error",
  "message": "Failed to process payment for order ORD-456",
  "service": "payment-service",
  "environment": "production",
  "traceId": "abc123def456",
  "exception": "PaymentGatewayException: Connection timeout\n  at PaymentProcessor.process()\n  at OrderService.checkout()",
  "properties": {
    "errorCode": "ERR_PAYMENT_GATEWAY_TIMEOUT",
    "errorType": "PaymentError",
    "component": "PaymentProcessor",
    "orderId": "ORD-456",
    "userId": "U-123",
    "paymentMethod": "credit_card",
    "amount": 299.99,
    "gatewayResponseTime": 30000,
    "retryable": true,
    "httpStatus": 504
  }
}
```

---

### 6. Fatal

**Purpose:** Critical errors that cause the application to abort or require immediate attention.

**Mandatory Fields:**

| Field       | Type   | Required | Description                                                   |
| ----------- | ------ | -------- | ------------------------------------------------------------- |
| Base fields | -      | **Yes**  | All base schema fields                                        |
| `errorCode` | string | **Yes**  | Unique error identifier (in `properties`)                     |
| `errorType` | string | **Yes**  | Error category (in `properties`)                              |
| `component` | string | **Yes**  | Component/module where fatal error occurred (in `properties`) |
| `severity`  | string | **Yes**  | Impact level (in `properties`)                                |

**Severity Levels:**

- `CRITICAL` - Immediate action required, service degraded
- `SYSTEM_DOWN` - Service completely unavailable
- `DATA_LOSS_RISK` - Potential for data loss or corruption

**Recommended Additional Fields (in `properties`):**

| Field                     | Type     | Description                              |
| ------------------------- | -------- | ---------------------------------------- |
| `exception`               | string   | Full exception/stack trace               |
| `systemState`             | object   | System metrics at time of failure        |
| `affectedServices`        | string[] | List of dependent services affected      |
| `lastSuccessfulOperation` | string   | Last successful operation before failure |
| `recoveryAction`          | string   | Recommended recovery steps               |

**Example:**

```json
{
  "timestamp": "2026-01-22T10:30:04.789Z",
  "level": "Fatal",
  "message": "Database connection pool exhausted - service cannot process requests",
  "service": "order-service",
  "environment": "production",
  "traceId": "abc123def456",
  "exception": "PoolExhaustedException: No available connections\n  at ConnectionPool.acquire()\n  at DatabaseService.query()",
  "properties": {
    "errorCode": "FATAL_DB_POOL_EXHAUSTED",
    "errorType": "DatabaseError",
    "component": "ConnectionPool",
    "severity": "CRITICAL",
    "systemState": {
      "activeConnections": 100,
      "maxConnections": 100,
      "waitingRequests": 250,
      "memoryUsageMB": 1024,
      "cpuPercent": 95
    },
    "affectedServices": ["order-service", "inventory-service", "shipping-service"],
    "lastSuccessfulOperation": "2026-01-22T10:29:58.000Z",
    "recoveryAction": "Restart service and increase connection pool size"
  }
}
```
