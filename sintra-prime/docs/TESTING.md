# SintraPrime Testing & Verification Guide

This guide shows you how to verify that SintraPrime is working correctly, from local testing to production monitoring.

## Quick Health Check

### 1. Test the Health Endpoint

**Node.js/Python (running locally)**:
```bash
curl http://localhost:3000/health
# or for Python
curl http://localhost:3001/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-06T16:21:30.000Z"
}
```

**Production (Railway/Heroku)**:
```bash
curl https://your-app.railway.app/health
```

✅ **If you see this response, the server is running correctly.**

---

## Full Integration Test

### 2. Test the /sintra-prime Endpoint

**Using curl**:
```bash
curl -X POST http://localhost:3000/sintra-prime \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "TestAgent",
    "message": "Hello SintraPrime! Please respond with a simple greeting.",
    "metadata": {
      "test": true,
      "timestamp": "2025-12-06T16:21:30Z"
    }
  }'
```

**Expected Response**:
```json
{
  "status": "ok",
  "agent": "TestAgent",
  "reply": "Hello! I'm SintraPrime, and I'm operational. How can I assist your automation workflows today?"
}
```

✅ **If you get a structured JSON response with a reply, GPT-4 Turbo integration is working.**

---

## Testing with Postman

### 3. Postman Collection

**Import this request**:

1. **Method**: POST
2. **URL**: `http://localhost:3000/sintra-prime` (or your production URL)
3. **Headers**:
   - `Content-Type: application/json`
4. **Body** (raw JSON):
```json
{
  "agent": "PostmanTestAgent",
  "message": "Analyze this grant opportunity: Housing stability program for families in Newark, NJ. Funding range: $25K-$50K. Deadline: March 15, 2026.",
  "metadata": {
    "context": "grant_analysis",
    "organization": "ISIAH TARIK HOWARD TRUST"
  }
}
```

**Expected Response**:
- Status: 200 OK
- JSON response with intelligent analysis of the grant opportunity

---

## Testing with Make.com/Sintra

### 4. Connect from Make.com

**Create a new scenario**:

1. **Add HTTP Module** → Make a Request
2. **Configuration**:
   - **URL**: `https://your-sintra-prime-url.railway.app/sintra-prime`
   - **Method**: POST
   - **Headers**:
     ```
     Content-Type: application/json
     ```
   - **Body**:
     ```json
     {
       "agent": "{{module.agent_name}}",
       "message": "{{module.user_message}}",
       "metadata": {
         "scenario_id": "{{scenario.id}}",
         "execution_id": "{{execution.id}}"
       }
     }
     ```

3. **Test the module** - You should see a JSON response with a `reply` field

✅ **If Make.com successfully receives the response, your integration is working.**

---

## Monitoring in Production

### 5. Check Server Logs

**Node.js**:
```bash
# Railway/Heroku logs
railway logs
# or
heroku logs --tail --app your-app-name
```

**Look for**:
- `✅ SintraPrime Node.js server is running on port 3000`
- `📊 Request received - Agent: [agent_name]`
- `✅ Response sent successfully`

**Python**:
```bash
# Railway/Heroku logs
railway logs
# or
heroku logs --tail --app your-app-name
```

**Look for**:
- `✅ SintraPrime Flask server is running on port 3001`
- Request/response log entries

---

## Troubleshooting: What If It's Not Working?

### ❌ Health Check Fails

**Symptom**: `curl: (7) Failed to connect to localhost port 3000`

**Solutions**:
1. **Check if server is running**:
   ```bash
   # Node.js
   ps aux | grep node
   
   # Python
   ps aux | grep python
   ```

2. **Check environment variables**:
   ```bash
   echo $OPENAI_API_KEY
   ```
   - Should output your API key (not empty)

3. **Restart the server**:
   ```bash
   # Node.js
   npm start
   
   # Python
   python server.py
   ```

---

### ❌ 500 Internal Server Error

**Symptom**: Server returns error instead of reply

**Common Causes**:
1. **Missing OpenAI API Key**
   - Check `.env` file or environment variables
   - Verify key is valid on https://platform.openai.com/api-keys

2. **Invalid OpenAI API Key**
   ```json
   {
     "error": "Invalid API key"
   }
   ```
   - Generate new key at OpenAI platform
   - Update `OPENAI_API_KEY` in environment

3. **OpenAI API Rate Limit**
   ```json
   {
     "error": "Rate limit exceeded"
   }
   ```
   - Wait a few minutes
   - Check your OpenAI usage at https://platform.openai.com/usage

4. **Network/Firewall Issues**
   - Ensure server can reach `api.openai.com`
   - Check firewall rules

---

### ❌ No Response from GPT-4

**Symptom**: Response is `{"status": "ok", "agent": "...", "reply": "(no response)"}`

**Solutions**:
1. **Check OpenAI API response in logs**
2. **Verify model name** is `gpt-4-turbo-preview` (not `gpt-5.1`)
3. **Check message format** - ensure it's not empty

---

## Automated Health Monitoring

### 6. Set Up Uptime Monitoring

**Use services like**:
- **UptimeRobot** (free): https://uptimerobot.com
- **Pingdom** (free tier): https://www.pingdom.com
- **BetterUptime** (free): https://betteruptime.com

**Monitor**:
- URL: `https://your-app.railway.app/health`
- Method: GET
- Check Interval: Every 5 minutes
- Expected Response: `200 OK` with `{"status": "healthy"}`

**Alerts**: Email/Slack notification if server goes down

---

## Performance Testing

### 7. Load Test (Optional)

