# Email Configuration Guide

## Zoho Mail Setup

### 1. Generate App-Specific Passwords

For each Zoho account you want to use:

1. Log into Zoho Mail (mail.zoho.com)
2. Go to **Settings** → **Security** → **App Passwords**
3. Click **Generate New Password**
4. Name it "Agent Resources API"
5. Copy the password (you'll only see it once!)

### 2. Environment Variables

Add these to your Railway deployment:

```bash
# SMTP Settings (same for both accounts)
ZOHO_SMTP_SERVER=smtp.zoho.com
ZOHO_SMTP_PORT=587

# Primary account (info@) - for verification emails
ZOHO_EMAIL=info@shopagentresources.com
ZOHO_PASSWORD=info_account_app_password

# Support account (support@) - for contact forms
ZOHO_SUPPORT_EMAIL=support@shopagentresources.com
ZOHO_SUPPORT_PASSWORD=support_account_app_password
```

### 3. Two Options

#### Option A: Same Password for Both (Simple)
If both emails are under the same Zoho account/organization:
```bash
ZOHO_EMAIL=info@shopagentresources.com
ZOHO_PASSWORD=your_app_password
ZOHO_SUPPORT_EMAIL=support@shopagentresources.com
# ZOHO_SUPPORT_PASSWORD can be blank - will use ZOHO_PASSWORD
```

#### Option B: Different Passwords (Separate Accounts)
If info@ and support@ are separate Zoho accounts:
```bash
ZOHO_EMAIL=info@shopagentresources.com
ZOHO_PASSWORD=info_app_password
ZOHO_SUPPORT_EMAIL=support@shopagentresources.com
ZOHO_SUPPORT_PASSWORD=support_app_password
```

### 4. Test the Setup

After deploying:
1. Sign up a new user → Should receive verification email from info@
2. Submit contact form → Should send to support@

### 5. Troubleshooting

Check Railway logs for:
- `[EMAIL] Verification email sent to ...` = Success
- `[EMAIL ERROR] SMTP Authentication failed` = Wrong password
- `[EMAIL] Zoho password not configured` = Missing env variable

### Email Flow

| Action | From | To | Purpose |
|--------|------|-----|---------|
| User signup | info@ | user@email.com | Verification link |
| Contact form | support@ | support@ | Contact submission |

Both emails will show "Agent Resources" as the sender name.
