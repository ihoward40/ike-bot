# Grant Acquisition Division - Notion Pipeline Setup

**Purpose**: Create a comprehensive grant tracking database in Notion to manage the entire lifecycle from discovery to award.

## Database Schema

### Database Name
```
Grant Acquisition Division – Pipeline v1
```

### Properties Configuration

Copy-paste this structure into your Notion database:

#### 1. Grant Name
- **Type**: Title (primary field)
- **Description**: Official name of the grant program or opportunity
- **Example**: "Community Impact Grant 2025"

#### 2. Funder / Program
- **Type**: Text
- **Description**: Organization or agency offering the grant
- **Example**: "Newark Community Foundation"

#### 3. Grant Type
- **Type**: Select
- **Options**:
  - Government
  - Foundation
  - Corporate
  - Community
  - Faith-Based
  - Other
- **Description**: Categorize funding source type

#### 4. Status
- **Type**: Select
- **Options**:
  - Researching
  - Good Fit
  - Applied – Drafting
  - Applied – Submitted
  - Awarded
  - Declined
  - On Hold
- **Description**: Current stage in pipeline
- **Color Coding**:
  - Researching: Gray
  - Good Fit: Blue
  - Applied – Drafting: Yellow
  - Applied – Submitted: Orange
  - Awarded: Green
  - Declined: Red
  - On Hold: Purple

#### 5. Focus Area
- **Type**: Multi-select
- **Options**:
  - Housing & Stability
  - Legal Aid / Rights
  - Family Support
  - Youth & Education
  - Tech & Automation
  - Arts & Culture
  - General Operating
- **Description**: Primary program areas funded

#### 6. Geographic Scope
- **Type**: Text
- **Description**: Where the grant can be used
- **Example**: "Newark, NJ – NJ statewide – USA"

#### 7. Deadline
- **Type**: Date
- **Description**: Application submission deadline
- **Configuration**: Include time if specified

#### 8. Amount (Low–High)
- **Type**: Text
- **Description**: Grant award range
- **Example**: "$10,000–$50,000"

#### 9. Match Required?
- **Type**: Select
- **Options**:
  - Yes
  - No
  - Unsure
- **Description**: Whether matching funds or in-kind required

#### 10. Contact Person
- **Type**: Text
- **Description**: Name of program officer or contact
- **Example**: "Jane Smith, Program Director"

#### 11. Contact Email / Portal Link
- **Type**: Text
- **Description**: Email address or application portal URL
- **Example**: "grants@foundation.org" or "https://portal.grantmaker.com"

#### 12. Stage Notes
- **Type**: Long text (multi-line)
- **Description**: What you've done so far, next steps, questions
- **Example**: "Called on 12/1, spoke with Jane. Need to submit LOI by 12/15. Confirmed our housing work aligns with priorities."

#### 13. Required Docs
- **Type**: Multi-select
- **Options**:
  - IRS Letter
  - Budget
  - Org Narrative
  - Program Narrative
  - Workplan
  - Letters of Support
  - Audited Financials
  - Other
- **Description**: Documents needed for application

#### 14. Submission Link
- **Type**: URL
- **Description**: Direct link to application portal or submission page

#### 15. Attachments
- **Type**: Files
- **Description**: Upload PDFs, drafts, guidelines, etc.

#### 16. Internal Priority
- **Type**: Select
- **Options**:
  - Tier 1 – Must Chase
  - Tier 2 – Good Opportunity
  - Tier 3 – Optional
- **Description**: Your internal assessment of importance
- **Color Coding**:
  - Tier 1: Red (urgent)
  - Tier 2: Yellow (important)
  - Tier 3: Green (nice-to-have)

## Database Views

### View 1: Active Pipeline (Default)
**Filter**: Status is "Researching" OR "Good Fit" OR "Applied – Drafting"  
**Sort**: 
1. Internal Priority (ascending)
2. Deadline (ascending)  
**Properties Shown**: Grant Name, Funder, Status, Deadline, Amount, Internal Priority

### View 2: Submitted & Pending
**Filter**: Status is "Applied – Submitted"  
**Sort**: Deadline (ascending)  
**Properties Shown**: Grant Name, Funder, Deadline, Amount, Contact Person, Stage Notes

### View 3: Won (Awarded)
**Filter**: Status is "Awarded"  
**Sort**: Deadline (descending)  
**Properties Shown**: Grant Name, Funder, Amount, Focus Area, Attachments

### View 4: Deadline This Month
**Filter**: Deadline is within "This month"  
**Sort**: Deadline (ascending)  
**Properties Shown**: Grant Name, Funder, Status, Deadline, Internal Priority, Contact Person

### View 5: All Grants (Table)
**Filter**: None  
**Sort**: Status (custom order: Active first, then Won, then Declined)  
**Properties Shown**: All

### View 6: By Focus Area (Board)
**Group By**: Focus Area  
**Filter**: Status is not "Declined"  
**Sort**: Internal Priority

## Setup Instructions

### Step 1: Create Database (5 minutes)

1. Open Notion
2. Navigate to your workspace
3. Click "+ New page"
4. Select "Database" → "Table"
5. Name it: "Grant Acquisition Division – Pipeline v1"

### Step 2: Add Properties (10 minutes)

1. Click on each default property header
2. Rename or delete as needed
3. Click "+ Add property" for each field listed above
4. Select the correct property type
5. Configure options for Select and Multi-select fields

