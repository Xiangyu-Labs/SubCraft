import { describe, it, expect } from 'vitest';
import { ruleTemplates } from '@/shared/rules';

describe('ruleTemplates', () => {
  it('exposes the four expected templates', () => {
    expect(Object.keys(ruleTemplates).sort()).toEqual([
      'balanced',
      'global',
      'minimal',
      'pure',
    ]);
  });

  it('every template has id, name, description, rules', () => {
    for (const tpl of Object.values(ruleTemplates)) {
      expect(tpl.id).toBeTruthy();
      expect(tpl.name).toBeTruthy();
      expect(tpl.description).toBeTruthy();
      expect(Array.isArray(tpl.rules)).toBe(true);
      expect(tpl.rules.length).toBeGreaterThan(0);
    }
  });

  it('templates referencing RULE-SET have matching ruleUrls', () => {
    for (const tpl of Object.values(ruleTemplates)) {
      for (const rule of tpl.rules) {
        if (rule.startsWith('RULE-SET,')) {
          const setName = rule.split(',')[1];
          expect(tpl.ruleUrls?.[setName]).toBeTruthy();
        }
      }
    }
  });
});
