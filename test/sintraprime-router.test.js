// test/sintraprime-router.test.js
// Test suite for SintraPrime Router v1

const { routeMessage } = require('../src/utils/sintraprime-router-v1');

// Test cases
const testCases = [
  {
    name: 'Verizon Critical Risk',
    input: {
      id: 'test_001',
      source: 'gmail',
      from: 'noreply@verizonwireless.com',
      to: ['enforcement@howardtrust.com'],
      subject: 'FINAL NOTICE: Verizon Wireless Service Suspension',
      bodyText: 'Your Verizon Wireless account will be disconnected in 48 hours due to past due balance. This is a final notice.',
      date: '2025-12-08T10:00:00Z'
    },
    expectedDispatchTarget: 'VERIZON_ENFORCEMENT',
    expectedRiskLevel: 'critical'
  },
  {
    name: 'IRS Critical Risk',
    input: {
      id: 'test_002',
      source: 'gmail',
      from: 'notices@irs.gov',
      to: ['enforcement@howardtrust.com'],
      subject: 'Notice of Intent to Levy - CP-504',
      bodyText: 'Final notice before levy action. Intent to levy and lien will proceed. This is your final notice.',
      date: '2025-12-08T10:00:00Z'
    },
    expectedDispatchTarget: 'IRS_ENFORCEMENT',
    expectedRiskLevel: 'critical'
  },
  {
    name: 'Wells Fargo Medium Risk',
    input: {
      id: 'test_003',
      source: 'gmail',
      from: 'alerts@wellsfargo.com',
      to: ['enforcement@howardtrust.com'],
      subject: 'Account Status Update - Past Due',
      bodyText: 'Your account has a past due balance and is in collections. Please contact us immediately.',
      date: '2025-12-08T10:00:00Z'
    },
    expectedDispatchTarget: 'WELLS_FARGO_ENFORCEMENT',
    expectedRiskLevel: 'medium'
  },
  {
    name: 'Chase/EWS Medium Risk',
    input: {
      id: 'test_004',
      source: 'gmail',
      from: 'notifications@chase.com',
      to: ['enforcement@howardtrust.com'],
      subject: 'Account Closure Notice',
      bodyText: 'Your account has been closed and reported to Early Warning Services due to past due balance and collections activity.',
      date: '2025-12-08T10:00:00Z'
    },
    expectedDispatchTarget: 'CHASE_EWS_ENFORCEMENT',
    expectedRiskLevel: 'medium'
  },
  {
    name: 'Dakota Financial Collections',
    input: {
      id: 'test_005',
      source: 'gmail',
      from: 'collections@dakotafinancial.com',
      to: ['enforcement@howardtrust.com'],
      subject: 'Equipment Finance - Past Due',
      bodyText: 'Your Dakota equipment finance account is past due and in collections. Please remit payment immediately.',
      date: '2025-12-08T10:00:00Z'
    },
    expectedDispatchTarget: 'DAKOTA_FINANCIAL_ENFORCEMENT',
    expectedRiskLevel: 'medium'
  },
  {
    name: 'TikTok Lead (Low Risk)',
    input: {
      id: 'test_006',
      source: 'gmail',
      from: 'notifications@tiktok.com',
      to: ['enforcement@howardtrust.com'],
      subject: 'Someone mentioned you in a comment',
      bodyText: 'User123 mentioned you: How do I fix my credit?',
      date: '2025-12-08T10:00:00Z'
    },
    expectedDispatchTarget: 'TIKTOK_ACTIVITY',
    expectedRiskLevel: 'low'
  },
  {
    name: 'Beneficiary Impact Detection',
    input: {
      id: 'test_007',
      source: 'gmail',
      from: 'collections@dakotafinancial.com',
      to: ['enforcement@howardtrust.com'],
      subject: 'Final Notice',
      bodyText: 'Failure to pay may result in eviction and impact your family and children.',
      date: '2025-12-08T10:00:00Z'
    },
    expectedDispatchTarget: 'DAKOTA_FINANCIAL_ENFORCEMENT',
    expectedBeneficiaryFlag: true
  },
  {
    name: 'Dishonor Prediction - Refusal to Engage',
    input: {
      id: 'test_008',
      source: 'gmail',
      from: 'disputes@verizon.com',
      to: ['enforcement@howardtrust.com'],
      subject: 'Re: Dispute Response',
      bodyText: 'We will not respond further to your dispute. This is our final decision.',
      date: '2025-12-08T10:00:00Z'
    },
    expectedDispatchTarget: 'VERIZON_ENFORCEMENT',
    expectedDishonorLikelihood: 'high'
  },
  {
    name: 'General Inbox Fallback',
    input: {
      id: 'test_009',
      source: 'gmail',
      from: 'newsletter@example.com',
      to: ['enforcement@howardtrust.com'],
      subject: 'Weekly Newsletter',
      bodyText: 'Here are this week\'s updates...',
      date: '2025-12-08T10:00:00Z'
    },
    expectedDispatchTarget: 'GENERAL_INBOX',
    expectedRiskLevel: 'low'
  }
];

// Run tests
console.log('🧪 Running SintraPrime Router v1 Tests...\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  try {
    const decision = routeMessage(testCase.input);
    
    const dispatchMatches = decision.dispatchTarget === testCase.expectedDispatchTarget;
    const riskMatches = !testCase.expectedRiskLevel || decision.riskLevel === testCase.expectedRiskLevel;
    const beneficiaryMatches = !testCase.expectedBeneficiaryFlag || 
      decision.meta.beneficiaryImpact.beneficiaryFlag === testCase.expectedBeneficiaryFlag;
    const dishonorMatches = !testCase.expectedDishonorLikelihood ||
      decision.meta.dishonorPrediction.dishonorLikelihood === testCase.expectedDishonorLikelihood;
    
    if (dispatchMatches && riskMatches && beneficiaryMatches && dishonorMatches) {
      console.log(`✅ Test ${index + 1}: ${testCase.name}`);
      console.log(`   Dispatch: ${decision.dispatchTarget}`);
      console.log(`   Risk: ${decision.riskLevel}`);
      console.log(`   Tags: ${decision.tags.join(', ')}`);
      if (testCase.expectedDishonorLikelihood) {
        console.log(`   Dishonor: ${decision.meta.dishonorPrediction.dishonorLikelihood}`);
      }
      passed++;
    } else {
      console.log(`❌ Test ${index + 1}: ${testCase.name}`);
      console.log(`   Expected: ${testCase.expectedDispatchTarget} / ${testCase.expectedRiskLevel}`);
      console.log(`   Got: ${decision.dispatchTarget} / ${decision.riskLevel}`);
      if (!dishonorMatches) {
        console.log(`   Dishonor Expected: ${testCase.expectedDishonorLikelihood}`);
        console.log(`   Dishonor Got: ${decision.meta.dishonorPrediction.dishonorLikelihood}`);
      }
      failed++;
    }
    console.log('');
  } catch (error) {
    console.log(`❌ Test ${index + 1}: ${testCase.name} - ERROR`);
    console.log(`   ${error.message}`);
    console.log('');
    failed++;
  }
});

console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
