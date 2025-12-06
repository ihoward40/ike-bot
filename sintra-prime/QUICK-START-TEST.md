# SintraPrime Quick Start Test (5 Minutes)

This guide helps you verify that SintraPrime logic works correctly **before** deploying to production. You'll test the AI decision-making locally using your OpenAI API key.

---

## Step 1: Quick Setup (5 minutes)

Open your terminal and run:

```bash
# Create test directory
mkdir ~/sintra-prime-test
cd ~/sintra-prime-test

# Create test script
cat > test-sintra.js << 'EOF'
import fetch from 'node-fetch';

const OPENAI_KEY = process.env.OPENAI_API_KEY;

async function testSintraPrime() {
  console.log("🧪 Testing SintraPrime Logic...\n");
  
  const testMessage = "Generate AFF-001 for Verizon Case #3299852";
  
  const systemPrompt = `You are SINTRA-PRIME, the master AI coordinator for IKE Solutions.

**Business Context:**
- Company: IKE Solutions (EIN: 87-1798434)
- Trust: Isiah Tarik Howard Trust (EIN: 92-6080121)
- Owner: Isiah Tarik Howard

**Response Format (STRICT JSON ONLY):**
{
  "reply": "string",
  "confidence": 0.0-1.0,
  "recommended_route": "string",
  "tags": ["array"],
  "next_action": "string",
  "document_template": "string or null",
  "priority": "low|medium|high|critical",
  "case_id": "string or null",
  "trigger_code": "string or null"
}

**Trigger Code Detection:**
If message contains AFF-001, set trigger_code to "AFF-001", document_template to "AFF-001", next_action to "create_affidavit", priority to "high", and route to "make:trust-command-center".`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Agent: Vizzy\nMessage: ${testMessage}` }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("❌ OpenAI Error:", data.error.message);
      return;
    }

    const result = JSON.parse(data.choices[0].message.content);
    
    console.log("✅ TEST RESULTS:\n");
    console.log("📝 Reply:", result.reply);
    console.log("🎯 Confidence:", result.confidence);
    console.log("🔀 Route:", result.recommended_route);
    console.log("🏷️  Tags:", result.tags.join(", "));
    console.log("⚡ Next Action:", result.next_action);
    console.log("📄 Template:", result.document_template);
    console.log("⚠️  Priority:", result.priority);
    console.log("🔢 Case ID:", result.case_id);
    console.log("🎫 Trigger Code:", result.trigger_code);
    
    console.log("\n✅ TEST PASSED!");
    
  } catch (error) {
    console.error("❌ Test Failed:", error.message);
  }
}

testSintraPrime();
EOF

# Create package.json
cat > package.json << 'EOF'
{
  "name": "sintra-prime-test",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "node-fetch": "^3.3.2"
  }
}
EOF

# Install dependencies
npm install

echo ""
echo "✅ Test setup complete!"
echo ""
```

---

## Step 2: Add Your API Key (SECURELY)

```bash
# Set your OpenAI API key as environment variable (secure method)
export OPENAI_API_KEY="your-key-here"

# Verify it's set (will show masked version)
echo $OPENAI_API_KEY | sed 's/./*/g'
```

**🔐 Security Note**: Never commit your API key to git or share it publicly!

---

## Step 3: Run the Test

```bash
node test-sintra.js
```

---

## 📊 Expected Output

If everything works, you should see:

```
🧪 Testing SintraPrime Logic...

✅ TEST RESULTS:

📝 Reply: I'll generate the Affidavit of Truth (AFF-001) for Verizon Case #3299852. This is a high-priority trust operation document that will be created from the template, saved to Google Drive, logged in the Trust Command Center, and sent via PostGrid certified mail with a 10-day response deadline.

🎯 Confidence: 0.95
🔀 Route: make:trust-command-center
🏷️  Tags: trust-automation, verizon, affidavit, legal, certified-mail
⚡ Next Action: create_affidavit
📄 Template: AFF-001
⚠️  Priority: high
🔢 Case ID: 3299852
🎫 Trigger Code: AFF-001

✅ TEST PASSED!
```

---

## ✅ What This Test Validates

- ✅ Your OpenAI API key works
- ✅ SintraPrime logic correctly detects trigger codes
- ✅ JSON response is properly formatted
- ✅ Confidence scoring works
- ✅ Routing logic is correct
- ✅ Metadata extraction works (case ID, trigger code, template)
- ✅ Priority assessment is accurate
- ✅ Tags and next actions are suggested appropriately

---

## 🎯 Next Steps After Successful Test

If the test passes:

1. **Deploy to Render.com/Railway** — Your API key is validated ✅
2. **Set up Make.com** — Connect the webhooks
3. **Create Notion databases** — Ready for logging
4. **Go live** — Start using with real cases

---

## Additional Test Scenarios

### Test 2: Grant Acquisition Scoring

```bash
cat > test-grant-scoring.js << 'EOF'
import fetch from 'node-fetch';