**Using Apache Bench**:
```bash
ab -n 100 -c 10 http://localhost:3000/health
```

**Interpretation**:
- **Requests per second**: Should be > 100 for health endpoint
- **Failed requests**: Should be 0

**Using curl loop**:
```bash
for i in {1..10}; do
  curl -X POST http://localhost:3000/sintra-prime \
    -H "Content-Type: application/json" \
    -d '{"agent":"LoadTest","message":"Test '$i'","metadata":{}}' \
    -w "\nTime: %{time_total}s\n"
done
```

**Expected**: Each request completes in 1-3 seconds

---

## Integration Verification Checklist

### ✅ Basic Functionality
- [ ] Health endpoint returns 200 OK
- [ ] `/sintra-prime` endpoint accepts POST requests
- [ ] Response includes `status`, `agent`, and `reply` fields
- [ ] Reply contains intelligent GPT-4 response

### ✅ Environment Setup
- [ ] `OPENAI_API_KEY` is set correctly
- [ ] Server starts without errors
- [ ] Logs show successful initialization

### ✅ Production Deployment
- [ ] Deployed to Railway/Heroku/DO
- [ ] Public URL is accessible
- [ ] HTTPS is working (for production)
- [ ] Uptime monitoring is configured

### ✅ Make.com/Sintra Integration
- [ ] HTTP module successfully calls SintraPrime
- [ ] Response is parsed correctly in Make.com
- [ ] Data flows to next modules (Notion, Slack, etc.)

### ✅ Vault Guardian Integration
- [ ] AUTO_HEAL can route decisions through SintraPrime
- [ ] CHECKSUM_WATCHER can analyze anomalies via SintraPrime
- [ ] VERIZON_GUARDIAN can assess violation severity via SintraPrime

### ✅ Grant Acquisition Integration
- [ ] Grant scoring requests return structured scores
- [ ] Funder matching provides relevant matches
- [ ] Application review returns actionable feedback

---

## Quick Test Script

**Save as `test-sintra-prime.sh`**:

```bash
#!/bin/bash

echo "🧪 Testing SintraPrime..."
echo ""

# Test 1: Health Check
echo "1. Health Check..."
HEALTH=$(curl -s http://localhost:3000/health)
if echo "$HEALTH" | grep -q "healthy"; then
  echo "   ✅ Health check passed"
else
  echo "   ❌ Health check failed"
  exit 1
fi

# Test 2: Basic Endpoint
echo "2. Testing /sintra-prime endpoint..."
RESPONSE=$(curl -s -X POST http://localhost:3000/sintra-prime \
  -H "Content-Type: application/json" \
  -d '{"agent":"TestScript","message":"Say hello","metadata":{}}')

if echo "$RESPONSE" | grep -q "reply"; then
  echo "   ✅ Endpoint test passed"
else
  echo "   ❌ Endpoint test failed"
  exit 1
fi

echo ""
echo "🎉 All tests passed! SintraPrime is working correctly."
```

**Run**:
```bash
chmod +x test-sintra-prime.sh
./test-sintra-prime.sh
```

---

## Production Checklist

Before going live with SintraPrime:

- [ ] All tests pass locally
- [ ] Deployed to production environment
- [ ] Environment variables configured correctly
- [ ] Health monitoring enabled
- [ ] Error logging configured
- [ ] Rate limiting considered (if high volume expected)
- [ ] Backup API keys available
- [ ] Documentation reviewed by team
- [ ] Integration tests completed with Make.com/Sintra
- [ ] Vault Guardian workflows tested
- [ ] Grant Acquisition workflows tested

---

## Getting Help

**If SintraPrime isn't working**:

1. **Check the logs** - Look for error messages
2. **Verify environment** - Ensure `OPENAI_API_KEY` is set
3. **Test locally first** - Use curl or Postman before production
4. **Review OpenAI status** - Check https://status.openai.com
5. **Check documentation** - Review deployment guide and integration guides

**Common Issues**:
- Missing API key → Set `OPENAI_API_KEY` environment variable
- Port already in use → Change port or kill existing process
- OpenAI rate limit → Wait or upgrade OpenAI plan
- Network timeout → Check firewall/proxy settings

---

## Success Indicators

**You'll know SintraPrime is working when**:
1. ✅ Health endpoint returns `{"status": "healthy"}`
2. ✅ Test POST request returns intelligent GPT-4 response
3. ✅ Make.com scenarios successfully receive responses
4. ✅ Vault Guardian workflows route through SintraPrime
5. ✅ Grant Acquisition scoring returns structured data
6. ✅ Logs show successful requests and responses
7. ✅ No 500 errors in production monitoring

**Production metrics to track**:
- **Uptime**: Should be > 99%
- **Response time**: 1-3 seconds average
- **Error rate**: < 1%
- **OpenAI API usage**: Within your quota

---

## Next Steps

Once SintraPrime is verified as working:

1. **Integrate with Vault Guardian** - Follow `VAULT-GUARDIAN-INTEGRATION.md`
2. **Integrate with Grant Acquisition** - Follow `GRANT-ACQUISITION-INTEGRATION.md`
3. **Set up monitoring** - Configure uptime and error alerts
4. **Document custom workflows** - Add organization-specific integration patterns
5. **Scale as needed** - Upgrade hosting plan or add load balancing

---

**Need more help?** Check the other documentation:
- [Deployment Guide](DEPLOYMENT.md)
- [Vault Guardian Integration](VAULT-GUARDIAN-INTEGRATION.md)
- [Grant Acquisition Integration](GRANT-ACQUISITION-INTEGRATION.md)
- [Comparison Guide](COMPARISON.md)
