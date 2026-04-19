# 🚀 SintraPrime Router Microservice — Deployment Guide

Complete guide for deploying and using the Gmail → Normalizer → Router → Make.com microservice.

---

## 📋 Overview

The **SintraPrime Router Microservice** is the "brain" behind your enforcement orchestration. It:

1. **Receives** raw Gmail messages from Make.com
2. **Normalizes** them into a standardized format
3. **Routes** them using intelligent creditor/risk detection
4. **Returns** routing decisions back to Make.com for workflow branching

```
[Gmail via Make.com]
        ↓
[Normalizer] → Standardizes the Gmail payload  
        ↓
[Router v1] → Chooses the enforcement route  
        ↓
[Make.com] → Branches flows, Slack, Notion, SintraPrime, etc.
```

---

## 🏗️ Architecture

### Components

1. **normalizer-gmail.js** - Converts raw Gmail API payloads to NormalizedMessage format
2. **sintraprime-router-v1.js** - Core routing logic with creditor detection & risk scoring
3. **router-microservice.ts** - Express server with REST API endpoints
4. **router-server.ts** - Standalone server launcher

### File Structure

```
src/
├── utils/
│   ├── normalizer-gmail.js          # Gmail payload normalizer
│   └── sintraprime-router-v1.js     # Core routing engine
├── services/
│   └── router-microservice.ts        # Express API service
└── router-server.ts                  # Standalone server
```

---

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start development server (with hot reload)
npm run router:dev

# Or build and start production server
npm run build
npm run router:start
```

### Test the Server

```bash
# Health check
curl http://localhost:3001/health

# Test with a sample message
curl -X POST http://localhost:3001/test-router \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test_001",
    "from": "noreply@verizonwireless.com",
    "to": ["enforcement@howardtrust.com"],
    "subject": "FINAL NOTICE: Account Suspension",
    "bodyText": "Your account will be suspended due to past due balance.",
    "date": "2025-12-08T10:00:00Z"
  }'
```

---

## 📡 API Endpoints

### 1. Health Check

**GET /health**

Returns service status and version.

**Response:**
```json
{
  "status": "OK",
  "service": "SintraPrime Orchestration Router v1",
  "version": "1.0.0",
  "timestamp": "2025-12-08T10:00:00Z"
}
```

---

### 2. Route Single Email

**POST /route-email**

Main endpoint that Make.com will call. Accepts raw Gmail message, normalizes it, routes it, and returns the routing decision.

**Request Body:** Raw Gmail API message object (see Gmail API documentation)

**Example Request:**
```bash
curl -X POST https://your-server.com/route-email \
  -H "Content-Type: application/json" \
  -d @gmail-message.json
```

**Response:**
```json
{
  "ok": true,
  "route": "VERIZON_ENFORCEMENT",
  "data": {
    "dispatchTarget": "VERIZON_ENFORCEMENT",
    "creditor": "Verizon",
    "riskLevel": "high",
    "tags": ["creditor:verizon", "risk_keywords"],
    "matchedRules": ["VERIZON"],
    "reason": "Route: VERIZON_ENFORCEMENT | Creditor: Verizon | Risk: high | RiskKeywords: final notice, suspension, past due",
    "meta": {
      "dishonorPrediction": {
        "dishonorLikelihood": "low",
        "flags": []
      },
      "beneficiaryImpact": {
        "beneficiaryFlag": false,
        "severity": "none",
        "markers": []
      },
      "source": "gmail",
      "receivedAt": "2025-12-08T10:00:00Z"
    },
    "rawMessage": { /* original normalized message */ }
  },
  "meta": {
    "traceId": "route_1733659200000_abc123xyz",
    "timestamp": "2025-12-08T10:00:00.123Z",
    "processingTime": 45
  }
}
```

---

### 3. Route Multiple Emails (Batch)

**POST /route-email/batch**

Batch endpoint for processing multiple Gmail messages at once.

**Request Body:**
```json
{
  "messages": [
    { /* Gmail message 1 */ },
    { /* Gmail message 2 */ },
    { /* Gmail message 3 */ }
  ]
}
```

**Response:**
```json
{
  "ok": true,
  "total": 3,
  "successful": 3,
  "failed": 0,
  "results": [
    { "index": 0, "decision": { /* routing decision */ }, "error": null },
    { "index": 1, "decision": { /* routing decision */ }, "error": null },
    { "index": 2, "decision": { /* routing decision */ }, "error": null }
  ],
  "errors": [],
  "meta": {
    "traceId": "route_1733659200000_batch",
    "timestamp": "2025-12-08T10:00:00Z"
  }
}
```

---

### 4. Test Router

**POST /test-router**

Test endpoint for validating routing logic without Gmail payload. Accepts a pre-normalized message.

**Request Body:** NormalizedMessage object
```json
{
  "id": "test_001",
  "from": "noreply@verizonwireless.com",
  "to": ["enforcement@howardtrust.com"],
  "subject": "FINAL NOTICE: Account Suspension",
  "bodyText": "Your account will be suspended in 48 hours due to past due balance.",
  "date": "2025-12-08T10:00:00Z"
}
```

**Response:**
```json
{
  "ok": true,
  "data": { /* routing decision */ },
  "meta": {
    "traceId": "route_1733659200000_test",
    "timestamp": "2025-12-08T10:00:00Z",
    "mode": "test"
  }
}
```

---

## 🔧 Make.com Integration

### Scenario Setup

#### Module 1: Gmail — Watch Messages

Configure Gmail module to watch for new messages:
- **Connection:** Your enforcement Gmail account
- **Folder:** INBOX (or specific label)
- **Limit:** 10 messages per execution

#### Module 2: HTTP — POST to Router

Send the Gmail message to your router microservice:

**URL:** `https://your-router-server.com/route-email`

