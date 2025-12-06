# SintraPrime Deployment Guide

Production deployment options for both Node.js and Python implementations.

## Quick Deploy Options

| Platform | Difficulty | Cost | Best For |
|----------|-----------|------|----------|
| **Railway.app** | ⭐ Easy | $5/mo | Quick start, auto-deploy |
| **Heroku** | ⭐ Easy | $5-7/mo | Traditional PaaS |
| **DigitalOcean App Platform** | ⭐⭐ Medium | $6/mo | Flexible scaling |
| **Docker (Self-Hosted)** | ⭐⭐ Medium | Variable | Full control |
| **AWS Lambda** | ⭐⭐⭐ Advanced | Pay-per-use | Serverless, cost-effective |

## Prerequisites

- OpenAI API key
- Git repository (for auto-deploy platforms)
- Domain name (optional, recommended for production)

---

## Option 1: Railway.app (Recommended for Quick Start)

**Pros**: Auto-deploy from Git, free SSL, simple setup
**Cons**: $5/month minimum

### Node.js Deployment

1. **Create `railway.json`**:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd sintra-prime/nodejs && npm install && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

2. **Push to GitHub**:
```bash
git add sintra-prime/
git commit -m "Add SintraPrime service"
git push origin main
```

3. **Deploy on Railway**:
   - Go to https://railway.app
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Set environment variables:
     - `OPENAI_API_KEY`: your_api_key
     - `SINTRA_PRIME_PORT`: 3000
   - Click "Deploy"

4. **Get Public URL**:
   - Railway generates URL: `sintra-prime-production.up.railway.app`
   - Update Make.com webhooks to use this URL

### Python Deployment

Same steps as Node.js, but with modified `railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd sintra-prime/python && pip install -r requirements.txt && python server.py",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

---

## Option 2: Heroku

**Pros**: Established platform, excellent docs
**Cons**: Slightly more expensive ($7/mo for Eco Dynos)

### Node.js Deployment

1. **Install Heroku CLI**:
```bash
brew install heroku/brew/heroku  # macOS
# or download from https://devcenter.heroku.com/articles/heroku-cli
```

2. **Create `Procfile`**:
```
web: cd sintra-prime/nodejs && npm start
```

3. **Deploy**:
```bash
heroku login
heroku create sintra-prime-nodejs
heroku config:set OPENAI_API_KEY=your_api_key
git push heroku main
heroku ps:scale web=1
```

4. **Get URL**:
```bash
heroku open
# URL: https://sintra-prime-nodejs.herokuapp.com
```

### Python Deployment

1. **Create `Procfile`**:
```
web: cd sintra-prime/python && gunicorn --bind 0.0.0.0:$PORT server:app
```

2. **Add `gunicorn` to requirements**:
```bash
echo "gunicorn==21.2.0" >> sintra-prime/python/requirements.txt
```

3. **Deploy**:
```bash
heroku create sintra-prime-python
heroku config:set OPENAI_API_KEY=your_api_key
git push heroku main
```

---

## Option 3: DigitalOcean App Platform

**Pros**: Fixed pricing, great for scaling
**Cons**: Requires DO account

### Setup (Both Node.js & Python)

1. **Create `app.yaml`** (Node.js):
```yaml
name: sintra-prime-nodejs
services:
  - name: api
    source_dir: sintra-prime/nodejs
    github:
      repo: your-username/ike-bot
      branch: main
    run_command: npm start
    envs:
      - key: OPENAI_API_KEY
        scope: RUN_TIME
        value: ${OPENAI_API_KEY}
    http_port: 3000
    instance_count: 1
    instance_size_slug: basic-xxs
```

2. **Or for Python**:
```yaml
name: sintra-prime-python
services:
  - name: api
    source_dir: sintra-prime/python
    github:
      repo: your-username/ike-bot
      branch: main
    run_command: python server.py
    envs:
      - key: OPENAI_API_KEY
        scope: RUN_TIME
        value: ${OPENAI_API_KEY}
    http_port: 3001
    instance_count: 1
    instance_size_slug: basic-xxs
