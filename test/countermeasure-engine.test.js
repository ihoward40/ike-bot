// countermeasure-engine.test.js
// Test suite for Router v4 Countermeasure Engine

const {
  generateCountermeasures,
  decidePriorityAndPosture,
  selectTracks,
  getRegulatorChannels,
  buildActions,
  calculateTimelines,
  requiresHumanReview
} = require('../src/utils/countermeasure-engine');

describe('Countermeasure Engine - Router v4', () => {
  
  // ============================================
  // Priority & Posture Tests
  // ============================================
  
  describe('decidePriorityAndPosture', () => {
    test('Critical risk level triggers emergency posture', () => {
      const decision = {
        creditor: 'Verizon',
        riskLevel: 'critical',
        meta: {
          dishonorPrediction: { dishonorLikelihood: 'low', flags: [] },
          beneficiaryImpact: { beneficiaryFlag: false, severity: 'none' }
        }
      };

      const result = decidePriorityAndPosture(decision);
      
      expect(result.priority).toBe('critical');
      expect(result.posture).toBe('emergency');
      expect(result.flags).toContain('CRITICAL_RISK');
    });

    test('High dishonor prediction escalates priority', () => {
      const decision = {
        creditor: 'Wells Fargo',
        riskLevel: 'medium',
        meta: {
          dishonorPrediction: { 
            dishonorLikelihood: 'high',
            flags: ['refusal_to_engage', 'final_decision_language']
          },
          beneficiaryImpact: { beneficiaryFlag: false, severity: 'none' }
        }
      };

      const result = decidePriorityAndPosture(decision);
      
      expect(result.priority).toBe('high');
      expect(result.posture).toBe('enforce');
      expect(result.flags).toContain('DISHONOR_LIKELY');
    });

    test('Beneficiary at risk escalates to high priority', () => {
      const decision = {
        creditor: 'Verizon',
        riskLevel: 'low',
        meta: {
          dishonorPrediction: { dishonorLikelihood: 'low', flags: [] },
          beneficiaryImpact: { 
            beneficiaryFlag: true,
            severity: 'high',
            markers: ['housing', 'medical', 'disability']
          }
        }
      };

      const result = decidePriorityAndPosture(decision);
      
      expect(result.priority).toBe('high');
      expect(result.flags).toContain('BENEFICIARY_AT_RISK');
    });

    test('Adversarial persona changes posture from observe to press', () => {
      const decision = {
        creditor: 'Dakota Financial',
        riskLevel: 'low',
        meta: {
          dishonorPrediction: { dishonorLikelihood: 'low', flags: [] },
          beneficiaryImpact: { beneficiaryFlag: false, severity: 'none' }
        }
      };

      const persona = {
        behaviorProfile: 'ADVERSARIAL',
        responsePattern: 'ENGAGED',
        trustScore: 30,
        flags: []
      };

      const result = decidePriorityAndPosture(decision, persona);
      
      expect(result.posture).toBe('press');
      expect(result.flags).toContain('ADVERSARIAL_ENTITY');
    });

    test('Stonewalling pattern triggers enforce posture', () => {
      const decision = {
        creditor: 'Chase / EWS',
        riskLevel: 'medium',
        meta: {
          dishonorPrediction: { dishonorLikelihood: 'medium', flags: [] },
          beneficiaryImpact: { beneficiaryFlag: false, severity: 'none' }
        }
      };

      const persona = {
        behaviorProfile: 'PROCEDURAL',
        responsePattern: 'STONEWALLING',
        trustScore: 25,
        flags: ['delay_tactics']
      };

      const result = decidePriorityAndPosture(decision, persona);
      
      expect(result.posture).toBe('enforce');
      expect(result.flags).toContain('STONEWALLING');
    });

    test('Zero trust score adds flag', () => {
      const decision = {
        creditor: 'Verizon',
        riskLevel: 'low',
        meta: {
          dishonorPrediction: { dishonorLikelihood: 'low', flags: [] },
          beneficiaryImpact: { beneficiaryFlag: false, severity: 'none' }
        }
      };

      const persona = {
        behaviorProfile: 'NEGLECTFUL',
        responsePattern: 'SILENT',
        trustScore: 10,
        flags: []
      };

      const result = decidePriorityAndPosture(decision, persona);
      
      expect(result.flags).toContain('ZERO_TRUST');
      expect(result.priority).toBe('medium');
    });
  });

  // ============================================
  // Track Selection Tests
  // ============================================

  describe('selectTracks', () => {
    test('Observe posture returns MONITOR only', () => {
      const tracks = selectTracks('Verizon', 'observe', []);
      expect(tracks).toEqual(['MONITOR']);
    });

    test('Press posture includes ADMIN', () => {
      const tracks = selectTracks('Wells Fargo', 'press', []);
      expect(tracks).toContain('ADMIN');
    });

    test('Dishonor flag adds REGULATOR track', () => {
      const tracks = selectTracks('Verizon', 'enforce', ['DISHONOR_LIKELY']);
      expect(tracks).toContain('ADMIN');
      expect(tracks).toContain('REGULATOR');
    });

    test('Stonewalling adds REGULATOR track', () => {
      const tracks = selectTracks('Chase / EWS', 'press', ['STONEWALLING']);
      expect(tracks).toContain('REGULATOR');
    });

    test('Verizon emergency adds REGULATOR', () => {
      const tracks = selectTracks('Verizon', 'emergency', ['CRITICAL_RISK']);
      expect(tracks).toContain('REGULATOR');
    });

    test('IRS gets special IRS_PROCEDURE track', () => {
      const tracks = selectTracks('IRS', 'enforce', ['HIGH_RISK']);
      expect(tracks).toContain('IRS_PROCEDURE');
    });

    test('Emergency posture adds LITIGATION', () => {
      const tracks = selectTracks('Wells Fargo', 'emergency', ['CRITICAL_RISK']);
      expect(tracks).toContain('LITIGATION');
    });

    test('Banking with high risk gets REGULATOR', () => {
      const tracks = selectTracks('Wells Fargo', 'enforce', ['HIGH_RISK']);
      expect(tracks).toContain('REGULATOR');
    });
  });

  // ============================================
  // Regulator Channel Tests
  // ============================================

  describe('getRegulatorChannels', () => {
    test('Verizon maps to FCC, BPU, STATE_AG', () => {
      const channels = getRegulatorChannels('Verizon');
      expect(channels).toEqual(['FCC', 'BPU', 'STATE_AG']);
    });

    test('Wells Fargo maps to CFPB, OCC, STATE_AG', () => {
      const channels = getRegulatorChannels('Wells Fargo');
      expect(channels).toEqual(['CFPB', 'OCC', 'STATE_AG']);
    });

    test('IRS maps to TAS, TIGTA', () => {
      const channels = getRegulatorChannels('IRS');
      expect(channels).toEqual(['TAS', 'TIGTA']);
    });

    test('TikTok maps to FTC, STATE_AG', () => {
      const channels = getRegulatorChannels('TikTok');
      expect(channels).toEqual(['FTC', 'STATE_AG']);
    });

    test('Unknown creditor defaults to CFPB, STATE_AG', () => {
      const channels = getRegulatorChannels('Unknown Entity');
      expect(channels).toEqual(['CFPB', 'STATE_AG']);
    });
  });

  // ============================================
  // Action Builder Tests
  // ============================================

  describe('buildActions', () => {
    test('ADMIN track with critical priority creates final demand', () => {
      const decision = {
        creditor: 'Verizon',
        riskLevel: 'critical',
        meta: {}
      };

      const actions = buildActions(['ADMIN'], 'Verizon', 'critical', decision);
      
      expect(actions.length).toBeGreaterThan(0);
      expect(actions[0].templateKey).toBe('FINAL_LEGAL_DEMAND');
      expect(actions[0].timeframeDays).toBe(3);
      expect(actions[0].requiresEvidence).toBe(true);
    });

    test('ADMIN track with high priority creates formal dispute', () => {
      const decision = {
        creditor: 'Wells Fargo',
        riskLevel: 'high',
        meta: {}
      };

      const actions = buildActions(['ADMIN'], 'Wells Fargo', 'high', decision);
      
      expect(actions[0].templateKey).toBe('FORMAL_DISPUTE_LETTER');
      expect(actions[0].timeframeDays).toBe(7);
    });

    test('ADMIN track with medium priority creates follow-up', () => {
      const decision = {
        creditor: 'Dakota Financial',
        riskLevel: 'medium',
        meta: {}
      };

      const actions = buildActions(['ADMIN'], 'Dakota Financial', 'medium', decision);
      
      expect(actions[0].templateKey).toBe('ADMIN_FOLLOW_UP');
      expect(actions[0].timeframeDays).toBe(15);
      expect(actions[0].requiresEvidence).toBe(false);
    });

    test('REGULATOR track creates complaint action', () => {
      const decision = {
        creditor: 'Verizon',
        riskLevel: 'high',
        meta: {}
      };

      const actions = buildActions(['REGULATOR'], 'Verizon', 'high', decision);
      
      expect(actions[0].track).toBe('REGULATOR');
      expect(actions[0].channel).toBe('FCC');
      expect(actions[0].templateKey).toBe('REGULATOR_COMPLAINT');
      expect(actions[0].prerequisites).toContain('ADMIN');
    });

    test('Critical priority adds secondary regulator', () => {
      const decision = {
        creditor: 'Wells Fargo',
        riskLevel: 'critical',
        meta: {}
      };

      const actions = buildActions(['REGULATOR'], 'Wells Fargo', 'critical', decision);
      
      expect(actions.length).toBe(2);
      expect(actions[0].channel).toBe('CFPB');
      expect(actions[1].channel).toBe('OCC');
      expect(actions[1].templateKey).toBe('REGULATOR_COMPLAINT_SECONDARY');
    });

    test('IRS_PROCEDURE with record denial creates TAS request', () => {
      const decision = {
        creditor: 'IRS',
        riskLevel: 'high',
        meta: {
          dishonorPrediction: {
            dishonorLikelihood: 'high',
            flags: ['record_denial']
          }
        }
      };

      const actions = buildActions(['IRS_PROCEDURE'], 'IRS', 'high', decision);
      
      expect(actions[0].channel).toBe('TAS');
      expect(actions[0].templateKey).toBe('TAS_ASSISTANCE_REQUEST');
    });

    test('IRS_PROCEDURE without denial creates standard response', () => {
      const decision = {
        creditor: 'IRS',
        riskLevel: 'medium',
        meta: {
          dishonorPrediction: {
            dishonorLikelihood: 'low',
            flags: []
          }
        }
      };

      const actions = buildActions(['IRS_PROCEDURE'], 'IRS', 'medium', decision);
      
      expect(actions[0].channel).toBe('IRS');
      expect(actions[0].templateKey).toBe('IRS_PROCEDURAL_RESPONSE');
      expect(actions[0].timeframeDays).toBe(30);
    });

    test('LITIGATION track creates TRO prep and evidence package', () => {
      const decision = {
        creditor: 'Verizon',
        riskLevel: 'critical',
        meta: {}
      };

      const actions = buildActions(['LITIGATION'], 'Verizon', 'critical', decision);
      
      expect(actions.length).toBe(2);
      expect(actions[0].templateKey).toBe('TRO_PREP');
      expect(actions[0].timeframeDays).toBe(1);
      expect(actions[1].templateKey).toBe('LITIGATION_EVIDENCE_PACKAGE');
    });

    test('MONITOR track creates monitoring log', () => {
      const decision = {
        creditor: 'TikTok',
        riskLevel: 'low',
        meta: {}
      };

      const actions = buildActions(['MONITOR'], 'TikTok', 'low', decision);
      
      expect(actions[0].track).toBe('MONITOR');
      expect(actions[0].templateKey).toBe('MONITORING_LOG');
      expect(actions[0].timeframeDays).toBe(30);
      expect(actions[0].requiresEvidence).toBe(false);
    });
  });

  // ============================================
  // Timeline Calculator Tests
  // ============================================

  describe('calculateTimelines', () => {
    test('Calculates immediate and final deadlines', () => {
      const actions = [
        { templateKey: 'FINAL_LEGAL_DEMAND', timeframeDays: 3 },
        { templateKey: 'REGULATOR_COMPLAINT', timeframeDays: 15 }
      ];

      const timelines = calculateTimelines(actions);
      
      expect(timelines.immediate).toBeDefined();
      expect(timelines.immediate.action).toBe('FINAL_LEGAL_DEMAND');
      expect(timelines.immediate.days).toBe(3);
      
      expect(timelines.final).toBeDefined();
      expect(timelines.final.action).toBe('REGULATOR_COMPLAINT');
      expect(timelines.final.days).toBe(15);
    });

    test('Includes standard regulatory deadlines', () => {
      const actions = [
        { templateKey: 'ADMIN_FOLLOW_UP', timeframeDays: 7 }
      ];

      const timelines = calculateTimelines(actions);
      
      expect(timelines.fifteenDayNotice).toBeDefined();
      expect(timelines.thirtyDayDispute).toBeDefined();
    });
  });

  // ============================================
  // Human Review Tests
  // ============================================

  describe('requiresHumanReview', () => {
    test('Critical priority requires review', () => {
      const result = requiresHumanReview('critical', 'enforce', []);
      expect(result).toBe(true);
    });

    test('Emergency posture requires review', () => {
      const result = requiresHumanReview('high', 'emergency', []);
      expect(result).toBe(true);
    });

    test('Litigation actions require review', () => {
      const actions = [{ track: 'LITIGATION', templateKey: 'TRO_PREP' }];
      const result = requiresHumanReview('high', 'enforce', actions);
      expect(result).toBe(true);
    });

    test('Multiple regulator actions require review', () => {
      const actions = [
        { track: 'REGULATOR', templateKey: 'REGULATOR_COMPLAINT' },
        { track: 'REGULATOR', templateKey: 'REGULATOR_COMPLAINT_SECONDARY' }
      ];
      const result = requiresHumanReview('high', 'enforce', actions);
      expect(result).toBe(true);
    });

    test('Low priority admin only does not require review', () => {
      const actions = [{ track: 'ADMIN', templateKey: 'ADMIN_FOLLOW_UP' }];
      const result = requiresHumanReview('low', 'press', actions);
      expect(result).toBe(false);
    });
  });

  // ============================================
  // Full Integration Tests
  // ============================================

  describe('generateCountermeasures - Full Integration', () => {
    test('Verizon critical case generates emergency plan', () => {
      const routerDecision = {
        dispatchTarget: 'VERIZON_ENFORCEMENT',
        creditor: 'Verizon',
        riskLevel: 'critical',
        tags: ['creditor:verizon', 'risk_keywords', 'dishonor_watch'],
        meta: {
          dishonorPrediction: {
            dishonorLikelihood: 'high',
            flags: ['refusal_to_engage', 'final_decision_language']
          },
          beneficiaryImpact: {
            beneficiaryFlag: true,
            severity: 'high',
            markers: ['housing', 'medical']
          }
        }
      };

      const plan = generateCountermeasures(routerDecision);
      
      expect(plan.priority).toBe('critical');
      expect(plan.posture).toBe('emergency');
      expect(plan.recommendedPath).toBe('EMERGENCY_INTERVENTION');
      expect(plan.requiresHumanReview).toBe(true);
      expect(plan.flags).toContain('CRITICAL_RISK');
      expect(plan.flags).toContain('DISHONOR_LIKELY');
      expect(plan.flags).toContain('BENEFICIARY_AT_RISK');
      expect(plan.actions.length).toBeGreaterThan(0);
      expect(plan.timelines).toBeDefined();
      expect(plan.narrative).toContain('Verizon');
    });

    test('Wells Fargo medium case with stonewalling generates enforcement plan', () => {
      const routerDecision = {
        dispatchTarget: 'WELLS_FARGO_ENFORCEMENT',
        creditor: 'Wells Fargo',
        riskLevel: 'medium',
        tags: ['creditor:wells_fargo'],
        meta: {
          dishonorPrediction: {
            dishonorLikelihood: 'medium',
            flags: []
          },
          beneficiaryImpact: {
            beneficiaryFlag: false,
            severity: 'none'
          }
        }
      };

      const persona = {
        behaviorProfile: 'PROCEDURAL',
        responsePattern: 'STONEWALLING',
        trustScore: 20,
        flags: ['delay_tactics']
      };

      const plan = generateCountermeasures(routerDecision, persona);
      
      expect(plan.priority).toBe('medium');
      expect(plan.posture).toBe('enforce');
      expect(plan.recommendedPath).toBe('AGGRESSIVE_ENFORCEMENT');
      expect(plan.flags).toContain('STONEWALLING');
      expect(plan.actions.some(a => a.track === 'REGULATOR')).toBe(true);
    });

    test('IRS low priority generates monitoring plan', () => {
      const routerDecision = {
        dispatchTarget: 'IRS_ENFORCEMENT',
        creditor: 'IRS',
        riskLevel: 'low',
        tags: ['creditor:irs'],
        meta: {
          dishonorPrediction: {
            dishonorLikelihood: 'low',
            flags: []
          },
          beneficiaryImpact: {
            beneficiaryFlag: false,
            severity: 'none'
          }
        }
      };

      const plan = generateCountermeasures(routerDecision);
      
      expect(plan.priority).toBe('low');
      expect(plan.posture).toBe('observe');
      expect(plan.recommendedPath).toBe('MONITORING_MODE');
      expect(plan.actions[0].track).toBe('MONITOR');
      expect(plan.requiresHumanReview).toBe(false);
    });

    test('Dakota Financial high risk with adversarial persona generates active dispute plan', () => {
      const routerDecision = {
        dispatchTarget: 'DAKOTA_FINANCIAL_ENFORCEMENT',
        creditor: 'Dakota Financial',
        riskLevel: 'high',
        tags: ['creditor:dakota_financial', 'risk_keywords'],
        meta: {
          dishonorPrediction: {
            dishonorLikelihood: 'medium',
            flags: []
          },
          beneficiaryImpact: {
            beneficiaryFlag: false,
            severity: 'none'
          }
        }
      };

      const persona = {
        behaviorProfile: 'ADVERSARIAL',
        responsePattern: 'BOILERPLATE',
        trustScore: 35,
        flags: []
      };

      const plan = generateCountermeasures(routerDecision, persona);
      
      expect(plan.priority).toBe('high');
      expect(plan.posture).toBe('enforce');
      expect(plan.flags).toContain('ADVERSARIAL_ENTITY');
      expect(plan.flags).toContain('HIGH_RISK');
      expect(plan.actions.some(a => a.track === 'ADMIN')).toBe(true);
    });

    test('TikTok low priority generates simple monitoring', () => {
      const routerDecision = {
        dispatchTarget: 'TIKTOK_ACTIVITY',
        creditor: 'TikTok',
        riskLevel: 'low',
        tags: ['creditor:tiktok'],
        meta: {
          dishonorPrediction: {
            dishonorLikelihood: 'low',
            flags: []
          },
          beneficiaryImpact: {
            beneficiaryFlag: false,
            severity: 'none'
          }
        }
      };

      const plan = generateCountermeasures(routerDecision);
      
      expect(plan.posture).toBe('observe');
      expect(plan.actions[0].track).toBe('MONITOR');
      expect(plan.requiresHumanReview).toBe(false);
    });

    test('Missing creditor throws error', () => {
      const invalidDecision = {
        dispatchTarget: 'UNKNOWN',
        riskLevel: 'medium',
        meta: {}
      };

      expect(() => {
        generateCountermeasures(invalidDecision);
      }).toThrow('invalid routerDecision');
    });
  });
});
