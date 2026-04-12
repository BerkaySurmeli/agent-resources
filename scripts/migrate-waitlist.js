#!/usr/bin/env node
/**
 * Migrate waitlist from production to dev environment
 * Usage: node migrate-waitlist.js
 */

const PROD_API = 'https://api.shopagentresources.com';
const DEV_API = 'https://agent-resources-api-dev-production.up.railway.app';

async function fetchProdWaitlist() {
  console.log('Fetching production waitlist...');
  const res = await fetch(`${PROD_API}/admin/waitlist/`);
  if (!res.ok) {
    throw new Error(`Failed to fetch prod waitlist: ${res.status}`);
  }
  return await res.json();
}

async function addToDev(entry) {
  const res = await fetch(`${DEV_API}/waitlist/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: entry.email,
      source: entry.source || 'website'
    })
  });
  
  if (!res.ok && res.status !== 409) { // 409 = already exists
    console.error(`Failed to add ${entry.email}:`, await res.text());
    return false;
  }
  
  return true;
}

async function main() {
  try {
    // Note: This requires admin access to production
    // You'll need to run this with the admin password
    console.log('This script requires admin access to production API');
    console.log('Please run with admin credentials or export manually');
    
    // For now, just show the approach
    console.log('\nTo migrate waitlist data:');
    console.log('1. Export from production admin dashboard (copy the table)');
    console.log('2. Or use the admin API with your token');
    console.log('3. Import to dev using the waitlist endpoint');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
