# Google Drive Folder Setup Guide

## Overview
This guide provides step-by-step instructions for creating and configuring the Google Drive folder structure required for the Vault Guardian system.

## Prerequisites
- Google Drive account with sufficient storage
- Admin access to Trust Vault Google Drive
- Permissions to create folders and set sharing settings

## Folder Structure

### Primary Path
```
Trust_Vault/
└── Archive_Backups/
```

## Step-by-Step Setup

### Step 1: Access Trust Vault Drive
1. Log in to Google Drive at [drive.google.com](https://drive.google.com)
2. Navigate to the root directory where Trust Vault is located
3. Verify you have edit/manage permissions on the Trust Vault folder

### Step 2: Create Archive_Backups Folder
1. Open the `Trust_Vault` folder
2. Click **New** → **Folder**
3. Name the folder: `Archive_Backups`
4. Click **Create**

### Step 3: Configure Folder Permissions
1. Right-click on `Archive_Backups` folder
2. Select **Share** → **Share**
3. Add the following users/service accounts:
   - **Make.com Service Account** (for automated backups)
     - Email: `[Your Make.com integration email]`
     - Permission: **Editor**
   - **Backup Administrators**
     - Permission: **Editor**
   - **Read-Only Auditors** (optional)
     - Permission: **Viewer**
4. Click **Advanced settings**
   - ✅ Check "Prevent editors from changing access and adding new people"
   - ✅ Check "Disable download, print, and copy for commenters and viewers" (optional, for security)

### Step 4: Enable File Organization
1. Inside `Archive_Backups`, create the following sub-folders for organization:
   ```
   Archive_Backups/
   ├── Daily/
   ├── Weekly/
   ├── Monthly/
   └── Manual/
   ```
2. This structure helps organize backups by frequency

### Step 5: Document Folder IDs
After creating folders, you need to capture their Google Drive IDs for Make.com scenarios:

1. Open each folder in Google Drive
2. Copy the folder ID from the URL:
   ```
   https://drive.google.com/drive/folders/[FOLDER_ID_HERE]
   ```
3. Document these IDs:
   ```
   Archive_Backups Folder ID: _______________________
   Daily Subfolder ID:        _______________________
   Weekly Subfolder ID:       _______________________
   Monthly Subfolder ID:      _______________________
   Manual Subfolder ID:       _______________________
   ```

### Step 6: Test Access
1. From Make.com (or service account):
   - Test list files in `Archive_Backups`
   - Test create a test file
   - Test delete the test file
2. Verify all operations succeed
3. Check permissions are working as expected

### Step 7: Set Up Monitoring (Optional but Recommended)
1. Enable Google Drive Activity notifications:
   - Click **Settings** (gear icon) → **Settings**
   - Go to **Notifications**
   - Enable "Files shared with you" and "Changes to files"
2. This helps monitor unauthorized access attempts

## Security Checklist

- [ ] Folder created at correct path: `Trust_Vault/Archive_Backups/`
- [ ] Make.com service account has Editor access
- [ ] Backup administrators have Editor access
- [ ] Folder IDs documented and stored securely
- [ ] Access restrictions properly configured
- [ ] Test file operations successful
- [ ] Notifications enabled for monitoring
- [ ] Backup retention policy defined (see below)

## Backup Retention Policy

### Recommended Retention Schedule
- **Daily backups**: Keep 7 days
- **Weekly backups**: Keep 4 weeks  
- **Monthly backups**: Keep 12 months
- **Manual backups**: Keep indefinitely or until manual deletion

### Automated Cleanup
Consider setting up an automated cleanup scenario in Make.com to:
1. Delete daily backups older than 7 days
2. Delete weekly backups older than 28 days
3. Delete monthly backups older than 365 days
4. Archive critical backups to cold storage

## Troubleshooting

### Issue: Cannot Create Folder
- **Solution**: Verify you have edit permissions on Trust_Vault parent folder
- Check storage quota hasn't been exceeded

### Issue: Service Account Can't Access Folder
- **Solution**: Ensure service account email is correctly added with Editor permissions
- Verify the email address matches exactly what Make.com provides
- Check if organization policies restrict external sharing

### Issue: Folder ID Not Found
- **Solution**: 
  1. Open folder in browser
  2. Check URL bar for the folder ID
  3. ID is the string after `/folders/` in the URL
  4. Make sure you're copying the full ID (usually alphanumeric)

## Next Steps

After completing this setup:
1. Proceed to [VAULT_GUARDIAN_AUTO_HEAL Configuration Guide](./02-VAULT-GUARDIAN-AUTO-HEAL.md)
2. Proceed to [VAULT_GUARDIAN_BACKUP_SYNC Configuration Guide](./03-VAULT-GUARDIAN-BACKUP-SYNC.md)
3. Document folder IDs in Make.com scenario configuration
4. Test end-to-end backup flow

## Support

For issues or questions:
- Check Make.com logs for connection errors
- Verify Google Drive API quotas
- Contact system administrator for permission issues

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-04  
**Maintained By**: IKE-BOT Infrastructure Team
