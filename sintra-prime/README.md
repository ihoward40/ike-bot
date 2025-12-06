# SintraPrime AI Connector

**Master AI coordinator for Sintra automation agents** - Routes requests through OpenAI GPT-4 Turbo for intelligent decision-making and workflow orchestration.

## Overview

SintraPrime acts as the "brain" for your Sintra.ai helper agents, providing:
- **Intelligent routing** - AI-powered decision making for complex workflows
- **Structured responses** - Always returns JSON for reliable automation
- **Agent coordination** - Supervises multiple automation agents
- **Workflow integration** - Connects to Vault Guardian and Grant Acquisition systems

## Architecture

```
Sintra Agents → SintraPrime → GPT-4 Turbo → Structured Response
     ↓              ↓                            ↓
Make.com      HTTP POST                    JSON Output
Workflows    /sintra-prime              (agent decisions)
```

## Implementations

Two production-ready implementations available:

### Node.js/Express (Port 3000)
- **Location**: `nodejs/server.js`
- **Best for**: Integration with existing Node.js services
- **Performance**: Async/await with node-fetch
- **Memory**: ~50MB baseline

### Python/Flask (Port 3001)
- **Location**: `python/server.py`
- **Best for**: Data science workflows, Python automation
- **Performance**: WSGI-ready, production Flask
- **Memory**: ~30MB baseline

See [COMPARISON.md](docs/COMPARISON.md) for detailed feature comparison.

## Quick Start

