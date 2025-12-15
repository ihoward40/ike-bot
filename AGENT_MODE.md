# SintraPrime Agent Mode

**Agent mode = intent → plan → tools → memory → verification → persistence**

SintraPrime now implements full autonomous agent capabilities, transforming from a monitoring system into a task-owning operator that can handle complex workflows without constant human intervention.

## Core Principle

**Agent mode is a loop, not a feature.**

1. User states an outcome (not a prompt)
2. Agent interprets intent
3. Agent breaks it into steps
4. Agent selects tools
5. Agent executes
6. Agent checks results
7. Agent stores memory
8. Agent re-acts later without being reminded

## Architecture

### 1. Intent Router 🧭

Classifies incoming requests into 8 work types:

- **research** - Gather information, analyze data
- **execute** - Perform actions, make changes
- **monitor** - Watch for conditions, track state
- **draft** - Create documents, content
- **dispute** - Handle complaints, disputes
- **automate** - Set up automation workflows
- **escalate** - Escalate to human or higher authority
- **wait_and_recheck** - Schedule future check-ins

**Example:**
```bash
curl -X POST http://localhost:3000/api/agent/classify \
  -H "Content-Type: application/json" \
  -d '{"input":"Research credit bureau regulations"}'

# Returns:
{
  "type": "research",
  "confidence": 0.9,
  "reasoning": "Input requests information gathering or analysis",
  "requiresHumanApproval": false
}
```

### 2. Planning Engine 📋

Creates execution plans with:
- **Step graphs** (not just lists)
- **Dependencies** (which steps must complete first)
- **Stop conditions** (when to halt)
- **Failover paths** (alternatives if step fails)

**Example Plan for "File CFPB complaint":**
```
1. Verify Facts → 2. Pull Account Data
                ↓
3. Draft Narrative ← 4. Select Regulator
                ↓
5. Generate Submission
                ↓
6. Log Case
                ↓
7. Schedule Follow-up (30 days)
```

Each step has:
- Estimated duration
- Dependencies
- Failover options
- Status tracking

### 3. Tool Authority 🛠️

Autonomous tool execution without re-asking:

| Tool | Risk Level | Approval Required |
|------|-----------|------------------|
| filesystem_read | Low | No |
| database_query | Low | No |
| api_call | Low | No |
| calendar_schedule | Low | No |
| filesystem_write | Medium | Yes |
| database_write | Medium | Yes |
| make_com_execute | Medium | Yes |
| email_send | Medium | Yes |
| webhook_trigger | Medium | Yes |

**Grant Tool Approval:**
```bash
curl -X POST http://localhost:3000/api/agent/tools/email_send/approve
```

Low-risk tools are automatically approved. Medium/high-risk tools require explicit approval.

### 4. State Machine 🔄

Persistent task state management across sessions:

```
CREATED → PLANNING → AWAITING_APPROVAL → EXECUTING
                                              ↓
                           PAUSED ← → WAITING
                                ↓           ↓
                           COMPLETED / FAILED / CANCELLED
```

Tasks persist across server restarts. State saved to `memory/task_state.json`.

**Task States:**
- `created` - Task initialized
- `planning` - Generating execution plan
- `awaiting_approval` - Requires human approval
- `executing` - Currently running steps
- `paused` - Temporarily halted
- `waiting` - Waiting for condition (time/event)
- `completed` - Successfully finished
- `failed` - Execution failed
- `cancelled` - User cancelled

### 5. Context Memory 🧠

Cross-session contextual recall:

- **Facts** - Verified information
- **Preferences** - User choices and patterns
- **History** - Conversation and action log
- **Relationships** - Entity connections

Memory persists to `memory/context_memory.json`.

**Access Tracking:**
- Most frequently accessed entries prioritized
- Recently used entries kept accessible
- Automatic pruning of old/unused context

## API Reference