```

3. **Deploy via DO Dashboard**:
   - Go to https://cloud.digitalocean.com/apps
   - Create App → From GitHub
   - Select repository
   - Review `app.yaml`
   - Set env variables
   - Deploy

---

## Option 4: Docker (Self-Hosted)

**Pros**: Full control, portable, any hosting provider
**Cons**: Requires Docker knowledge, manual updates

### Node.js Dockerfile

**Create `sintra-prime/nodejs/Dockerfile`**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY server.js ./

EXPOSE 3000

CMD ["node", "server.js"]
```

### Python Dockerfile

**Create `sintra-prime/python/Dockerfile`**:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py ./

EXPOSE 3001

CMD ["python", "server.py"]
```

### Build & Run

**Node.js**:
```bash
cd sintra-prime/nodejs
docker build -t sintra-prime-nodejs .
docker run -d \
  -p 3000:3000 \
  -e OPENAI_API_KEY=your_api_key \
  --name sintra-prime-nodejs \
  --restart unless-stopped \
  sintra-prime-nodejs
```

**Python**:
```bash
cd sintra-prime/python
docker build -t sintra-prime-python .
docker run -d \
  -p 3001:3001 \
  -e OPENAI_API_KEY=your_api_key \
  --name sintra-prime-python \
  --restart unless-stopped \
  sintra-prime-python
```

### Docker Compose (Run Both)

**Create `sintra-prime/docker-compose.yml`**:
```yaml
version: '3.8'

services:
  nodejs:
    build: ./nodejs
    ports:
      - "3000:3000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    restart: unless-stopped

  python:
    build: ./python
    ports:
      - "3001:3001"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    restart: unless-stopped
```

**Run**:
```bash
cd sintra-prime
echo "OPENAI_API_KEY=your_api_key" > .env
docker-compose up -d
```

---

## Option 5: AWS Lambda (Advanced)

**Pros**: Serverless, pay-per-use, auto-scaling
**Cons**: Complex setup, cold starts

### Node.js Lambda

1. **Install Serverless Framework**:
```bash
npm install -g serverless
```

2. **Create `serverless.yml`**:
```yaml
service: sintra-prime-nodejs

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    OPENAI_API_KEY: ${env:OPENAI_API_KEY}

functions:
  api:
    handler: handler.handler
    events:
      - http:
          path: /sintra-prime
          method: post
      - http:
          path: /health
          method: get
```

3. **Create Lambda handler** (`handler.js`):
```javascript
const serverless = require('serverless-http');
const express = require('express');
// ... (import your server.js code)

module.exports.handler = serverless(app);
```

4. **Deploy**:
```bash
serverless deploy
```

### Python Lambda

Similar process, but use `serverless-wsgi` plugin for Flask.

---

## Security Best Practices

### 1. Environment Variables
Never commit API keys. Always use environment variables:

```bash
# .env (NEVER commit this file)
OPENAI_API_KEY=sk-...
SINTRA_PRIME_PORT=3000
```

### 2. HTTPS/SSL
Always use HTTPS in production:
- Railway/Heroku: Automatic
- Custom domain: Use Let's Encrypt
- Self-hosted: Use nginx with SSL

### 3. Rate Limiting

**Add to Node.js** (express-rate-limit):
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/sintra-prime', limiter);
```

**Add to Python** (flask-limiter):
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["100 per 15 minutes"]
)

@app.route("/sintra-prime", methods=["POST"])
@limiter.limit("100 per 15 minutes")
def sintra_prime():
    ...
