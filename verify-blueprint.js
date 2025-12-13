/**
 * Verify Make blueprint and SintraPrime integration
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const BLUEPRINT_PATH = path.join(__dirname, 'src/config/templates/verizon_enforcement_v1.blueprint.json');
const SINTRA_DASHBOARD_URL = process.env.SINTRA_DASHBOARD_URL || 'http://localhost:5011';

async function verifyBlueprint() {
  console.log('🔍 Verifying Make Blueprint...\n');
  
  // Check if blueprint exists
  if (!fs.existsSync(BLUEPRINT_PATH)) {
    console.error('❌ Blueprint file not found:', BLUEPRINT_PATH);
    process.exit(1);
  }
  
  // Load and parse blueprint
  let blueprint;
  try {
    const content = fs.readFileSync(BLUEPRINT_PATH, 'utf8');
    blueprint = JSON.parse(content);
    console.log('✅ Blueprint file loaded successfully');
  } catch (error) {
    console.error('❌ Failed to parse blueprint:', error.message);
    process.exit(1);
  }
  
  // Verify blueprint structure
  console.log(`\n📋 Blueprint: ${blueprint.name}`);
  console.log(`   Version: ${blueprint.version}`);
  console.log(`   Description: ${blueprint.description}`);
  
  // Check for required template variables
  const requiredVars = ['CASE_ID', 'WEBHOOK_ID', 'SINTRA_DASHBOARD_URL', 'SINTRA_API_KEY', 'IKE_BOT_API_URL'];
  const foundVars = blueprint.variables.map(v => v.name);
  
  console.log('\n🔧 Template Variables:');
  requiredVars.forEach(varName => {
    if (foundVars.includes(varName)) {
      console.log(`   ✅ ${varName}`);
    } else {
      console.log(`   ❌ ${varName} (missing)`);
    }
  });
  
  // Check for template placeholders in flow
  const flowJSON = JSON.stringify(blueprint.flow);
  const templatePlaceholders = flowJSON.match(/\{\{[A-Z_]+\}\}/g) || [];
  console.log(`\n📌 Template Placeholders Found: ${[...new Set(templatePlaceholders)].length}`);
  [...new Set(templatePlaceholders)].forEach(placeholder => {
    console.log(`   - ${placeholder}`);
  });
  
  // Verify SintraPrime endpoints
  console.log('\n🌐 Verifying SintraPrime Dashboard...');
  try {
    const response = await axios.get(`${SINTRA_DASHBOARD_URL}/health`, { timeout: 5000 });
    console.log(`   ✅ Dashboard is running`);
    console.log(`   Mode: ${response.data.mode}`);
    console.log(`   Heartbeat file: ${response.data.heartbeat_file}`);
  } catch (error) {
    console.log(`   ⚠️  Dashboard not reachable: ${error.message}`);
    console.log(`   (Start it with: cd sintraprime-agent && npm run dashboard)`);
  }
  
  // Check fingerprints endpoint
  try {
    const response = await axios.get(`${SINTRA_DASHBOARD_URL}/fingerprints`, { timeout: 5000 });
    console.log(`\n🔎 Scenario Fingerprints:`);
    console.log(`   Count: ${response.data.count}`);
    response.data.blueprints.forEach(bp => {
      console.log(`   - ${bp.name} (v${bp.version})`);
    });
  } catch (error) {
    console.log(`\n⚠️  Could not fetch fingerprints: ${error.message}`);
  }
  
  console.log('\n✨ Verification complete!\n');
}

// Run verification
verifyBlueprint().catch(error => {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
});