### Process Input
```bash
POST /api/agent/process
{
  "input": "File a CFPB complaint",
  "userId": "user123",
  "autoExecute": false
}
```

Returns plan and task ID. If `requiresHumanApproval`, task enters `awaiting_approval` state.

### Approve Task
```bash
POST /api/agent/tasks/{taskId}/approve
{
  "userId": "user123"
}
```

Transitions task to `executing` and runs the plan.

### Get Task Status
```bash
GET /api/agent/tasks/{taskId}
```

Returns complete task details including state, plan, and progress.

### List Tasks
```bash
GET /api/agent/tasks?state=awaiting_approval
```

Filter by state: `created`, `planning`, `awaiting_approval`, `executing`, `completed`, `failed`

### Get User Context
```bash
GET /api/agent/context/{userId}
```

Returns context summary with facts, preferences, and recent interactions.

### Get Conversation History
```bash
GET /api/agent/history/{userId}?limit=10
```

Retrieves conversation history for user.

### Get Agent Stats
```bash
GET /api/agent/stats
```

Returns:
- Task counts by state
- Memory statistics
- Tool availability
- Execution history

## Usage Examples

### Example 1: Research Task
```bash
curl -X POST http://localhost:3000/api/agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Research FCRA Section 609 requirements",
    "userId": "legal_team"
  }'
```

Agent:
1. Classifies as `research`
2. Creates plan with gather/analyze/synthesize steps
3. Executes immediately (low risk)
4. Returns findings

### Example 2: Dispute Filing (Requires Approval)
```bash
# Step 1: Submit request
curl -X POST http://localhost:3000/api/agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "input": "File complaint with CFPB about XYZ Bank",
    "userId": "beneficiary_001"
  }'

# Returns: taskId and "Requires approval to execute"

# Step 2: Review plan and approve
curl -X POST http://localhost:3000/api/agent/tasks/task_123/approve \
  -H "Content-Type: application/json" \
  -d '{"userId": "beneficiary_001"}'

# Agent executes:
# 1. Verifies facts
# 2. Pulls account data  
# 3. Drafts narrative
# 4. Selects CFPB as regulator
# 5. Generates submission
# 6. Logs case
# 7. Schedules 30-day follow-up
```

### Example 3: Monitoring Task
```bash
curl -X POST http://localhost:3000/api/agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Monitor credit report for changes daily",
    "userId": "monitoring_service"
  }'
```

Agent:
1. Classifies as `monitor`
2. Sets up monitoring configuration
3. Runs continuous checks
4. Alerts on changes detected

### Example 4: Scheduled Follow-up
```bash
curl -X POST http://localhost:3000/api/agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Remind me to check dispute status in 30 days",
    "userId": "user_abc"
  }'
```

Agent:
1. Classifies as `wait_and_recheck`
2. Creates task with wait condition
3. Sets state to `waiting`
4. Automatically resumes after 30 days
5. Executes check action

## Integration Patterns

### With Webhooks
```typescript
app.post("/webhooks/make", async (req, res) => {
  const { action, data } = req.body;
  
  // Process through agent
  const result = await agentCore.processInput(
    `${action}: ${JSON.stringify(data)}`,
    "webhook_user",
    true // auto-execute if approved
  );
  
  res.json(result);
});
```

### With Existing APIs
```typescript
app.post("/api/credit-disputes", async (req, res) => {
  // Traditional API call
  const dispute = await creditDisputeService.create(req.body);
  
  // Also process through agent for follow-up tracking
  await agentCore.processInput(
    `Monitor dispute ${dispute.id} and follow up in 30 days`,
    req.user.id
  );
  
  res.json(dispute);
});
```

### Programmatic Use
```typescript
import { agentCore } from "./sintraPrime";

// Process user request
const result = await agentCore.processInput(
  "Draft a letter disputing this charge",
  userId
);

if (result.plan) {
  console.log(`Plan created with ${result.plan.steps.length} steps`);
  console.log(`Task ID: ${result.taskId}`);
}

// Later, approve and execute
if (userApproves) {
  await agentCore.approveAndExecute(result.taskId, userId);
}
```