**Pro Tip**: Create all Select/Multi-select options at once before entering data to maintain consistency.

### Step 3: Configure Views (5 minutes)

1. Click "Add a view" at the top-left
2. Create each view listed above
3. Set filters, sorts, and visible properties
4. Rename views to match

### Step 4: Test with Sample Entry (3 minutes)

Create a test grant entry:
```
Grant Name: Newark Housing Initiative Grant
Funder: Newark Community Foundation
Grant Type: Foundation
Status: Researching
Focus Area: Housing & Stability, Legal Aid / Rights
Geographic Scope: Newark, NJ
Deadline: [30 days from today]
Amount: $25,000–$75,000
Match Required: No
Internal Priority: Tier 1 – Must Chase
```

## Workflow Example

### Discovery → Entry
1. Find grant opportunity on funder website
2. Create new entry in Notion
3. Fill in Grant Name, Funder, Type, Deadline, Amount
4. Set Status to "Researching"
5. Add to Stage Notes: "Found on [website], reviewing guidelines"

### Research → Assessment
1. Read application guidelines
2. Update Required Docs multi-select
3. Add Contact Person and Email
4. Set Geographic Scope and Focus Area
5. Assess fit: Update Status to "Good Fit" or "On Hold"
6. Set Internal Priority

### Application → Drafting
1. Update Status to "Applied – Drafting"
2. Upload application template to Attachments
3. Begin drafting in Stage Notes or external doc
4. Check off Required Docs as you complete them
5. Add reminders for deadline

### Submission
1. Submit application via portal or email
2. Update Status to "Applied – Submitted"
3. Add Submission Link
4. Update Stage Notes with confirmation details
5. Set follow-up reminders

### Decision
1. Receive notification
2. Update Status to "Awarded" or "Declined"
3. If Awarded: Document amount, terms, reporting requirements
4. If Declined: Note feedback for future applications

## Maintenance & Best Practices

### Daily (2 minutes)
- Check "Deadline This Month" view
- Update Stage Notes for active applications

### Weekly (10 minutes)
- Review "Active Pipeline" view
- Move stale "Researching" entries to "On Hold" or delete
- Update Status for pending submissions
- Add 2-3 new opportunities

### Monthly (30 minutes)
- Review "Won" grants for reporting deadlines
- Analyze "Declined" entries for patterns
- Update Internal Priorities based on organizational needs
- Clean up old entries (archive or delete)

## Troubleshooting

### Issue: Too many properties cluttering view
**Solution**: Use different views to show only relevant properties per stage

### Issue: Deadlines getting missed
**Solution**: 
1. Create calendar view grouped by Deadline
2. Set up Notion reminders (click Deadline → Add reminder)
3. Review "Deadline This Month" view weekly

### Issue: Can't find specific grant
**Solution**: Use Notion search (Cmd/Ctrl + P) to search across all properties

### Issue: Multiple team members need access
**Solution**: 
1. Share database with specific people
2. Use database permissions to control edit access
3. Add "Assigned To" property if needed

## Integration Opportunities

### Phase 2 Enhancements (Optional)

**Make.com Automation**:
- Auto-create Slack alerts for deadlines within 7 days
- Send weekly digest of Active Pipeline to email

**Vault Guardian Integration**:
- Auto-backup submitted applications
- Create audit trail of all submissions

**Notion Formulas**:
- Calculate days until deadline
- Auto-assign priority based on amount + fit + deadline

## Sample Entries for Testing

Entry 1 - High Priority:
```
Grant Name: New Jersey Legal Aid Capacity Grant
Funder: NJ State Bar Foundation
Grant Type: Foundation
Status: Good Fit
Focus Area: Legal Aid / Rights
Geographic Scope: NJ statewide
Deadline: [15 days from today]
Amount: $50,000–$100,000
Match Required: No
Internal Priority: Tier 1 – Must Chase
Stage Notes: Confirmed our work aligns. Need 3 letters of support and budget.
Required Docs: IRS Letter, Budget, Org Narrative, Program Narrative, Letters of Support
```

Entry 2 - Medium Priority:
```
Grant Name: Small Business Tech Innovation Fund
Funder: Corporate Community Foundation
Grant Type: Corporate
Status: Researching
Focus Area: Tech & Automation
Geographic Scope: USA
Deadline: [45 days from today]
Amount: $10,000–$25,000
Match Required: Yes
Internal Priority: Tier 2 – Good Opportunity
Stage Notes: Reviewing guidelines. Match requirement may be challenging.
```

Entry 3 - Won Grant:
```
Grant Name: Emergency Family Support Grant
Funder: United Way
Grant Type: Community
Status: Awarded
Focus Area: Family Support, Housing & Stability
Geographic Scope: Newark, NJ
Amount: $15,000
Match Required: No
Internal Priority: Tier 1 – Must Chase
Stage Notes: AWARDED! $15,000 for emergency housing assistance. Quarterly reports due.
```

---

**Next Steps**:
1. Set up database using this guide
2. Add 5-10 real opportunities you're tracking
3. Configure views for your workflow
4. Review [02-MASTER-ORG-PROFILE.md](02-MASTER-ORG-PROFILE.md) for application narratives

**Last Updated**: 2025-12-06  
**Version**: 1.0