**Method:** POST

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body:**
```
{{1}}
```
*Note: `{{1}}` passes the entire Gmail message object*

#### Module 3: Router — Branch by Decision

Add a Router module with filters based on the routing decision:

**Branch A: Verizon Enforcement**
```
Filter: {{2.data.dispatchTarget}} = "VERIZON_ENFORCEMENT"
```

**Branch B: IRS Enforcement**
```
Filter: {{2.data.dispatchTarget}} = "IRS_ENFORCEMENT"
```

**Branch C: Wells Fargo Enforcement**
```
Filter: {{2.data.dispatchTarget}} = "WELLS_FARGO_ENFORCEMENT"
```

**Branch D: Chase/EWS Enforcement**
```
Filter: {{2.data.dispatchTarget}} = "CHASE_EWS_ENFORCEMENT"
```

**Branch E: Dakota Financial Enforcement**
```
Filter: {{2.data.dispatchTarget}} = "DAKOTA_FINANCIAL_ENFORCEMENT"
```

**Branch F: TikTok Activity**
```
Filter: {{2.data.dispatchTarget}} = "TIKTOK_ACTIVITY"
```

**Branch G: General Inbox (Fallback)**
```
Filter: {{2.data.dispatchTarget}} = "GENERAL_INBOX"
```

#### Module 4+: Per-Branch Actions

For each branch, add appropriate actions:
- **Notion:** Log to creditor-specific database
- **Slack:** Alert to creditor-specific channel
- **HTTP:** Trigger creditor-specific workflow
- **Email:** Send automated responses
- **Supabase:** Create enforcement packets/disputes

### Example: Verizon Branch Actions

```
[Verizon Branch]
    ├─ Notion: Create Database Item
    │    Database: "Verizon Enforcement Log"
    │    Fields: Subject, From, Risk Level, Routing Decision, etc.
    │
    ├─ Slack: Create Message
    │    Channel: #verizon-enforcement
    │    Message: "🚨 High Risk Verizon Email: {{2.data.reason}}"
    │
    └─ HTTP: Trigger Verizon Workflow
         URL: https://your-server.com/workflows/verizon
         Body: {{2.data}}
```

---

## 🚀 Deployment Options

### Option 1: Railway.app (Recommended)

1. **Create new project** on Railway.app
2. **Connect GitHub repo**
3. **Add environment variables:**
   ```
   NODE_ENV=production
   ROUTER_PORT=3001
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_key
   ```
4. **Add build command:**
   ```
   npm install && npm run build
   ```
5. **Add start command:**
   ```
   npm run router:start
   ```
6. **Deploy** and note your public URL

### Option 2: Render.com

1. **Create new Web Service**
2. **Connect GitHub repo**
3. **Build command:** `npm install && npm run build`
4. **Start command:** `npm run router:start`
5. **Add environment variables**
6. **Deploy**

### Option 3: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "router:start"]
```

**Build and run:**
```bash
docker build -t sintraprime-router .
docker run -p 3001:3001 \
  -e NODE_ENV=production \
  -e SUPABASE_URL=your_url \
  -e SUPABASE_ANON_KEY=your_key \
  sintraprime-router
```

### Option 4: Cloudflare Workers (Advanced)

Requires adaptation to Cloudflare Workers API. Contact for assistance.

---

## 🔐 Environment Variables

```bash
# Server Configuration
NODE_ENV=production           # production | development
ROUTER_PORT=3001             # Port for router microservice
HOST=0.0.0.0                 # Host to bind to

# Database (for logging)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key

# Logging
LOG_LEVEL=info               # error | warn | info | debug