## Monitoring

### Agent Health
```bash
# Check agent status
curl http://localhost:3000/api/agent/stats

# View active tasks
curl http://localhost:3000/api/agent/tasks?state=executing

# Check memory usage
curl http://localhost:3000/api/agent/context/system
```

### Task Lifecycle
```bash
# Track task through states
watch 'curl -s http://localhost:3000/api/agent/tasks/task_123 | jq .state'

# View task history
curl http://localhost:3000/api/agent/tasks/task_123 | jq '.history'
```

### Event Logs
All agent activity logged to:
- `memory/events_YYYY-MM-DD.jsonl` - Daily event log
- `memory/task_state.json` - Persistent task state
- `memory/context_memory.json` - User context and history
- `logs/heartbeat.log` - System health

## Configuration

### Periodic Check Interval
Agent checks for waiting tasks every 60 seconds (configurable in `core/index.ts`):

```typescript
agentCore.startPeriodicCheck(60000); // 60 seconds
```

### Memory Limits
- Max context entries per user: 1000
- Max conversation history: 100 items
- Old completed tasks cleaned after 30 days

### Tool Approvals
Grant batch approvals for trusted operations:

```typescript
import { toolAuthority } from "./sintraPrime";

// Approve multiple tools
["filesystem_write", "email_send", "calendar_schedule"].forEach(tool => {
  toolAuthority.grantToolApproval(tool);
});
```

## Best Practices

### 1. Clear Intent Statements
✅ Good: "File a CFPB complaint about account 12345"
❌ Bad: "Can you help me with something about my account?"

### 2. Appropriate Auto-Execute Settings
- `autoExecute: false` for critical operations (default)
- `autoExecute: true` for trusted users/operations

### 3. Context Management
```typescript
// Store important context
contextMemory.storeContext(
  userId,
  "preferred_communication",
  "email",
  "preference"
);

// Reference in conversations
const prefs = contextMemory.getContextByType(userId, "preference");
```

### 4. Tool Safety
- Always require approval for write operations
- Use low-risk tools for exploratory tasks
- Implement audit logging for sensitive tools

### 5. Task Monitoring
- Check `awaiting_approval` tasks regularly
- Monitor `failed` tasks for patterns
- Review `waiting` tasks for appropriate timing

## Security Considerations

### Approval Requirements
- Execution tasks require approval by default
- Database writes require approval
- Email sends require approval
- File system writes require approval

### Input Validation
- All inputs sanitized before classification
- Tool parameters validated before execution
- Stop conditions checked at each step

### Audit Trail
- Every action logged with timestamp
- Task history preserved
- Tool execution tracked
- User context changes recorded

## Future Enhancements

- [ ] LLM integration for advanced intent understanding
- [ ] Multi-agent collaboration
- [ ] Workflow templates library
- [ ] Advanced context reasoning
- [ ] Tool approval policies
- [ ] Scheduled task management UI
- [ ] Performance metrics dashboard
- [ ] Custom tool plugins

## Troubleshooting

### Task Stuck in "executing"
```bash
# Check task details
curl http://localhost:3000/api/agent/tasks/{taskId}

# View last step executed
# If needed, cancel and retry
```

### Memory Growing Large
```bash
# Clean old tasks
stateMachine.cleanupOldTasks(30); // Remove tasks older than 30 days

# Clear user context
contextMemory.clearContext(userId);
```

### Tool Execution Failing
```bash
# Check tool availability
curl http://localhost:3000/api/agent/tools

# Verify approvals
# Grant approval if needed
curl -X POST http://localhost:3000/api/agent/tools/{toolName}/approve
```

---

**SintraPrime Agent Mode: Task-Owning Autonomous Operation**

Not just better answers. Complete workflow execution with memory, persistence, and follow-through.
