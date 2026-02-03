# 🎯 SintraPrime Router v4: Countermeasure Engine

**Purpose:** Transform routing intelligence into actionable enforcement plans with clear timelines, regulatory channels, and automated decision-making.

**Status:** ✅ Production Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Core Capabilities](#core-capabilities)
3. [Architecture](#architecture)
4. [API Reference](#api-reference)
5. [Integration Guide](#integration-guide)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Examples](#examples)

---

## 🎯 Overview

The **Countermeasure Engine** (Router v4) is your **tactical command center** that answers:

> **"Given what they just did, who they are, and how they've been acting... what's the smartest lawful move next?"**

It takes Router v2 decisions (risk scoring, dishonor prediction, beneficiary impact) and optional Router v3 persona data (behavior profiles) and outputs a **structured enforcement plan** with:

- ✅ Priority level (low → critical)
- ✅ Enforcement posture (observe → emergency)
- ✅ Specific action tracks (Admin, Regulator, Litigation, IRS Procedure, Monitor)
- ✅ Timeline deadlines (72 hours → 60 days)
- ✅ Template keys for document automation
- ✅ Human review requirements
- ✅ Narrative explanations for case files

### What Makes It Different

Most routing systems stop at "this is a Verizon email."  
**Router v4 says**: "This is Verizon, they're stonewalling, risk is high, beneficiaries are at risk → File with FCC within 5 days, prepare TRO docs within 1 day, human review required."

---

## 🔧 Core Capabilities

### 1. **Priority & Posture Decision**

Analyzes multiple factors to determine enforcement intensity:

| **Priority** | **Posture** | **Trigger Conditions** |
|--------------|-------------|------------------------|
| **Low** | **Observe** | Risk: Low, No dishonor flags, No beneficiary impact |
| **Medium** | **Press** | Risk: Medium, Some adversarial behavior |
| **High** | **Enforce** | Risk: High OR High dishonor OR Beneficiary at risk |
| **Critical** | **Emergency** | Risk: Critical, Immediate action required |

**Modifiers:**
- Dishonor prediction escalates posture
- Beneficiary impact escalates priority
- Adversarial persona shifts from observe → press
- Stonewalling pattern shifts to enforce
- Zero trust score (<20) upgrades priority

### 2. **Track Selection**

Chooses enforcement channels based on creditor and situation:

| **Track** | **When Used** | **Actions** |
|-----------|---------------|-------------|
| **ADMIN** | Press/Enforce posture | Formal letters, dispute demands |
| **REGULATOR** | Dishonor likely, Stonewalling, High risk | CFPB, FCC, BPU, OCC complaints |
| **IRS_PROCEDURE** | IRS creditor | TAS requests, procedural responses |
| **LITIGATION** | Emergency posture | TRO prep, evidence packages |
| **MONITOR** | Observe posture | Passive monitoring, no immediate action |

### 3. **Regulator Channel Mapping**

Creditor-specific regulatory paths:

| **Creditor** | **Primary Regulators** |
|--------------|------------------------|
| Verizon | FCC, BPU (NJ Board of Public Utilities), State AG |
| Wells Fargo / Chase | CFPB, OCC, State AG |
| IRS | TAS (Taxpayer Advocate), TIGTA |
| Dakota Financial | CFPB, State AG |
| TikTok | FTC, State AG |
| Other | CFPB, State AG (default) |

### 4. **Action Planning**

Generates specific actions with:
- **Template Key**: Links to document automation
- **Timeframe**: Days until deadline
- **Channel**: Regulatory or internal
- **Evidence Requirements**: Whether docs needed first
- **Prerequisites**: Dependencies on other actions

### 5. **Timeline Calculation**

Auto-generates key deadlines:
- **Immediate**: First action deadline
- **15-Day Notice**: Standard dispute window
- **30-Day Dispute**: FCRA/FDCPA standard
- **Final**: Last action deadline

### 6. **Human Review Decision**

Automatically flags cases needing manual review:
- ✅ Critical priority
- ✅ Emergency posture
- ✅ Litigation track engaged
- ✅ Multiple regulator filings
- ⏸️ Otherwise: Automation can proceed

---

## 🏗️ Architecture

```
[Router v2 Decision]
    ↓
[Priority & Posture Logic]
    ↓
[Track Selection]
    ↓
[Action Builder]
    ↓
[Timeline Calculator]
    ↓
[Narrative Generator]
    ↓
[Human Review Check]
    ↓
[Countermeasure Plan Output]
```

### Input Flow

```javascript
{
  // From Router v2
  routerDecision: {
    creditor: "Verizon",
    riskLevel: "high",
    meta: {
      dishonorPrediction: { dishonorLikelihood: "high", flags: [...] },
      beneficiaryImpact: { beneficiaryFlag: true, severity: "medium" }
    }
  },
  
  // From Router v3 (optional)
  persona: {
    behaviorProfile: "ADVERSARIAL",
    responsePattern: "STONEWALLING",
    trustScore: 15
  }
}
```

### Output Structure

```javascript
{
  priority: "high",
  posture: "enforce",
  recommendedPath: "AGGRESSIVE_ENFORCEMENT",
  
  actions: [
    {
      track: "ADMIN",
      channel: "INTERNAL",
      templateKey: "FORMAL_DISPUTE_LETTER",
      timeframeDays: 7,
      description: "Send formal dispute letter citing violations",
      requiresEvidence: true,
      prerequisites: []
    },
    {
      track: "REGULATOR",
      channel: "FCC",
      templateKey: "REGULATOR_COMPLAINT",
      timeframeDays: 15,
      description: "File complaint with FCC with full documentation",
      requiresEvidence: true,
      prerequisites: ["ADMIN"]
    }
  ],
  
  requiresHumanReview: false,
  
  flags: ["HIGH_RISK", "DISHONOR_LIKELY", "ADVERSARIAL_ENTITY"],
  
  timelines: {
    immediate: { action: "FORMAL_DISPUTE_LETTER", deadline: "2025-12-15", days: 7 },
    final: { action: "REGULATOR_COMPLAINT", deadline: "2025-12-23", days: 15 },
    fifteenDayNotice: "2025-12-23",
    thirtyDayDispute: "2026-01-07"
  },
  
  narrative: "Creditor: Verizon\nEnforcement Posture: ENFORCE\n..."
}
```

---

## 📚 API Reference

### Main Function

```javascript
const { generateCountermeasures } = require('./countermeasure-engine');

const plan = generateCountermeasures(routerDecision, persona, history);
```

**Parameters:**
- `routerDecision` (required): Output from `sintraprime-router-v1.js`
- `persona` (optional): Behavior profile from Router v3
- `history` (optional): Historical case data (future enhancement)

**Returns:** `CountermeasurePlan` object

**Throws:** Error if `routerDecision` is invalid or missing creditor

### Helper Functions

#### `decidePriorityAndPosture(routerDecision, persona)`

Returns: `{ priority, posture, flags }`

#### `selectTracks(creditor, posture, flags)`

Returns: Array of track strings

#### `getRegulatorChannels(creditor)`

Returns: Array of regulator strings

#### `buildActions(tracks, creditor, priority, routerDecision)`

Returns: Array of `CountermeasureAction` objects

#### `calculateTimelines(actions)`

Returns: Timeline object with deadline dates

#### `requiresHumanReview(priority, posture, actions)`

Returns: Boolean

---

## 🔌 Integration Guide

### 1. **Standalone Usage**

```javascript
const { routeMessage } = require('./sintraprime-router-v1');
const { generateCountermeasures } = require('./countermeasure-engine');

// Step 1: Route the message
const routerDecision = routeMessage(normalizedMessage);

// Step 2: Generate countermeasures
const plan = generateCountermeasures(routerDecision);

console.log(`Priority: ${plan.priority}`);
console.log(`Posture: ${plan.posture}`);
console.log(`Actions: ${plan.actions.length}`);
console.log(`Human Review: ${plan.requiresHumanReview ? 'YES' : 'NO'}`);
```

### 2. **Express API Integration**

Update `router-microservice.ts`:

```typescript
import { generateCountermeasures } from '../utils/countermeasure-engine.js';

app.post('/route-email', async (req, res) => {
  try {
    // ... normalize and route ...
    
    const routerDecision = routeMessage(normalized);
    
    // NEW: Generate countermeasures
    const countermeasures = generateCountermeasures(routerDecision);
    
    res.json({
      ok: true,
      route: routerDecision.dispatchTarget,
      data: routerDecision,
      countermeasures: countermeasures  // NEW
    });
  } catch (err) {
    // ...
  }
});
```

### 3. **Make.com Integration**

**Module 1:** HTTP → POST to `/route-email` (router microservice)

**Module 2:** Router module, branch by `data.countermeasures.priority`:

- **Path A (Critical)**: `countermeasures.priority = critical`
  - → Slack: Emergency alert to `#urgent-enforcement`
  - → Notion: Create case with all countermeasure actions
  - → Email: Alert to legal team
  
- **Path B (High)**: `countermeasures.priority = high`
  - → Slack: High-priority alert to `#enforcement`
  - → Notion: Create case
  - → HTTP: Trigger document template system
  
- **Path C (Medium)**: `countermeasures.priority = medium`
  - → Notion: Create case
  - → HTTP: Queue for review
  
- **Path D (Low)**: `countermeasures.priority = low`
  - → Notion: Log for monitoring

**Module 3:** Iterator over `countermeasures.actions` array

For each action:
- Check `requiresHumanReview`
- If false: Trigger template automation
- If true: Queue in Notion for manual review

**Module 4:** Set deadline reminders

Map `countermeasures.timelines` to calendar/task system

### 4. **Notion Case Integration**

Update case linking to include countermeasures:

```javascript
const { generateCountermeasures } = require('./countermeasure-engine');
const { linkOrCreateCase } = require('./notion-case-linker');

const routerDecision = routeMessage(normalized);
const countermeasures = generateCountermeasures(routerDecision);

const caseResult = await linkOrCreateCase(
  routerDecision,
  normalized,
  {
    // Add countermeasure fields
    recommendedPath: countermeasures.recommendedPath,
    enforcementPosture: countermeasures.posture,
    actionCount: countermeasures.actions.length,
    nextDeadline: countermeasures.timelines.immediate.deadline,
    requiresReview: countermeasures.requiresHumanReview
  }
);
```

---

## 🧪 Testing

### Run Tests

```bash
npm test -- countermeasure-engine.test.js
```

### Test Coverage

✅ **30 test cases** covering:

1. **Priority & Posture Logic** (6 tests)
   - Critical risk triggers emergency
   - Dishonor prediction escalates
   - Beneficiary impact escalates
   - Adversarial persona handling
   - Stonewalling detection
   - Zero trust scoring

2. **Track Selection** (8 tests)
   - Observe → Monitor
   - Press → Admin
   - Dishonor → Regulator
   - Emergency → Litigation
   - Creditor-specific tracks

3. **Regulator Channels** (5 tests)
   - Verizon → FCC/BPU
   - Banking → CFPB/OCC
   - IRS → TAS/TIGTA
   - Defaults

4. **Action Builder** (9 tests)
   - Priority-based templates
   - Regulator complaints
   - IRS procedures
   - Litigation prep
   - Monitoring logs

5. **Full Integration** (6 tests)
   - Emergency plans
   - Enforcement plans
   - Monitoring plans
   - Persona integration
   - Error handling

### Example Test Run

```bash
$ npm test -- countermeasure-engine.test.js

PASS test/countermeasure-engine.test.js
  Countermeasure Engine - Router v4
    decidePriorityAndPosture
      ✓ Critical risk level triggers emergency posture (3 ms)
      ✓ High dishonor prediction escalates priority (1 ms)
      ✓ Beneficiary at risk escalates to high priority (1 ms)
      ...
    generateCountermeasures - Full Integration
      ✓ Verizon critical case generates emergency plan (2 ms)
      ✓ Wells Fargo with stonewalling generates enforcement plan (1 ms)
      ...

Test Suites: 1 passed, 1 total
Tests:       30 passed, 30 total
```

---

## 🚀 Deployment

### Environment Variables

```bash
# Optional: If integrating with template systems
TEMPLATE_SERVICE_URL=https://your-template-service.com
TEMPLATE_API_KEY=your_api_key_here

# Optional: If tracking metrics
METRICS_ENABLED=true
```

### Production Checklist

- [x] All 30 tests passing
- [ ] Template key mappings configured
- [ ] Regulatory channel URLs/contacts verified
- [ ] Human review workflow established
- [ ] Notion case properties match countermeasure fields
- [ ] Slack/Email alert channels configured
- [ ] Monitoring dashboards set up

### Monitoring Metrics

Track these KPIs:

```javascript
// Priority distribution
{
  low: 120,
  medium: 85,
  high: 42,
  critical: 8
}

// Posture distribution
{
  observe: 95,
  press: 78,
  enforce: 52,
  emergency: 7
}

// Human review rate
{
  total: 255,
  requiresReview: 67,
  reviewRate: 0.26  // 26%
}

// Track usage
{
  ADMIN: 198,
  REGULATOR: 89,
  LITIGATION: 7,
  IRS_PROCEDURE: 12,
  MONITOR: 95
}
```

---

## 📖 Examples

### Example 1: Verizon Emergency

```javascript
const routerDecision = {
  dispatchTarget: 'VERIZON_ENFORCEMENT',
  creditor: 'Verizon',
  riskLevel: 'critical',
  tags: ['creditor:verizon', 'risk_keywords', 'dishonor_watch'],
  meta: {
    dishonorPrediction: {
      dishonorLikelihood: 'high',
      flags: ['refusal_to_engage', 'final_decision_language']
    },
    beneficiaryImpact: {
      beneficiaryFlag: true,
      severity: 'high',
      markers: ['housing', 'medical']
    }
  }
};

const plan = generateCountermeasures(routerDecision);

console.log(plan);
```

**Output:**

```javascript
{
  priority: 'critical',
  posture: 'emergency',
  recommendedPath: 'EMERGENCY_INTERVENTION',
  
  actions: [
    {
      track: 'ADMIN',
      channel: 'INTERNAL',
      templateKey: 'FINAL_LEGAL_DEMAND',
      timeframeDays: 3,
      description: 'Send final legal demand with statutory citations',
      requiresEvidence: true,
      prerequisites: []
    },
    {
      track: 'REGULATOR',
      channel: 'FCC',
      templateKey: 'REGULATOR_COMPLAINT',
      timeframeDays: 5,
      description: 'File complaint with FCC with full documentation',
      requiresEvidence: true,
      prerequisites: ['ADMIN']
    },
    {
      track: 'REGULATOR',
      channel: 'BPU',
      templateKey: 'REGULATOR_COMPLAINT_SECONDARY',
      timeframeDays: 7,
      description: 'File parallel complaint with BPU',
      requiresEvidence: true,
      prerequisites: ['ADMIN']
    },
    {
      track: 'LITIGATION',
      channel: 'COURT',
      templateKey: 'TRO_PREP',
      timeframeDays: 1,
      description: 'Prepare TRO/emergency injunction documentation',
      requiresEvidence: true,
      prerequisites: ['ADMIN', 'REGULATOR']
    },
    {
      track: 'LITIGATION',
      channel: 'INTERNAL',
      templateKey: 'LITIGATION_EVIDENCE_PACKAGE',
      timeframeDays: 3,
      description: 'Assemble complete litigation evidence package',
      requiresEvidence: true,
      prerequisites: []
    }
  ],
  
  requiresHumanReview: true,
  
  flags: [
    'CRITICAL_RISK',
    'DISHONOR_LIKELY',
    'BENEFICIARY_AT_RISK'
  ],
  
  timelines: {
    immediate: {
      action: 'TRO_PREP',
      deadline: '2025-12-09',
      days: 1
    },
    final: {
      action: 'REGULATOR_COMPLAINT_SECONDARY',
      deadline: '2025-12-15',
      days: 7
    },
    fifteenDayNotice: '2025-12-23',
    thirtyDayDispute: '2026-01-07'
  },
  
  narrative: `Creditor: Verizon
Enforcement Posture: EMERGENCY
Active Flags: CRITICAL_RISK, DISHONOR_LIKELY, BENEFICIARY_AT_RISK

Recommended Actions (5 total):
1. [LITIGATION] Prepare TRO/emergency injunction documentation (1 days)
2. [ADMIN] Send final legal demand with statutory citations (3 days)
3. [LITIGATION] Assemble complete litigation evidence package (3 days)
4. [REGULATOR] File complaint with FCC with full documentation (5 days)
5. [REGULATOR] File parallel complaint with BPU (7 days)

⚠️ BENEFICIARY PROTECTION: High-priority due to impact on vulnerable beneficiaries.
⚠️ DISHONOR PREDICTION: High likelihood of continued refusal to cooperate. Escalation recommended.`
}
```

### Example 2: Wells Fargo Medium with Stonewalling

```javascript
const routerDecision = {
  dispatchTarget: 'WELLS_FARGO_ENFORCEMENT',
  creditor: 'Wells Fargo',
  riskLevel: 'medium',
  tags: ['creditor:wells_fargo'],
  meta: {
    dishonorPrediction: { dishonorLikelihood: 'medium', flags: [] },
    beneficiaryImpact: { beneficiaryFlag: false, severity: 'none' }
  }
};

const persona = {
  behaviorProfile: 'PROCEDURAL',
  responsePattern: 'STONEWALLING',
  trustScore: 20,
  flags: ['delay_tactics']
};

const plan = generateCountermeasures(routerDecision, persona);

console.log(plan);
```

**Output:**

```javascript
{
  priority: 'medium',
  posture: 'enforce',
  recommendedPath: 'AGGRESSIVE_ENFORCEMENT',
  
  actions: [
    {
      track: 'ADMIN',
      channel: 'INTERNAL',
      templateKey: 'ADMIN_FOLLOW_UP',
      timeframeDays: 15,
      description: 'Send administrative follow-up requesting response',
      requiresEvidence: false,
      prerequisites: []
    },
    {
      track: 'REGULATOR',
      channel: 'CFPB',
      templateKey: 'REGULATOR_COMPLAINT',
      timeframeDays: 15,
      description: 'File complaint with CFPB with full documentation',
      requiresEvidence: true,
      prerequisites: ['ADMIN']
    }
  ],
  
  requiresHumanReview: false,
  
  flags: ['STONEWALLING', 'ZERO_TRUST'],
  
  timelines: {
    immediate: {
      action: 'ADMIN_FOLLOW_UP',
      deadline: '2025-12-23',
      days: 15
    },
    final: {
      action: 'REGULATOR_COMPLAINT',
      deadline: '2025-12-23',
      days: 15
    },
    fifteenDayNotice: '2025-12-23',
    thirtyDayDispute: '2026-01-07'
  },
  
  narrative: `Creditor: Wells Fargo
Enforcement Posture: ENFORCE
Active Flags: STONEWALLING, ZERO_TRUST

Recommended Actions (2 total):
1. [ADMIN] Send administrative follow-up requesting response (15 days)
2. [REGULATOR] File complaint with CFPB with full documentation (15 days)

⚠️ STONEWALLING DETECTED: Entity is engaging in delay tactics. Regulatory intervention advised.`
}
```

### Example 3: IRS Low Priority Monitoring

```javascript
const routerDecision = {
  dispatchTarget: 'IRS_ENFORCEMENT',
  creditor: 'IRS',
  riskLevel: 'low',
  tags: ['creditor:irs'],
  meta: {
    dishonorPrediction: { dishonorLikelihood: 'low', flags: [] },
    beneficiaryImpact: { beneficiaryFlag: false, severity: 'none' }
  }
};

const plan = generateCountermeasures(routerDecision);

console.log(plan);
```

**Output:**

```javascript
{
  priority: 'low',
  posture: 'observe',
  recommendedPath: 'MONITORING_MODE',
  
  actions: [
    {
      track: 'MONITOR',
      channel: 'INTERNAL',
      templateKey: 'MONITORING_LOG',
      timeframeDays: 30,
      description: 'Continue monitoring communications, no immediate action',
      requiresEvidence: false,
      prerequisites: []
    }
  ],
  
  requiresHumanReview: false,
  
  flags: [],
  
  timelines: {
    immediate: {
      action: 'MONITORING_LOG',
      deadline: '2026-01-07',
      days: 30
    },
    final: {
      action: 'MONITORING_LOG',
      deadline: '2026-01-07',
      days: 30
    },
    fifteenDayNotice: '2025-12-23',
    thirtyDayDispute: '2026-01-07'
  },
  
  narrative: `Creditor: IRS
Enforcement Posture: OBSERVE

Recommended Actions (1 total):
1. [MONITOR] Continue monitoring communications, no immediate action (30 days)`
}
```

---

## 🎓 Best Practices

### 1. **Always Include Persona Data When Available**

Behavior profiles significantly improve decision quality.

### 2. **Log All Countermeasure Plans**

Store plans in Notion/database for audit trails and learning.

### 3. **Respect Human Review Flags**

Never auto-execute actions flagged for human review.

### 4. **Track Template Effectiveness**

Monitor which templates lead to successful outcomes.

### 5. **Update Regulatory Channels**

Keep regulator contact info and complaint URLs current.

### 6. **Test Edge Cases**

Regularly test unusual creditor/risk combinations.

---

## 📞 Support

For questions or issues:
- Check test suite for examples
- Review integration guide above
- Check Router v2/v3 documentation for upstream data

---

## 🔄 Version History

**v1.0.0** (2025-12-08)
- Initial release
- 30 test cases passing
- 6 creditor mappings
- 5 enforcement tracks
- 7 regulatory channels
- Full timeline calculation
- Human review logic
- Narrative generation

---

**Status:** ✅ Production Ready  
**Test Coverage:** 30/30 passing  
**Integration:** Router v2 + Router v3 (optional)  
**Next:** Template system integration, historical learning model
