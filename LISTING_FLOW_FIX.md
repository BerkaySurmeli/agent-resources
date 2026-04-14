# Listing Flow - End-to-End Review & Fixes Needed

## Current Issues

1. **Version Field Missing** - Form doesn't collect version info
2. **Status Not Showing** - Dashboard doesn't show scanning/translating progress
3. **No Progress %** - Can't show percentage complete
4. **Listings Not Visible** - User can't see their listing after creation
5. **Status Communication** - Buyers don't see scan status before purchase

## Required Fixes

### 1. Sell Form (sell.tsx)
- [ ] Add version input field (semver format: 1.0.0)
- [ ] Add version validation
- [ ] Include version in form submission

### 2. Dashboard (dashboard.tsx)
- [ ] Show all user listings (not just approved)
- [ ] Display status badges (scanning, translating, approved, rejected)
- [ ] Show progress percentage for scanning/translating
- [ ] Add refresh button to check status updates

### 3. Listings API (listings.py)
- [ ] Add progress tracking for virus scan
- [ ] Add progress tracking for translation
- [ ] Return progress % in listing response
- [ ] Update status in real-time

### 4. Public Listings (listings.tsx)
- [ ] Show scan status to buyers
- [ ] Block purchase if scan not complete
- [ ] Show "Scanning..." badge

### 5. Listing Detail Page
- [ ] Show full status to buyer
- [ ] Show "Not available until scan complete" message

## Flow

1. User fills form (name, description, price, version, files)
2. Submit → Listing created with status='pending_scan'
3. Virus scan starts → status='scanning', show progress
4. Translation starts → show progress
5. Both complete → status='approved'
6. Listing appears in public listings
7. Buyers can purchase

## Status Values

- `pending_scan` - Waiting to start scan
- `scanning` - Virus scan in progress (show %)
- `translating` - Translation in progress (show %)
- `approved` - Ready for purchase
- `rejected` - Failed scan, show reason
