export async function fetchRules(url: string): Promise<string[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch rules from ${url}: ${response.statusText}`);
  }

  const text = await response.text();
  const lines = text.split('\n');
  const rules: string[] = [];
  let inPayload = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === 'payload:') {
      inPayload = true;
      continue;
    }
    if (inPayload && trimmed.startsWith('- ')) {
      let domain = trimmed.slice(2).replace(/^['"]|['"]$/g, '');
      domain = domain.replace(/^\+\./, '');
      rules.push(domain);
    }
  }

  return rules;
}