# Optional: Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
```

---

## 📊 Monitoring & Logging

### Built-in Logging

All routing decisions are automatically logged to `agent_logs` table in Supabase:

```typescript
{
  trace_id: "route_1733659200000_abc123xyz",
  level: "info",
  message: "Email routed: VERIZON_ENFORCEMENT",
  action: "route_email",
  metadata: {
    messageId: "msg_123",
    from: "noreply@verizonwireless.com",
    subject: "FINAL NOTICE",
    dispatchTarget: "VERIZON_ENFORCEMENT",
    creditor: "Verizon",
    riskLevel: "high",
    tags: ["creditor:verizon", "risk_keywords"],
    reason: "Route: VERIZON_ENFORCEMENT | ...",
    dishonorPrediction: { /* ... */ },
    beneficiaryImpact: { /* ... */ }
  }
}
```

### Query Logs

```sql
-- Recent routing decisions
SELECT * FROM agent_logs 
WHERE action = 'route_email' 
ORDER BY created_at DESC 
LIMIT 100;

-- High-risk routes
SELECT * FROM agent_logs 
WHERE action = 'route_email' 
  AND metadata->>'riskLevel' IN ('high', 'critical')
ORDER BY created_at DESC;

-- Verizon-specific routes
SELECT * FROM agent_logs 
WHERE action = 'route_email' 
  AND metadata->>'creditor' = 'Verizon'
ORDER BY created_at DESC;
```

---

## 🧪 Testing

### Manual Testing

```bash
# Test health
curl http://localhost:3001/health

# Test with Verizon email
curl -X POST http://localhost:3001/test-router \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test_verizon",
    "from": "noreply@verizonwireless.com",
    "to": ["enforcement@howardtrust.com"],
    "subject": "FINAL NOTICE: Service Suspension",
    "bodyText": "Your Verizon Wireless account will be disconnected in 48 hours.",
    "date": "2025-12-08T10:00:00Z"
  }'

# Test with IRS email
curl -X POST http://localhost:3001/test-router \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test_irs",
    "from": "notices@irs.gov",
    "to": ["enforcement@howardtrust.com"],
    "subject": "Notice of Intent to Levy - CP-504",
    "bodyText": "This is a final notice before levy action.",
    "date": "2025-12-08T10:00:00Z"
  }'
```

### Automated Testing

See `test/sintraprime-router.test.js` for comprehensive test suite.

---

## 🐛 Troubleshooting

### Issue: Router returns "GENERAL_INBOX" for all messages

**Cause:** Creditor detection rules not matching

**Solution:**
1. Check email `from` address and body content
2. Review rules in `sintraprime-router-v1.js`
3. Add debug logging to see what text is being scanned
4. Update rules if needed

### Issue: Normalizer fails with "Missing Gmail raw payload"

**Cause:** Make.com not sending the full Gmail message object

**Solution:**
1. Ensure you're passing `{{1}}` (entire Gmail output) to HTTP module
2. Check Gmail module is outputting the full message structure
3. Test with `/test-router` endpoint using a pre-normalized message

### Issue: Server crashes on startup

**Cause:** Missing environment variables or dependencies

**Solution:**
```bash
# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

---

## 📈 Performance Optimization

### Caching

Consider adding Redis caching for:
- Frequently seen sender domains
- Recent routing decisions
- Creditor lookup results

### Batch Processing

Use `/route-email/batch` endpoint for bulk processing:
- Gmail catch-up scenarios
- Scheduled bulk imports
- Testing with historical data

### Rate Limiting

Add rate limiting middleware (express-rate-limit):
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/route-email', limiter);
```

---

## 🔒 Security

### Authentication

Add API key authentication:
```typescript
app.use('/route-email', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.ROUTER_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

### HTTPS

Always use HTTPS in production:
- Railway/Render provide automatic HTTPS
- Use Let's Encrypt for custom domains
- Enforce HTTPS redirects

### Input Validation

The router validates all inputs, but add extra layers:
- Request size limits (already configured: 10MB)
- Content-Type validation
- Schema validation with Zod

---

## 📚 Related Documentation

- **[Router Usage Guide](./SINTRAPRIME_ROUTER_USAGE.md)** - Integration examples
- **[Router Upgrades](./SINTRAPRIME_ROUTER_V1_UPGRADES.md)** - Advanced features
- **[Gmail Scanner](./GMAIL_ENFORCEMENT_SCANNER.md)** - Make.com Gmail setup
- **[Activation Status](./SINTRAPRIME_STATUS.md)** - Current system status

---

## 🎯 Next Steps

1. **Deploy** the microservice to Railway/Render
2. **Configure** Make.com scenario with your server URL
3. **Test** with a few sample emails
4. **Monitor** logs in Supabase
5. **Iterate** on routing rules based on real-world data

---

**Version:** v1.0  
**Last Updated:** 2025-12-08  
**Status:** ✅ Production Ready