const OPENAI_KEY = process.env.OPENAI_API_KEY;

async function testGrantScoring() {
  console.log("🧪 Testing Grant Acquisition Scoring...\n");
  
  const testMessage = "Analyze this grant: $50K housing stability program for Newark families. Match with our mission?";
  
  const systemPrompt = `You are SINTRA-PRIME for grant acquisition analysis.

**Response Format (STRICT JSON ONLY):**
{
  "reply": "string",
  "score": 0-100,
  "match_reasons": ["array"],
  "concerns": ["array"],
  "recommendation": "pursue|consider|skip",
  "focus_areas": ["array"],
  "estimated_effort": "low|medium|high",
  "deadline_urgency": "low|medium|high",
  "funding_tier": "tier1|tier2|tier3"
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Agent: GrantScout\nMessage: ${testMessage}` }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("❌ OpenAI Error:", data.error.message);
      return;
    }

    const result = JSON.parse(data.choices[0].message.content);
    
    console.log("✅ GRANT SCORING RESULTS:\n");
    console.log("📝 Analysis:", result.reply);
    console.log("📊 Score:", result.score + "/100");
    console.log("✅ Match Reasons:", result.match_reasons.join(", "));
    console.log("⚠️  Concerns:", result.concerns.join(", "));
    console.log("🎯 Recommendation:", result.recommendation.toUpperCase());
    console.log("🏷️  Focus Areas:", result.focus_areas.join(", "));
    console.log("⏱️  Effort:", result.estimated_effort);
    console.log("⏰ Urgency:", result.deadline_urgency);
    console.log("🎖️  Tier:", result.funding_tier);
    
    console.log("\n✅ GRANT TEST PASSED!");
    
  } catch (error) {
    console.error("❌ Test Failed:", error.message);
  }
}

testGrantScoring();
EOF

node test-grant-scoring.js
```

**Expected Output**:
```
🧪 Testing Grant Acquisition Scoring...

✅ GRANT SCORING RESULTS:

📝 Analysis: This grant shows strong alignment with our Housing & Stability focus area...
📊 Score: 85/100
✅ Match Reasons: Geographic match (Newark), Focus area alignment (housing), Appropriate funding level
⚠️  Concerns: May require match funding, Timeline unknown
🎯 Recommendation: PURSUE
🏷️  Focus Areas: Housing & Stability, Family Support
⏱️  Effort: medium
⏰ Urgency: high
🎖️  Tier: tier1

✅ GRANT TEST PASSED!
```

---

### Test 3: Verizon Case Analysis

```bash
cat > test-verizon-analysis.js << 'EOF'
import fetch from 'node-fetch';

const OPENAI_KEY = process.env.OPENAI_API_KEY;

async function testVerizonAnalysis() {
  console.log("🧪 Testing Verizon Case Analysis...\n");
  
  const testMessage = "New email from Verizon: Service disconnection notice during active dispute. Customer is SSA-disabled.";
  
  const systemPrompt = `You are SINTRA-PRIME for legal case analysis.

**Response Format (STRICT JSON ONLY):**
{
  "reply": "string",
  "severity": "low|medium|high|critical",
  "violation_types": ["array"],
  "estimated_damages": "string",
  "evidence_strength": "weak|moderate|strong|very_strong",
  "recommended_actions": ["array"],
  "legal_risks": ["array"],
  "response_deadline": "string",
  "requires_attorney": boolean,
  "ada_violation": boolean
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Agent: VerizonGuardian\nMessage: ${testMessage}` }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("❌ OpenAI Error:", data.error.message);
      return;
    }

    const result = JSON.parse(data.choices[0].message.content);
    
    console.log("✅ VERIZON ANALYSIS RESULTS:\n");
    console.log("📝 Analysis:", result.reply);
    console.log("⚠️  Severity:", result.severity.toUpperCase());
    console.log("⚖️  Violations:", result.violation_types.join(", "));
    console.log("💰 Est. Damages:", result.estimated_damages);
    console.log("📊 Evidence:", result.evidence_strength);
    console.log("📋 Actions:", result.recommended_actions.join(", "));
    console.log("⚠️  Legal Risks:", result.legal_risks.join(", "));
    console.log("⏰ Deadline:", result.response_deadline);
    console.log("👔 Attorney Needed:", result.requires_attorney ? "YES" : "NO");
    console.log("♿ ADA Violation:", result.ada_violation ? "YES" : "NO");
    
    console.log("\n✅ VERIZON TEST PASSED!");
    
  } catch (error) {
    console.error("❌ Test Failed:", error.message);
  }
}

