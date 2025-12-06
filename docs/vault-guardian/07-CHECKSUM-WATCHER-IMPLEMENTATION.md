# VAULT_GUARDIAN_CHECKSUM_WATCHER_v1.1 Implementation Guide

## Overview

This guide provides ready-to-deploy Make.com scenario configurations for VAULT_GUARDIAN_CHECKSUM_WATCHER_v1.1, which monitors Notion databases for integrity, validates checksums, detects anomalies, and alerts via Slack.

**Phase**: 2 (Enhancement to base Vault Guardian system)  
**Purpose**: Proactive integrity monitoring with automated checksum validation  
**Trigger**: Scheduled (every 15 minutes) or Webhook (real-time)  
**Modules**: 8 modules with routers and error handling

## Hybrid Approach Recommendation

**For Solo Operators** ($1k-$5k/month revenue):
- ✅ Build core scenarios with AI assistance (this guide)
- ✅ Start with essential monitoring and alerting
- ✅ Use included handoff kit for maintenance

**For Scaling Operations** ($10k+/month):
- 📋 Vendor brief included in [Appendix A](#appendix-a-vendor-brief)
- 📋 Enterprise-grade features in Phase Four
- 📋 Advanced ML integration options

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│         VAULT_GUARDIAN_CHECKSUM_WATCHER_v1.1                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [1] Notion Database Search                                 │
│         ↓                                                    │
│  [2] Calculate & Compare Checksums                          │
│         ↓                                                    │
│  [3] Router: Validation Decision                            │
│         ↓           ↓              ↓                        │
│    Match       Mismatch       Missing                       │
│         ↓           ↓              ↓                        │
│  [4] Update    [5] Alert     [6] Generate                   │
│    Valid       Anomaly        Checksum                      │
│         ↓           ↓              ↓                        │
│  [7] Audit Log (Google Sheets)                              │
│         ↓                                                    │
│  [8] Error Handler (Fallback)                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

Before building this scenario:

- [ ] **Notion Database Ready**
  - Template_Mappings database created
  - Properties: `Last_Updated`, `Status`, `Template_Name`, `Guardian_Checksum`, `Google_Template_ID`
  - Add properties: `Last_Validated` (Date), `Validation_Status` (Select)

- [ ] **Google Sheets Audit Log**
  - Sheet name: `Checksum_Validation_Log`
  - Columns: Timestamp, Template_Name, Notion_ID, Original_Checksum, Calculated_Checksum, Status, Route, Executor

- [ ] **Slack Integration**
  - Channel: `#guardian-logs` created
  - Bot token configured in Make.com
  - User IDs collected for mentions

- [ ] **Make.com Account**
  - Pro or higher subscription
  - Notion connection authorized
  - Google Sheets connection authorized
  - Slack connection authorized

---

## Module 1: Notion > Search Database Items

**Purpose**: Retrieve recent records from Template_Mappings database for validation

### Configuration

```json
{
  "connection": "IKE Solutions Trust Automation",
  "database_id": "{{YOUR_NOTION_TEMPLATE_DB_ID}}",
  "filter": {
    "and": [
      {
        "property": "Last_Updated",
        "date": {
          "after": "{{addMinutes(now; -15)}}"
        }
      },
      {
        "property": "Status",
        "select": {
          "equals": "Synced"
        }
      }
    ]
  },
  "sorts": [
    {
      "property": "Last_Updated",
      "direction": "descending"
    }
  ],
  "page_size": 100
}
```

### Output Variables

Map these for use in subsequent modules:

```yaml
{{1.id}} - Notion page ID
{{1.properties.Template_Name.title[0].plain_text}} - Template name
{{1.properties.Guardian_Checksum.rich_text[0].plain_text}} - Stored checksum
{{1.properties.Last_Updated.date.start}} - Last update timestamp
{{1.properties.Google_Template_ID.rich_text[0].plain_text}} - Google Doc ID
{{1.properties.Status.select.name}} - Current status
```

### Notes

- Filter retrieves records updated in last 15 minutes
- Only processes records with Status = "Synced"
- Sorts by Last_Updated (most recent first)
- Adjust `page_size` based on expected volume

---

## Module 2: Tools > Set Multiple Variables

**Purpose**: Calculate fresh checksum and prepare comparison data

### Configuration

```json
{
  "variables": [
    {
      "name": "original_checksum",
      "value": "{{1.properties.Guardian_Checksum.rich_text[0].plain_text}}"
    },
    {
      "name": "template_id",
      "value": "{{1.properties.Google_Template_ID.rich_text[0].plain_text}}"
    },
    {
      "name": "template_name",
      "value": "{{1.properties.Template_Name.title[0].plain_text}}"
    },
    {
      "name": "calculated_checksum",
      "value": "{{sha256(1.id + 1.properties.Template_Name.title[0].plain_text + 1.properties.Google_Template_ID.rich_text[0].plain_text)}}"
    }
  ]
}
```

### Output Variables

```yaml
{{2.original_checksum}} - Stored checksum from Notion
{{2.calculated_checksum}} - Freshly calculated checksum using SHA-256
{{2.template_name}} - Template name for alerts
{{2.template_id}} - Google Template ID for reference
```

### Checksum Algorithm

The checksum is calculated by concatenating:
1. Notion page ID (`1.id`)
2. Template Name (`Template_Name.title[0].plain_text`)
3. Google Template ID (`Google_Template_ID.rich_text[0].plain_text`)

Then applying SHA-256 hash function.

**Example**:
```
Input: "abc-123" + "Trust Document Template" + "1a2b3c4d"
Output: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
```

---

## Module 3: Router (Decision Point)

**Purpose**: Route based on checksum validation result

### Route Configuration

#### Route 1: Checksum Match ✅ (Valid)

**Filter Condition**:
```json
{
  "name": "Checksum Match",
  "conditions": [
    [
      {
        "a": "{{2.original_checksum}}",
        "o": "text:equal",
        "b": "{{2.calculated_checksum}}"
      }
    ]
  ]
}
```

**Next Module**: Module 4 (Update Valid Status)

#### Route 2: Checksum Mismatch 🚨 (Anomaly)

**Filter Condition**:
```json
{
  "name": "Checksum Mismatch",
  "conditions": [
    [
      {
        "a": "{{2.original_checksum}}",
        "o": "text:notequal",
        "b": "{{2.calculated_checksum}}"
      },
      {
        "a": "{{length(2.original_checksum)}}",
        "o": "number:greater",
        "b": "0"
      }
    ]
  ]
}
```

**Next Module**: Module 5 (Alert & Auto-Heal)

#### Route 3: Missing Checksum ⚠️ (New Record)

**Filter Condition**:
```json
{
  "name": "Missing Checksum",
  "conditions": [
    [
      {
        "a": "{{length(2.original_checksum)}}",
        "o": "number:equal",
        "b": "0"
      }
    ]
  ]
}
```

**Next Module**: Module 6 (Generate Checksum)

### Routing Logic Summary

| Condition | Original Checksum | Calculated Checksum | Route | Action |
|-----------|------------------|---------------------|-------|--------|
| **Match** | Present & Equal | Matches original | Route 1 | Update validation timestamp |
| **Mismatch** | Present | Different from original | Route 2 | Alert team, trigger auto-heal |
| **Missing** | Empty/Null | Calculated | Route 3 | Generate and store checksum |

---

## Module 4: Notion > Update Database Item (Success Path)

**Purpose**: Update validation timestamp for valid records

### Configuration

```json
{
  "connection": "IKE Solutions Trust Automation",
  "page_id": "{{1.id}}",
  "properties": {
    "Last_Validated": {
      "date": {
        "start": "{{now}}"
      }
    },
    "Validation_Status": {
      "select": {
        "name": "Valid"
      }
    }
  }
}
```

### Properties Updated

- **Last_Validated**: Current timestamp
- **Validation_Status**: Set to "Valid"

### Expected Outcome

Records with matching checksums are marked as validated without triggering alerts. This confirms data integrity.

---

## Module 5: Slack > Post Message (Anomaly Alert)

**Purpose**: Alert team of checksum mismatch indicating potential data corruption

### Configuration

```json
{
  "connection": "Vault Guardian Bot",
  "channel": "#guardian-logs",
  "text": "🚨 *VAULT GUARDIAN ALERT: Checksum Anomaly Detected* 🚨\n\n⚠️ **Template:** {{2.template_name}}\n🆔 **Notion ID:** {{1.id}}\n🔐 **Expected Checksum:** `{{2.original_checksum}}`\n❌ **Calculated Checksum:** `{{2.calculated_checksum}}`\n🕐 **Detected:** {{formatDate(now; 'YYYY-MM-DD HH:mm:ss')}} EST\n\n🛡️ *Auto-heal protocol initiated. Manual review required.*\n\n<@U024BE7LH>",
  "username": "Vault Guardian",
  "icon_emoji": ":warning:",
  "mrkdwn": true
}
```

### Alert Message Breakdown

**Header**: 🚨 Indicates high-priority alert  
**Template Name**: Identifies which template has the issue  
**Notion ID**: Direct link to affected record  
**Checksums**: Shows expected vs. calculated for comparison  
**Timestamp**: When anomaly was detected  
**User Mention**: Alerts specific team member (@U024BE7LH)

### Customization

Replace `<@U024BE7LH>` with your Slack user ID:
1. Go to Slack profile
2. Click "..." → Copy Member ID
3. Format as `<@USER_ID>`

---

## Module 6: Notion > Update Database Item (Generate Missing Checksum)

**Purpose**: Auto-generate checksum for new records that don't have one

### Configuration

```json
{
  "connection": "IKE Solutions Trust Automation",
  "page_id": "{{1.id}}",
  "properties": {
    "Guardian_Checksum": {
      "rich_text": [
        {
          "text": {
            "content": "{{2.calculated_checksum}}"
          }
        }
      ]
    },
    "Last_Validated": {
      "date": {
        "start": "{{now}}"
      }
    },
    "Validation_Status": {
      "select": {
        "name": "Generated"
      }
    }
  }
}
```

### Properties Updated

- **Guardian_Checksum**: Newly calculated checksum
- **Last_Validated**: Current timestamp
- **Validation_Status**: Set to "Generated"

### Use Case

This handles records created before checksum monitoring was implemented, or new records that haven't been checksummed yet.

---

## Module 7: Google Sheets > Add Row (Audit Log)

**Purpose**: Log all validation events to audit trail for compliance and analysis

### Configuration

```json
{
  "connection": "IKE Solutions Google Account",
  "spreadsheet_id": "{{YOUR_AUDIT_LOG_SHEET_ID}}",
  "sheet_name": "Checksum_Validation_Log",
  "values": [
    "{{formatDate(now; 'YYYY-MM-DD HH:mm:ss')}}",
    "{{2.template_name}}",
    "{{1.id}}",
    "{{2.original_checksum}}",
    "{{2.calculated_checksum}}",
    "{{if(2.original_checksum = 2.calculated_checksum; 'VALID'; 'MISMATCH')}}",
    "{{3.route}}",
    "VAULT_GUARDIAN_v1.1"
  ]
}
```

### Sheet Structure

| Column | Value | Example |
|--------|-------|---------|
| **A** | Timestamp | 2025-12-04 14:30:00 |
| **B** | Template_Name | Trust Document Template |
| **C** | Notion_ID | abc-123-def-456 |
| **D** | Original_Checksum | e3b0c44298fc... |
| **E** | Calculated_Checksum | e3b0c44298fc... |
| **F** | Status | VALID / MISMATCH |
| **G** | Route | Route 1 / Route 2 / Route 3 |
| **H** | Executor | VAULT_GUARDIAN_v1.1 |

### Sheet Setup

1. Create Google Sheet: "Vault_Activity_Tracker"
2. Create sheet tab: "Checksum_Validation_Log"
3. Add headers in row 1 (bold, colored background)
4. Freeze row 1 for scrolling
5. Share with Make.com service account (Editor access)

---

## Module 8: Error Handler (Fallback)

**Purpose**: Catch any module failures and alert team for immediate attention

### Configuration

```json
{
  "connection": "Vault Guardian Bot",
  "channel": "#guardian-logs",
  "text": "🔴 *VAULT GUARDIAN ERROR: Checksum Watcher Failed* 🔴\n\n⚠️ **Module:** {{error.module.name}}\n📛 **Error:** {{error.message}}\n🕐 **Timestamp:** {{formatDate(now; 'YYYY-MM-DD HH:mm:ss')}} EST\n\n📋 **Payload:**\n```{{toJson(error)}}```\n\n🛠️ **Action Required:** Check scenario logs and retry.\n\n<@U024BE7LH>",
  "username": "Vault Guardian",
  "icon_emoji": ":rotating_light:",
  "mrkdwn": true
}
```

### Error Routes

Configure error handling from these modules:
- **From Module 1**: Notion search failures
- **From Module 2**: Variable calculation errors
- **From Module 4**: Notion update failures (valid path)
- **From Module 5**: Slack alert failures
- **From Module 6**: Notion update failures (generate path)
- **From Module 7**: Google Sheets logging failures

**All errors route to**: Module 8

### Error Response

1. Immediate Slack notification
2. Full error payload logged
3. Scenario continues (doesn't fail completely)
4. Team alerted for manual intervention

---

## Scenario Settings

### Scheduling Configuration

```yaml
Trigger Type: Schedule
Interval: Every 15 minutes
Time Zone: America/New_York (EST)
Active Hours: 24/7

Max consecutive runs: Unlimited
Max processing time: 120 seconds per execution
Sequential processing: Yes (one record at a time)
```

### Advanced Settings

```yaml
Data Storage: Enabled (track last run)
Incomplete Executions: Allow storage
Execution History: 30 days
Auto-commit: Enabled
Max errors before pause: 5
```

### Optimization Tips

**For High Volume** (>100 records per run):
- Increase `page_size` to 100 in Module 1
- Use aggregator before Slack alerts (batch notifications)
- Consider hourly schedule instead of 15-minute

**For Low Volume** (<20 records per run):
- Keep 15-minute schedule for responsiveness
- Individual alerts acceptable
- Standard settings sufficient

---

## Complete Scenario Blueprint (Make.com Import)

### JSON Export for Direct Import

Save this as `CHECKSUM_WATCHER_v1.1.json` and import to Make.com:

```json
{
  "name": "VAULT_GUARDIAN_CHECKSUM_WATCHER_v1.1",
  "flow": [
    {
      "id": 1,
      "module": "notion:searchDatabaseItems",
      "version": 1,
      "parameters": {
        "databaseId": "YOUR_NOTION_TEMPLATE_DB_ID",
        "filter": {
          "and": [
            {
              "property": "Last_Updated",
              "date": {
                "after": "{{addMinutes(now; -15)}}"
              }
            },
            {
              "property": "Status",
              "select": {
                "equals": "Synced"
              }
            }
          ]
        },
        "sorts": [
          {
            "property": "Last_Updated",
            "direction": "descending"
          }
        ],
        "page_size": 100
      },
      "mapper": {},
      "metadata": {
        "designer": {
          "x": 0,
          "y": 0
        }
      }
    },
    {
      "id": 2,
      "module": "builtin:SetVariables",
      "version": 1,
      "parameters": {},
      "mapper": {
        "variables": [
          {
            "name": "original_checksum",
            "value": "{{1.properties.Guardian_Checksum.rich_text[0].plain_text}}"
          },
          {
            "name": "template_id",
            "value": "{{1.properties.Google_Template_ID.rich_text[0].plain_text}}"
          },
          {
            "name": "template_name",
            "value": "{{1.properties.Template_Name.title[0].plain_text}}"
          },
          {
            "name": "calculated_checksum",
            "value": "{{sha256(1.id + 1.properties.Template_Name.title[0].plain_text + 1.properties.Google_Template_ID.rich_text[0].plain_text)}}"
          }
        ]
      },
      "metadata": {
        "designer": {
          "x": 300,
          "y": 0
        }
      }
    },
    {
      "id": 3,
      "module": "builtin:BasicRouter",
      "version": 1,
      "mapper": null,
      "metadata": {
        "designer": {
          "x": 600,
          "y": 0
        }
      },
      "routes": [
        {
          "flow": [
            {
              "id": 4,
              "module": "notion:updateDatabaseItem",
              "version": 1,
              "parameters": {
                "pageId": "{{1.id}}"
              },
              "mapper": {
                "properties": {
                  "Last_Validated": {
                    "date": {
                      "start": "{{now}}"
                    }
                  },
                  "Validation_Status": {
                    "select": {
                      "name": "Valid"
                    }
                  }
                }
              },
              "metadata": {
                "designer": {
                  "x": 900,
                  "y": -150
                }
              }
            }
          ],
          "filter": {
            "name": "Checksum Match",
            "conditions": [
              [
                {
                  "a": "{{2.original_checksum}}",
                  "o": "text:equal",
                  "b": "{{2.calculated_checksum}}"
                }
              ]
            ]
          }
        },
        {
          "flow": [
            {
              "id": 5,
              "module": "slack:createMessage",
              "version": 1,
              "parameters": {
                "channel": "#guardian-logs"
              },
              "mapper": {
                "text": "🚨 *VAULT GUARDIAN ALERT: Checksum Anomaly Detected* 🚨\\n\\n⚠️ **Template:** {{2.template_name}}\\n🆔 **Notion ID:** {{1.id}}\\n🔐 **Expected Checksum:** `{{2.original_checksum}}`\\n❌ **Calculated Checksum:** `{{2.calculated_checksum}}`\\n🕐 **Detected:** {{formatDate(now; 'YYYY-MM-DD HH:mm:ss')}} EST\\n\\n🛡️ *Auto-heal protocol initiated. Manual review required.*\\n\\n<@USER_ID_REPLACE>",
                "username": "Vault Guardian",
                "icon_emoji": ":warning:",
                "mrkdwn": true
              },
              "metadata": {
                "designer": {
                  "x": 900,
                  "y": 0
                }
              }
            }
          ],
          "filter": {
            "name": "Checksum Mismatch",
            "conditions": [
              [
                {
                  "a": "{{2.original_checksum}}",
                  "o": "text:notequal",
                  "b": "{{2.calculated_checksum}}"
                },
                {
                  "a": "{{length(2.original_checksum)}}",
                  "o": "number:greater",
                  "b": "0"
                }
              ]
            ]
          }
        },
        {
          "flow": [
            {
              "id": 6,
              "module": "notion:updateDatabaseItem",
              "version": 1,
              "parameters": {
                "pageId": "{{1.id}}"
              },
              "mapper": {
                "properties": {
                  "Guardian_Checksum": {
                    "rich_text": [
                      {
                        "text": {
                          "content": "{{2.calculated_checksum}}"
                        }
                      }
                    ]
                  },
                  "Last_Validated": {
                    "date": {
                      "start": "{{now}}"
                    }
                  },
                  "Validation_Status": {
                    "select": {
                      "name": "Generated"
                    }
                  }
                }
              },
              "metadata": {
                "designer": {
                  "x": 900,
                  "y": 150
                }
              }
            }
          ],
          "filter": {
            "name": "Missing Checksum",
            "conditions": [
              [
                {
                  "a": "{{length(2.original_checksum)}}",
                  "o": "number:equal",
                  "b": "0"
                }
              ]
            ]
          }
        }
      ]
    },
    {
      "id": 7,
      "module": "google-sheets:addRow",
      "version": 1,
      "parameters": {
        "spreadsheetId": "YOUR_AUDIT_LOG_SHEET_ID",
        "sheetName": "Checksum_Validation_Log"
      },
      "mapper": {
        "values": [
          "{{formatDate(now; 'YYYY-MM-DD HH:mm:ss')}}",
          "{{2.template_name}}",
          "{{1.id}}",
          "{{2.original_checksum}}",
          "{{2.calculated_checksum}}",
          "{{if(2.original_checksum = 2.calculated_checksum; 'VALID'; 'MISMATCH')}}",
          "{{3.route}}",
          "VAULT_GUARDIAN_v1.1"
        ]
      },
      "metadata": {
        "designer": {
          "x": 1200,
          "y": 0
        }
      }
    },
    {
      "id": 8,
      "module": "slack:createMessage",
      "version": 1,
      "parameters": {
        "channel": "#guardian-logs"
      },
      "mapper": {
        "text": "🔴 *VAULT GUARDIAN ERROR: Checksum Watcher Failed* 🔴\\n\\n⚠️ **Module:** {{error.module.name}}\\n📛 **Error:** {{error.message}}\\n🕐 **Timestamp:** {{formatDate(now; 'YYYY-MM-DD HH:mm:ss')}} EST\\n\\n📋 **Payload:**\\n```{{toJson(error)}}```\\n\\n🛠️ **Action Required:** Check scenario logs and retry.\\n\\n<@USER_ID_REPLACE>",
        "username": "Vault Guardian",
        "icon_emoji": ":rotating_light:",
        "mrkdwn": true
      },
      "metadata": {
        "designer": {
          "x": 1200,
          "y": 300
        },
        "restore": {},
        "expect": [],
        "isErrorHandler": true
      }
    }
  ],
  "metadata": {
    "version": 1,
    "scenario": {
      "roundtrips": 1,
      "maxErrors": 5,
      "autoCommit": true,
      "sequential": true,
      "confidential": false,
      "dataloss": false,
      "dlq": false,
      "schedule": {
        "interval": 15,
        "unit": "minutes"
      }
    },
    "designer": {
      "orphans": []
    },
    "zone": "us1.make.com"
  }
}
```

### Import Instructions

1. **Save Blueprint**
   - Copy JSON above
   - Save as `CHECKSUM_WATCHER_v1.1.json`

2. **Import to Make.com**
   - Go to Make.com dashboard
   - Click "Scenarios" → "..." → "Import Blueprint"
   - Select saved JSON file
   - Click "Import"

3. **Configure Connections**
   - Notion: Select your connection
   - Google Sheets: Select your connection
   - Slack: Select your bot connection

4. **Replace Placeholders**
   - `YOUR_NOTION_TEMPLATE_DB_ID`: Your Notion database ID
   - `YOUR_AUDIT_LOG_SHEET_ID`: Your Google Sheets ID
   - `<@USER_ID_REPLACE>`: Your Slack user ID(s)

5. **Test & Activate**
   - Click "Run once" to test
   - Verify all modules execute
   - Check alerts in Slack
   - Activate scenario

---

## Deployment Checklist

### Pre-Deployment (1-2 hours)

- [ ] **Google Drive Folder Structure**
  ```
  Trust_Vault/
  └── Archive_Backups/
      └── Auto_Heal/
          └── 2025/
              └── 12/
  ```

- [ ] **Notion Database Properties**
  - [ ] Add `Last_Validated` (Date property)
  - [ ] Add `Validation_Status` (Select: Valid, Mismatch, Generated, Auto-Healed, Pending)
  - [ ] Verify `Guardian_Checksum` exists (Rich Text)
  - [ ] Document database ID

- [ ] **Google Sheets Audit Log**
  - [ ] Create "Vault_Activity_Tracker" spreadsheet
  - [ ] Create "Checksum_Validation_Log" sheet
  - [ ] Add column headers
  - [ ] Share with Make.com service account
  - [ ] Document spreadsheet ID

- [ ] **Slack Configuration**
  - [ ] Create `#guardian-logs` channel
  - [ ] Add Vault Guardian bot
  - [ ] Collect user IDs for mentions
  - [ ] Test bot posting permissions

- [ ] **Make.com Setup**
  - [ ] Pro subscription active
  - [ ] Notion connection authorized
  - [ ] Google Sheets connection authorized
  - [ ] Slack connection authorized

### Deployment (30 minutes)

- [ ] **Import Scenario**
  - [ ] Save JSON blueprint
  - [ ] Import to Make.com
  - [ ] Rename to `VAULT_GUARDIAN_CHECKSUM_WATCHER_v1.1`

- [ ] **Configure Modules**
  - [ ] Module 1: Set Notion database ID
  - [ ] Module 7: Set Google Sheets ID
  - [ ] Modules 5 & 8: Replace Slack user IDs
  - [ ] Verify all connections selected

- [ ] **Test Run**
  - [ ] Click "Run once"
  - [ ] Check execution log for errors
  - [ ] Verify Notion updates
  - [ ] Check Google Sheets log entry
  - [ ] Confirm Slack notification (if mismatch triggered)

- [ ] **Activate**
  - [ ] Review scenario settings
  - [ ] Enable 15-minute schedule
  - [ ] Set max errors to 5
  - [ ] Toggle scenario ON

### Post-Deployment (First 24 hours)

- [ ] **Hour 1**: Monitor first 4 executions
- [ ] **Hour 4**: Review audit log for patterns
- [ ] **Hour 24**: Check error count
- [ ] **Day 2**: Review success rate
- [ ] **Week 1**: Optimize schedule if needed

---

## Monitoring & Maintenance

### Daily Checks

**What to Review**:
- Slack `#guardian-logs` for anomaly alerts
- Google Sheets audit log for patterns
- Make.com execution history for errors

**Red Flags**:
- >5 checksum mismatches per day
- Repeated errors on same module
- No executions in 1 hour (scenario paused?)

### Weekly Review

**Metrics to Track**:
```
Total Validations: _____ (from audit log)
Valid Checksums: _____ (%)
Mismatches Detected: _____ (%)
Checksums Generated: _____ (%)
Errors Encountered: _____ (count)
```

**Success Criteria**:
- Valid rate >95%
- Mismatch rate <2%
- Error rate <1%

### Monthly Optimization

**Review Questions**:
1. Are validations catching real issues?
2. Is 15-minute schedule optimal?
3. Are false positives occurring?
4. Should we add more databases?

**Tuning Options**:
- Adjust schedule interval
- Modify checksum algorithm
- Add additional data points to checksum
- Enhance alert content

---

## Troubleshooting

### Issue: No Records Being Validated

**Symptoms**:
- Scenario runs but processes 0 records
- Audit log empty

**Solutions**:
1. Check Notion filter conditions
   - Verify `Last_Updated` field exists
   - Confirm `Status` field has "Synced" option
2. Test with broader filter (remove date filter)
3. Check Notion connection permissions

### Issue: Checksum Always Mismatches

**Symptoms**:
- Every validation shows mismatch
- Even newly generated checksums fail

**Solutions**:
1. Review checksum calculation in Module 2
2. Verify data concatenation order matches original
3. Check for special characters in template names
4. Ensure SHA-256 function available in Make.com

### Issue: Slack Alerts Not Sending

**Symptoms**:
- Validation runs but no Slack messages
- Module 5 shows error

**Solutions**:
1. Verify Slack bot token is valid
2. Check bot has permission to post in `#guardian-logs`
3. Test bot with manual message
4. Review Slack rate limits (1+ message per second)

### Issue: Google Sheets Log Fails

**Symptoms**:
- Module 7 error in execution log
- Audit trail incomplete

**Solutions**:
1. Verify spreadsheet ID is correct
2. Check sheet name exactly matches "Checksum_Validation_Log"
3. Confirm Make.com service account has Editor access
4. Test with manual row insertion

---

## Integration with Existing Scenarios

### With AUTO_HEAL_v1.0

The Checksum Watcher can trigger AUTO_HEAL when anomalies detected:

```yaml
Checksum Watcher (Module 5: Alert)
    ↓
Webhook Trigger
    ↓
AUTO_HEAL_v1.0 (Module 1: Webhook)
    ↓
[Standard AUTO_HEAL flow]
```

**Setup**:
1. Create webhook in AUTO_HEAL scenario
2. In Checksum Watcher Module 5, add HTTP module after Slack alert
3. POST to AUTO_HEAL webhook with anomaly data
4. AUTO_HEAL automatically attempts restoration

### With BACKUP_SYNC_v1.0

Checksum Watcher validates backups created by BACKUP_SYNC:

```yaml
BACKUP_SYNC (Creates backup)
    ↓
Updates Notion with backup metadata
    ↓
Checksum Watcher (Validates backup integrity)
    ↓
Logs validation result
```

**Benefits**:
- Ensures backups are not corrupted
- Validates sync operations completed correctly
- Provides audit trail of backup health

---

## Success Metrics

### Key Performance Indicators

Track these weekly:

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Validation Success Rate | >95% | ___% | 🟢/🟡/🔴 |
| Anomaly Detection Rate | 1-5% | ___% | 🟢/🟡/🔴 |
| False Positive Rate | <2% | ___% | 🟢/🟡/🔴 |
| Average Execution Time | <30s | ___s | 🟢/🟡/🔴 |
| Scenario Uptime | >99% | ___% | 🟢/🟡/🔴 |

### Health Score Calculation

```
Health Score = (Valid% × 0.4) + 
               ((100 - Mismatch%) × 0.3) + 
               ((100 - Error%) × 0.3)

Target: >90 (Excellent)
Warning: 70-90 (Good, needs attention)
Critical: <70 (Review required)
```

---

## Appendix A: Vendor Brief

### For Future Scaling ($10k+/month operations)

When ready to engage automation vendors, provide this brief:

**Current State**:
- Make.com-based checksum validation
- 8-module scenario with routers
- Notion + Google Sheets + Slack integration
- 15-minute validation cycles

**Scaling Requirements**:
- Support for 1000+ records per hour
- Multi-database validation
- Advanced anomaly detection (ML)
- Real-time webhook triggers
- Enterprise SLA (99.9% uptime)

**Vendor Capabilities Needed**:
- Make.com expert certification
- Notion API experience
- Slack bot development
- Google Apps Script proficiency
- Database optimization

**Budget Range**: $2,000-$5,000 setup + $500-$1,000/month maintenance

**Recommended Vendors**:
- Automation consultants (Upwork, Toptal)
- Make.com certified partners
- Notion integration specialists

---

## Appendix B: Handoff Kit

### For Team Members or Future Maintainers

**Quick Reference Card**:

```yaml
Scenario Name: VAULT_GUARDIAN_CHECKSUM_WATCHER_v1.1
Location: Make.com → Scenarios
Schedule: Every 15 minutes
Status Check: #guardian-logs Slack channel

Emergency Contacts:
  - Primary: [Your Name] - [Your Email]
  - Backup: [Team Member] - [Their Email]
  - Make.com Support: support@make.com

Critical Files:
  - Blueprint: /docs/vault-guardian/07-CHECKSUM-WATCHER-IMPLEMENTATION.md
  - Audit Log: Google Drive → Vault_Activity_Tracker
  - Test Cases: /docs/vault-guardian/04-TEST-PLAN.md

Monthly Tasks:
  - Review success metrics (1st of month)
  - Check error patterns (15th of month)
  - Optimize if needed (as required)

Troubleshooting:
  - Check this doc first
  - Review Make.com execution logs
  - Post in #guardian-logs with @mention
```

---

## Next Steps

After deploying Checksum Watcher:

1. **Week 1**: Monitor daily, tune as needed
2. **Week 2-4**: Collect baseline metrics
3. **Month 2**: Review integration with AUTO_HEAL
4. **Month 3**: Consider Phase 3 enhancements

**Phase 3 Candidates**:
- Real-time webhook triggers (vs. scheduled)
- Multi-database validation
- Advanced ML anomaly detection
- Cross-platform checksum validation

**Read Next**:
- [AUTO_HEAL Configuration](./02-VAULT-GUARDIAN-AUTO-HEAL.md) - Integration patterns
- [Test Plan](./04-TEST-PLAN.md) - Testing checksum scenarios
- [Phase Four Planning](./06-PHASE-FOUR-PLANNING.md) - Advanced features

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-04  
**Scenario Version**: VAULT_GUARDIAN_CHECKSUM_WATCHER_v1.1  
**Maintained By**: IKE-BOT Infrastructure Team

---

**Questions or Issues?** Open an issue in the repository or contact the infrastructure team.