```

### 4. API Key Rotation
Rotate OpenAI API keys every 90 days:
```bash
# Update on platform
heroku config:set OPENAI_API_KEY=new_key
# or Railway, etc.
```

### 5. Request Validation
Both implementations include basic validation. For production, add:
- API key authentication for your endpoint
- Request signature verification
- Input sanitization

---

## Monitoring & Logging

### Health Checks

All platforms support health checks. Configure:
- Endpoint: `GET /health`
- Expected response: `200 OK`
- Check interval: 60 seconds

### Application Logs

**Heroku**:
```bash
heroku logs --tail --app sintra-prime-nodejs
```

**Railway**:
- View logs in Railway dashboard

**Docker**:
```bash
docker logs -f sintra-prime-nodejs
```

### Error Monitoring

Consider adding:
- **Sentry**: Error tracking
- **DataDog**: Application performance monitoring
- **New Relic**: Full stack observability

---

## Scaling Guidelines

### When to Scale

**Current Load** (IKE Solutions):
- ~70-130 requests/day
- ~3-5 requests/hour peak
- **Verdict**: No scaling needed

**Scale Up When**:
- >500 requests/day
- >20 concurrent requests
- Response times >3 seconds

### Scaling Options

1. **Vertical Scaling** (bigger instance)
   - Railway: Upgrade to Standard plan ($10/mo)
   - Heroku: Upgrade to Standard-1X ($25/mo)
   - DO: Upgrade instance size

2. **Horizontal Scaling** (more instances)
   - Railway: Add replicas
   - Heroku: `heroku ps:scale web=2`
   - Docker: Use docker-compose scaling

3. **Load Balancing**
   - Use nginx for self-hosted
   - Use cloud load balancer (AWS ALB, DO Load Balancer)

---

## Cost Optimization

### Free Tier Options

**Railway**:
- $5 free credit/month
- Good for testing

**Heroku**:
- Eco Dynos: $5/mo (1000 hours)

**AWS Lambda**:
- 1M requests/month free
- Best for low-traffic scenarios

### Cost Comparison (Monthly)

| Platform | Small (Current Load) | Medium | Large |
|----------|---------------------|--------|-------|
| Railway | $5 | $10 | $20 |
| Heroku | $5-7 | $25 | $50 |
| DigitalOcean | $6 | $12 | $24 |
| AWS Lambda | ~$1 | ~$5 | ~$20 |
| Self-Hosted | $6 | $12 | $24 |

**Recommendation for IKE Solutions**: Start with Railway ($5/mo) or AWS Lambda (~$1/mo)

---

## Troubleshooting

### Common Issues

**1. Port Binding Error**
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution**: Change port in `.env` file

**2. OpenAI API Error**
```
Error: OpenAI API error: Invalid API key
```
**Solution**: Check API key is set correctly in environment

**3. Module Not Found**
```
Error: Cannot find module 'express'
```
**Solution**: Run `npm install` or `pip install -r requirements.txt`

**4. CORS Errors**
If calling from browser, add CORS middleware:
```javascript
const cors = require('cors');
app.use(cors());
```

---

## Backup & Disaster Recovery

### Configuration Backup
Keep `.env.example` updated with all required variables.

### Service Redundancy
Run both Node.js (primary) and Python (backup) implementations:
- Primary: `https://sintra-prime.railway.app` (Node.js)
- Backup: `https://sintra-prime-py.railway.app` (Python)
- Update Make.com scenarios to failover if primary fails

### Database (if added later)
Consider adding database for:
- Request logging
- Response caching
- Usage analytics

---

## Next Steps

1. **Choose Platform**: Railway recommended for quick start
2. **Deploy**: Follow platform-specific guide above
3. **Test**: Send test request to `/sintra-prime` endpoint
4. **Update Make.com**: Replace localhost URLs with production URLs
5. **Monitor**: Check logs and health endpoint regularly
6. **Scale**: Upgrade as needed based on usage

---

## Support Resources

- **Railway**: https://railway.app/help
- **Heroku**: https://devcenter.heroku.com
- **DigitalOcean**: https://docs.digitalocean.com
- **Docker**: https://docs.docker.com
- **AWS**: https://docs.aws.amazon.com

---

**Ready to Deploy?** Choose a platform above and follow the guide!
