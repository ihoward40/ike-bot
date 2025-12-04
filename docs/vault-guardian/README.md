# Vault Guardian Documentation

## Overview

Vault Guardian is an automated system for monitoring, backing up, and healing corrupted files in the Trust Vault. This documentation provides comprehensive guides for setting up and operating the Vault Guardian system.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     VAULT GUARDIAN SYSTEM                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────┐         ┌──────────────┐                   │
│  │ Trust Vault│◄────────┤ AUTO_HEAL    │                   │
│  │  (Primary) │         │  Scenario    │                   │
│  └─────┬──────┘         └──────▲───────┘                   │
│        │                       │                            │
│        │                  ┌────┴─────┐                      │
│        │                  │  Notion  │                      │
│        │                  │  Ledger  │                      │
│        │                  └────▲─────┘                      │
│        │                       │                            │
│  ┌─────▼──────┐         ┌─────┴──────┐                     │
│  │  Archive   ├────────►│ BACKUP_SYNC│                     │
│  │  Folder    │         │  Scenario  │                     │
│  └────────────┘         └──────┬─────┘                     │
│                                 │                           │
│                          ┌──────▼────────┐                 │
│                          │ Archive_Backups│                │
│                          │   (Redundant)  │                │
│                          └────────────────┘                │
│                                                              │
│  Notifications: Slack (#vault-guardian-*)                  │
│  Logging: IKE-BOT agent_logs                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. VAULT_GUARDIAN_AUTO_HEAL_v1.0
Automated detection and restoration of corrupted files:
- Monitors Notion Vault Ledger for corruption alerts
- Retrieves backups from Archive_Backups
- Verifies file integrity via hash comparison
- Automatically restores corrupted files
- Escalates when manual intervention needed

### 2. VAULT_GUARDIAN_BACKUP_SYNC_v1.0
Automated backup synchronization:
- Watches Archive folder for new files
- Creates redundant copies in Archive_Backups
- Logs all backup operations to Notion
- Prevents duplicate processing
- Notifies team of successful backups

### 3. VAULT_GUARDIAN_CHECKSUM_WATCHER_v1.1 (Phase 2)
Proactive integrity monitoring with automated checksum validation:
- Monitors Notion databases for data integrity
- Calculates and validates checksums every 15 minutes
- Detects anomalies and alerts via Slack
- Auto-generates checksums for new records
- Logs all validation events to Google Sheets audit trail
- Triggers AUTO_HEAL for detected corruptions

### 4. Supporting Infrastructure
- **Notion Databases**: Vault Ledger and Backup Log
- **Google Drive**: Trust Vault, Archive, and Archive_Backups folders
- **Slack Channels**: Notifications, alerts, and error reporting
- **IKE-BOT Backend**: Audit logging and API integration

---

## Documentation Index

### Setup Guides

#### [01 - Google Drive Setup](./01-GOOGLE-DRIVE-SETUP.md)
**Purpose**: Set up the Google Drive folder structure  
**Time Required**: 30 minutes  
**Prerequisites**: Google Drive admin access

**What's Covered**:
- Create Trust_Vault/Archive_Backups folder structure
- Configure folder permissions
- Document folder IDs for Make.com
- Set up monitoring and security

**Start Here** if you haven't created the Google Drive folders yet.

---

#### [02 - VAULT_GUARDIAN_AUTO_HEAL Configuration](./02-VAULT-GUARDIAN-AUTO-HEAL.md)
**Purpose**: Build the AUTO_HEAL scenario in Make.com  
**Time Required**: 2-3 hours  
**Prerequisites**: Make.com Pro account, Google Drive setup complete

**What's Covered**:
- Module-by-module configuration for all 8 modules
- Router decision logic
- Error handling setup
- Notion, Google Drive, and Slack integrations
- Testing procedures

**This is the core healing system** - read carefully and follow step-by-step.

---

#### [03 - VAULT_GUARDIAN_BACKUP_SYNC Configuration](./03-VAULT-GUARDIAN-BACKUP-SYNC.md)
**Purpose**: Build the BACKUP_SYNC scenario in Make.com  
**Time Required**: 1-2 hours  
**Prerequisites**: Make.com Pro account, Google Drive setup complete

**What's Covered**:
- Module-by-module configuration for all 4 modules
- Duplicate prevention via data store
- Notion logging setup
- Performance optimization tips
- Integration with AUTO_HEAL

**This ensures backups are always current** for AUTO_HEAL to use.

---

### Testing & Deployment

#### [04 - Test Plan](./04-TEST-PLAN.md)
**Purpose**: Comprehensive testing before production deployment  
**Time Required**: 4-6 hours  
**Prerequisites**: Both scenarios built but NOT activated

**What's Covered**:
- **Test Case 1**: Successful restore from backup
- **Test Case 2**: No backup found (escalation path)
- **Test Case 3**: False alarm (hash mismatch resolved)
- **Test Case 4**: Manual heal via Slack trigger (optional)
- **Test Case 5**: Basic file sync
- **Test Case 6**: Multiple files sync
- Expected outcomes and validation criteria
- Rollback procedures

**CRITICAL**: Do not skip testing. This validates everything works correctly.

---

#### [05 - Readiness Checklist](./05-READINESS-CHECKLIST.md)
**Purpose**: Final verification before production activation  
**Time Required**: 1 hour review + sign-offs  
**Prerequisites**: All tests passed

**What's Covered**:
- Infrastructure setup verification
- Scenario configuration verification
- Test results validation
- Documentation completeness
- Security and compliance checks
- Activation sign-off
- Post-activation monitoring plan

**Use this as your final gate** before going live.

---

### Enhancement Guides

#### [07 - CHECKSUM_WATCHER Implementation](./07-CHECKSUM-WATCHER-IMPLEMENTATION.md) ⭐ NEW
**Purpose**: Phase 2 enhancement - Proactive integrity monitoring  
**Time Required**: 1-2 hours setup  
**Prerequisites**: AUTO_HEAL and BACKUP_SYNC operational

**What's Covered**:
- Ready-to-deploy Make.com scenario blueprint (JSON)
- 8-module configuration with routers
- Checksum calculation and validation logic
- Slack alerting for anomalies
- Google Sheets audit logging
- Integration with AUTO_HEAL for automatic remediation
- Complete deployment checklist

**Deploy this** after Phase 1 scenarios are stable for enhanced protection.

---

### Future Planning

#### [06 - Phase Four Planning](./06-PHASE-FOUR-PLANNING.md)
**Purpose**: Plan for advanced features (Eclipse Protocol + Ascension Controller)  
**Time Required**: Reading only (planning is 15-22 weeks)  
**Prerequisites**: Phase Three operational and stable

**What's Covered**:
- **Eclipse Protocol**: Multi-tier backup strategy with geographic distribution
- **Ascension Controller**: ML-powered prediction and intelligent orchestration
- Implementation roadmap
- Cost-benefit analysis
- Risk assessment

**Read this** if you want to understand where the system can evolve.

---

## Quick Start Guide

### For First-Time Setup

1. **Week 1: Infrastructure** (Days 1-2)
   - [ ] Read [01-GOOGLE-DRIVE-SETUP.md](./01-GOOGLE-DRIVE-SETUP.md)
   - [ ] Create all Google Drive folders
   - [ ] Set up Notion databases
   - [ ] Configure Slack channels

2. **Week 1: Scenario Building** (Days 3-5)
   - [ ] Read [02-VAULT-GUARDIAN-AUTO-HEAL.md](./02-VAULT-GUARDIAN-AUTO-HEAL.md)
   - [ ] Build AUTO_HEAL scenario in Make.com
   - [ ] Read [03-VAULT-GUARDIAN-BACKUP-SYNC.md](./03-VAULT-GUARDIAN-BACKUP-SYNC.md)
   - [ ] Build BACKUP_SYNC scenario in Make.com

3. **Week 2: Testing** (Days 1-3)
   - [ ] Read [04-TEST-PLAN.md](./04-TEST-PLAN.md)
   - [ ] Execute all 6 test cases
   - [ ] Document results
   - [ ] Fix any issues found

4. **Week 2: Deployment** (Days 4-5)
   - [ ] Complete [05-READINESS-CHECKLIST.md](./05-READINESS-CHECKLIST.md)
   - [ ] Get sign-offs
   - [ ] Activate BACKUP_SYNC first
   - [ ] Monitor for 1 hour
   - [ ] Activate AUTO_HEAL second
   - [ ] Monitor closely for 24 hours

5. **Week 3+: Operations**
   - [ ] Daily monitoring (first week)
   - [ ] Weekly reviews (first month)
   - [ ] Consider Phase Four after 4-8 weeks

---

## Key Concepts

### Vault Health Status
Files in the Vault Ledger can have these statuses:
- **healthy**: File is fine, no action needed
- **corrupted**: File is damaged, AUTO_HEAL will restore
- **missing**: File is gone, AUTO_HEAL will restore or escalate
- **verified**: False alarm resolved, no action taken
- **restored**: File successfully restored from backup
- **escalated**: No backup found, manual intervention required

### Backup Tiers (Current)
- **Tier 1 - Hot Backups**: Archive_Backups folder, 15-min sync, 7-day retention
- **Tier 2 - Warm Backups**: (Phase Four - planned)
- **Tier 3 - Cold Backups**: (Phase Four - planned)

### Router Paths
- **Router A**: Backup found? → YES (heal) or NO (escalate)
- **Router B**: Hash match? → NO (restore) or YES (false alarm)

### Notification Channels
- `#vault-guardian-notifications`: Success messages, routine updates
- `#vault-guardian-alerts`: High-priority escalations
- `#vault-guardian-errors`: System errors, scenario failures

---

## FAQ

### How long does a restoration take?
- **Average**: 18-30 seconds from detection to completion
- **Fast path**: 15 seconds (backup found, hash verified)
- **Slow path**: 45+ seconds (includes manual trigger or complex scenarios)

### What happens if no backup is found?
The system:
1. Searches Archive_Backups thoroughly
2. If not found, sends high-priority Slack alert
3. Updates Notion status to "escalated"
4. Waits for manual intervention
5. Logs to IKE-BOT for audit

### Can I manually trigger a heal?
**Yes** (optional - Test Case 4):
- Use Slack slash command: `/vault-heal file_id=[id]`
- Or call webhook directly
- Useful for known issues or testing

### How do I know if it's working?
Check these indicators:
- Slack receives regular backup notifications
- Notion Backup Log has new entries
- Make.com execution history shows successful runs
- No error alerts in #vault-guardian-errors

### What if I need to disable it temporarily?
1. Go to Make.com scenarios
2. Set scenario status to "Inactive"
3. System stops processing immediately
4. Re-activate when ready

### How much does it cost?
**Estimated Monthly Costs**:
- Make.com operations: ~10,000-15,000 ops/month
  - Included in Pro plan ($10-15/month if dedicated)
- Google Drive storage: Included in Workspace (~$10/user/month)
- IKE-BOT hosting: Existing infrastructure (no additional cost)
- **Total**: $10-25/month depending on volume

---

## Troubleshooting

### Issue: Scenario not triggering
**Check**:
- Scenario is set to "Active"
- Notion database has items with Status = "corrupted" and Auto-heal = TRUE
- Polling schedule is correct
- Notion connection is still authorized

### Issue: Files not being backed up
**Check**:
- Archive folder contains new files
- BACKUP_SYNC scenario is Active
- Google Drive connection is valid
- Data store not preventing duplicates incorrectly

### Issue: Restoration fails
**Check**:
- Backup file exists in Archive_Backups
- Service account has Editor permissions
- Target folder has sufficient storage
- File hash matches expected format

### Issue: Too many notifications
**Solution**:
- Use aggregator for summary messages (hourly/daily)
- Adjust notification thresholds
- Filter low-priority events
- Create separate channel for verbose logs

---

## Support & Maintenance

### Regular Maintenance Tasks

**Daily** (First Week):
- Review Slack notifications
- Check Make.com execution logs
- Verify backups are being created

**Weekly** (First Month):
- Review success rates
- Check error logs
- Verify storage usage
- Update documentation if needed

**Monthly** (Ongoing):
- Calculate key metrics
- Review performance trends
- Plan optimizations
- Check retention policy compliance

### Getting Help

1. **Documentation**: Check this folder first
2. **Logs**: Review IKE-BOT agent_logs table
3. **Make.com Support**: support@make.com for scenario issues
4. **Team**: Escalate via Slack if system impact

### Updating Documentation

When making changes:
1. Update relevant guide (01-06)
2. Update this README if architecture changes
3. Update test plan if new test cases needed
4. Version documentation (e.g., v1.0 → v1.1)

---

## Success Metrics

Track these KPIs:

### Availability
- **Target**: 99.9% uptime for both scenarios
- **Measure**: Hours operational / Total hours

### Reliability
- **Target**: 99% heal success rate
- **Measure**: Successful heals / Total heal attempts

### Performance
- **Target**: <30 second average heal time
- **Measure**: Total heal time / Number of heals

### Quality
- **Target**: <5% false alarm rate
- **Measure**: False alarms / Total corruption alerts

### Efficiency
- **Target**: <2% escalation rate
- **Measure**: Escalations / Total heal attempts

---

## Version History

| Version | Date       | Changes                                      | Author           |
|---------|------------|----------------------------------------------|------------------|
| 1.0     | 2025-12-04 | Initial documentation for Phase Three        | IKE-BOT Team     |
| -       | -          | (Future updates will be tracked here)        | -                |

---

## Next Steps

After reading this README:

1. **Setting Up?** → Start with [01-GOOGLE-DRIVE-SETUP.md](./01-GOOGLE-DRIVE-SETUP.md)
2. **Building Scenarios?** → Continue to [02-VAULT-GUARDIAN-AUTO-HEAL.md](./02-VAULT-GUARDIAN-AUTO-HEAL.md)
3. **Ready to Test?** → Follow [04-TEST-PLAN.md](./04-TEST-PLAN.md)
4. **Ready to Deploy?** → Complete [05-READINESS-CHECKLIST.md](./05-READINESS-CHECKLIST.md)
5. **Planning Ahead?** → Review [06-PHASE-FOUR-PLANNING.md](./06-PHASE-FOUR-PLANNING.md)

---

**Questions?** Contact the IKE-BOT Infrastructure Team or open an issue in the repository.

**Ready to build?** Start with the [Google Drive Setup Guide](./01-GOOGLE-DRIVE-SETUP.md)! 🚀