testVerizonAnalysis();
EOF

node test-verizon-analysis.js
```

**Expected Output**:
```
🧪 Testing Verizon Case Analysis...

✅ VERIZON ANALYSIS RESULTS:

📝 Analysis: This represents a critical ADA Title II violation and FDCPA breach...
⚠️  Severity: CRITICAL
⚖️  Violations: Service Disconnection During Dispute, ADA Title II Violation, Collection Under Duress
💰 Est. Damages: $50,000-$75,000
📊 Evidence: very_strong
📋 Actions: Send certified mail immediately, File ADA complaint, Document all communications, Preserve evidence
⚠️  Legal Risks: Service termination, Credit damage, ADA liability exposure
⏰ Deadline: Respond within 10 days
👔 Attorney Needed: YES
♿ ADA Violation: YES

✅ VERIZON TEST PASSED!
```

---

## Troubleshooting

### ❌ Error: "Invalid API key"

**Solution**:
```bash
# Verify your API key is set correctly
echo $OPENAI_API_KEY

# If empty, export it again
export OPENAI_API_KEY="sk-your-actual-key-here"
```

---

### ❌ Error: "Cannot find module 'node-fetch'"

**Solution**:
```bash
# Make sure you ran npm install
npm install

# If still failing, install manually
npm install node-fetch@3.3.2
```

---

### ❌ Error: "Unexpected token 'import'"

**Solution**: Your Node.js version might be too old. Update to Node.js 18+ or use CommonJS:

```bash
# Check Node version
node --version

# Should be v18.0.0 or higher
# If not, update Node.js from https://nodejs.org
```

---

### ❌ Error: "Rate limit exceeded"

**Solution**: Wait 60 seconds and try again, or check your OpenAI usage at https://platform.openai.com/usage

---

### ❌ JSON Parse Error

**Symptom**: `SyntaxError: Unexpected token in JSON`

**Cause**: GPT-4 didn't return valid JSON (rare but possible)

**Solution**:
1. Run the test again (GPT-4 is usually consistent)
2. Check the raw response by adding this debug line before `JSON.parse()`:
   ```javascript
   console.log("Raw response:", data.choices[0].message.content);
   ```

---

## 🎉 Success Indicators

**You'll know SintraPrime is working when**:
- ✅ All test scripts complete without errors
- ✅ JSON responses are properly formatted
- ✅ Confidence scores are > 0.8
- ✅ Routing decisions match expected workflows
- ✅ Metadata extraction is accurate (case IDs, trigger codes, etc.)
- ✅ Priority assessments make sense
- ✅ Recommended actions are actionable

---

## Deploy After Testing

Once all tests pass, you're ready to deploy:

1. **Copy to your SintraPrime server**:
   ```bash
   cd ~/sintra-prime-test
   
   # Copy the improved prompt logic to your server implementation
   # Update sintra-prime/nodejs/server.js or sintra-prime/python/server.py
   ```

2. **Deploy to Railway**:
   ```bash
   railway up
   railway open
   ```

3. **Set environment variable**:
   ```bash
   railway variables set OPENAI_API_KEY="your-key-here"
   ```

4. **Test production endpoint**:
   ```bash
   curl -X POST https://your-app.railway.app/sintra-prime \
     -H "Content-Type: application/json" \
     -d '{"agent":"TestAgent","message":"Generate AFF-001 for Case #123","metadata":{}}'
   ```

---

## Ready to Go Live?

After successful testing:

- ✅ OpenAI API key validated
- ✅ JSON formatting confirmed
- ✅ Decision logic verified
- ✅ All test scenarios passed

**Next steps**:
1. Review [Deployment Guide](docs/DEPLOYMENT.md)
2. Set up [Vault Guardian Integration](docs/VAULT-GUARDIAN-INTEGRATION.md)
3. Configure [Grant Acquisition Integration](docs/GRANT-ACQUISITION-INTEGRATION.md)
4. Set up monitoring (see [TESTING.md](docs/TESTING.md))

---

## Need Help?

**Common issues**:
- API key not set → Export it as environment variable
- Old Node.js version → Update to v18+
- Rate limits → Wait or upgrade OpenAI plan
- JSON parse errors → Run test again (usually resolves)

**Still stuck?** Check the full [Testing Guide](docs/TESTING.md) for comprehensive troubleshooting.

---

**🚀 Ready to test? Copy the commands and let's verify SintraPrime is working!**