### Prerequisites
- OpenAI API key (get one at https://platform.openai.com)
- Node.js 18+ (for Node.js version) OR Python 3.9+ (for Python version)

### Setup

#### Option 1: Node.js/Express

```bash
cd sintra-prime/nodejs
npm install
cp ../.env.example .env
# Edit .env and add your OPENAI_API_KEY
npm start
```

#### Option 2: Python/Flask

```bash
cd sintra-prime/python
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env
# Edit .env and add your OPENAI_API_KEY
python server.py
```

### Test the Service

```bash
# Health check
curl http://localhost:3000/health  # Node.js
curl http://localhost:3001/health  # Python

# Test request
curl -X POST http://localhost:3000/sintra-prime \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "VaultGuardian",
    "message": "Should I escalate this checksum mismatch?",
    "metadata": {
      "severity": "high",
      "template_name": "Invoice_Template_v2"
    }
  }'
```

## API Reference

### POST /sintra-prime

**Request Body:**
```json
{
  "agent": "string (required)",
  "message": "string (required)",
  "metadata": "object (optional)"
}
```

**Response (Success):**
```json
{
  "status": "ok",
  "agent": "VaultGuardian",
  "reply": "Based on the high severity...",
  "model": "gpt-4-turbo-preview",
  "usage": {
    "prompt_tokens": 125,
    "completion_tokens": 230,
    "total_tokens": 355
  }
}
```

**Response (Error):**
```json
{
  "status": "error",
  "error": "Missing required fields: agent and message"
}
```

### GET /health

**Response:**
```json
{
  "status": "healthy",
  "service": "SintraPrime",
  "version": "1.0.0"
}
```

## Integration Guides

### Vault Guardian Integration
Connect SintraPrime to your Vault Guardian scenarios for intelligent decision-making:
- [AUTO_HEAL Integration](docs/VAULT-GUARDIAN-INTEGRATION.md#auto-heal)
- [CHECKSUM_WATCHER Integration](docs/VAULT-GUARDIAN-INTEGRATION.md#checksum-watcher)
- [VERIZON_GUARDIAN Integration](docs/VAULT-GUARDIAN-INTEGRATION.md#verizon-guardian)

### Grant Acquisition Integration
Use SintraPrime for grant opportunity analysis and prioritization:
- [Grant Scoring Integration](docs/GRANT-ACQUISITION-INTEGRATION.md#scoring)
- [Funder Matching Integration](docs/GRANT-ACQUISITION-INTEGRATION.md#matching)
- [Application Review Integration](docs/GRANT-ACQUISITION-INTEGRATION.md#review)

## Documentation

- **[Comparison Guide](docs/COMPARISON.md)** - Node.js vs Python feature comparison
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment options
- **[Vault Guardian Integration](docs/VAULT-GUARDIAN-INTEGRATION.md)** - Connect to existing scenarios
- **[Grant Acquisition Integration](docs/GRANT-ACQUISITION-INTEGRATION.md)** - Grant workflow automation
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions

## Use Cases

### 1. Vault Guardian Decision Support
```javascript
// Should we auto-heal or escalate?
POST /sintra-prime
{
  "agent": "VaultGuardian_AutoHeal",
  "message": "Checksum mismatch detected. Original: abc123, Current: def456. Template was modified 5 minutes ago by automated sync.",
  "metadata": {
    "template_name": "Contract_Template_v3",
    "last_modified": "2025-12-06T10:30:00Z",
    "backup_available": true
  }
}
```

### 2. Grant Opportunity Scoring
```javascript
// Should we pursue this grant?
POST /sintra-prime
{
  "agent": "GrantAcquisition_Scorer",
  "message": "Evaluate this grant opportunity: $25K from Newark Community Foundation for legal aid programs. Deadline in 3 weeks, requires 10% match.",
  "metadata": {
    "focus_area": "Legal Aid / Rights",
    "amount": 25000,
    "deadline": "2025-12-27",
    "match_required": true
  }
}
```

### 3. Verizon Case Prioritization
```javascript
// How urgent is this case?
POST /sintra-prime
{
  "agent": "VerizonGuardian_Classifier",
  "message": "Email received: Service disconnection notice during active billing dispute. Customer is SSA-Disabled.",
  "metadata": {
    "email_subject": "Final Notice - Account Suspension",
    "violation_types": ["Service Disconnection During Dispute", "ADA Violation"],
    "customer_status": "SSA-Disabled"
  }
}
```

## Model Information

**Current Model**: GPT-4 Turbo Preview (`gpt-4-turbo-preview`)
- **Context Window**: 128K tokens
- **Response Length**: Up to 4,096 tokens
- **Training Data**: Up to April 2023
- **Capabilities**: Advanced reasoning, JSON mode, function calling

**Cost** (as of Dec 2025):
- Input: $0.01 per 1K tokens
- Output: $0.03 per 1K tokens
- Typical request: ~500 tokens (~$0.02 per request)

## Production Deployment

### Docker Deployment
```bash
# Node.js
docker build -t sintra-prime-nodejs ./nodejs
docker run -p 3000:3000 -e OPENAI_API_KEY=your_key sintra-prime-nodejs

# Python
docker build -t sintra-prime-python ./python
docker run -p 3001:3001 -e OPENAI_API_KEY=your_key sintra-prime-python
```

### Cloud Deployment
- **Heroku**: See [docs/DEPLOYMENT.md#heroku](docs/DEPLOYMENT.md#heroku)
- **Railway**: See [docs/DEPLOYMENT.md#railway](docs/DEPLOYMENT.md#railway)
- **DigitalOcean**: See [docs/DEPLOYMENT.md#digitalocean](docs/DEPLOYMENT.md#digitalocean)
- **AWS Lambda**: See [docs/DEPLOYMENT.md#aws-lambda](docs/DEPLOYMENT.md#aws-lambda)

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files with real API keys
2. **Rate Limiting**: Implement rate limiting for production (see [docs/DEPLOYMENT.md#security](docs/DEPLOYMENT.md#security))
3. **HTTPS Only**: Always use HTTPS in production
4. **API Key Rotation**: Rotate OpenAI API keys regularly
5. **Request Validation**: Validate all incoming requests
6. **Monitoring**: Monitor usage and costs via OpenAI dashboard

## Monitoring & Costs

### Expected Usage (Vault Guardian + Grant Acquisition)
- **Vault Guardian**: ~50-100 requests/day
- **Grant Acquisition**: ~20-30 requests/day
- **Total**: ~70-130 requests/day
- **Monthly Cost**: ~$50-150 (depending on request complexity)

### Cost Optimization
- Cache frequent queries
- Use shorter prompts where possible
- Implement request batching for non-urgent decisions
- Set `max_tokens` limits per use case

## Support & Contributing

**Issues**: Report bugs or request features via GitHub Issues
**Documentation**: All docs in `sintra-prime/docs/`
**Integration Help**: See integration guides for specific workflows

## License

MIT License - See LICENSE file for details

---

**Quick Links**:
- [Node.js Setup](#option-1-nodejsexpress)
- [Python Setup](#option-2-pythonflask)
- [Integration Guides](#integration-guides)
- [API Reference](#api-reference)
- [Deployment](#production-deployment)
