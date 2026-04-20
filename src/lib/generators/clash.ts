import type { VlessNode, ClashConfig, ClashProxy, RuleTemplate as RuleTemplateType } from '../types';
import { ruleTemplates } from '../rules';

function vlessToClashProxy(node: VlessNode): ClashProxy {
  const proxy: ClashProxy = {
    name: node.name,
    type: 'vless',
    server: node.server,
    port: node.port,
    uuid: node.uuid,
  };

  if (node.tls) {
    proxy.tls = true;
    proxy['skip-cert-verify'] = false;
    if (node.sni) {
      proxy.servername = node.sni;
    }
  }

  if (node.network === 'ws') {
    proxy.network = 'ws';
    proxy['ws-opts'] = {
      path: node.wsPath || '/',
    };
    if (node.wsHost) {
      proxy['ws-opts'].headers = {
        Host: node.wsHost,
      };
    }
  }

  return proxy;
}

export function generateClashConfig(
  nodes: VlessNode[],
  templateId: RuleTemplateType
): ClashConfig {
  const template = ruleTemplates[templateId];
  if (!template) {
    throw new Error(`Unknown rule template: ${templateId}`);
  }

  const proxies = nodes.map(vlessToClashProxy);
  const proxyNames = proxies.map(p => p.name);

  const config: ClashConfig = {
    proxies,
    'proxy-groups': [
      {
        name: 'PROXY',
        type: 'select',
        proxies: proxyNames,
      },
    ],
    rules: template.rules,
  };

  if (template.ruleProviders) {
    config['rule-providers'] = template.ruleProviders;
  }

  return config;
}
