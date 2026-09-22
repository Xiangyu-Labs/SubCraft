import { describe, it, expect } from 'vitest';
import { RULE_SOURCES, ruleTemplates } from '@/shared/rules';

describe('ruleTemplates', () => {
  it('exposes the eight expected templates', () => {
    expect(Object.keys(ruleTemplates).sort()).toEqual([
      'blacklist',
      'blacklist-adguard',
      'reverse-blacklist',
      'reverse-blacklist-adguard',
      'reverse-whitelist',
      'reverse-whitelist-adguard',
      'whitelist',
      'whitelist-adguard',
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
  it('every RULE-SET name resolves to a known upstream source', () => {
    for (const tpl of Object.values(ruleTemplates)) {
      for (const url of Object.values(tpl.ruleUrls ?? {})) {
        expect(Object.values(RULE_SOURCES)).toContain(url);
      }
    }
  });

  // 不带 no-resolve 时，走到 GEOIP 的域名会被强制真实解析一次做地理判定，
  // 既抵消 fake-ip 的收益，也是 DNS 链路出问题时的额外阻塞点。
  it('every GEOIP rule carries no-resolve', () => {
    for (const tpl of Object.values(ruleTemplates)) {
      for (const rule of tpl.rules) {
        if (rule.startsWith('GEOIP,')) {
          expect(rule.endsWith(',no-resolve')).toBe(true);
        }
      }
    }
  });

  it('blacklist templates fall through to DIRECT, matching their description', () => {
    expect(ruleTemplates.blacklist.rules.at(-1)).toBe('MATCH,DIRECT');
    expect(ruleTemplates['blacklist-adguard'].rules.at(-1)).toBe('MATCH,DIRECT');
  });

  it('whitelist templates fall through to PROXY', () => {
    expect(ruleTemplates.whitelist.rules.at(-1)).toBe('MATCH,PROXY');
    expect(ruleTemplates['whitelist-adguard'].rules.at(-1)).toBe('MATCH,PROXY');
  });
});
