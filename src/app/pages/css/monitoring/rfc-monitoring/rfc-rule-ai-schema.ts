export const RFC_RULE_FIELDS = {
  trustedRfc: {
    name: 'trustedRfc', type: 'boolean',
    description: 'Whether the connection uses Trusted RFC authentication (password-less)',
    values: [true, false],
  },
  sncEnabled: {
    name: 'sncEnabled', type: 'boolean',
    description: 'Whether SNC (Secure Network Communications) encryption is enabled',
    values: [true, false],
  },
  isExternal: {
    name: 'isExternal', type: 'boolean',
    description: 'Whether the target host is external (public IP, not RFC 1918 private)',
    values: [true, false],
  },
  hasPassword: {
    name: 'hasPassword', type: 'boolean',
    description: 'Whether a password is stored in the connection configuration',
    values: [true, false],
  },
  connectionType: {
    name: 'connectionType', type: 'enum',
    description: 'The type of RFC connection',
    values: ['3', 'H', 'G', 'T', 'L', 'I', 'X'],
    labels: {
      '3': 'RFC (Type 3)', 'H': 'HTTP', 'G': 'HTTP External',
      'T': 'TCP/IP', 'L': 'Logical', 'I': 'Internal', 'X': 'ABAP/CPI',
    } as { [key: string]: string },
  },
  isStandard: {
    name: 'isStandard', type: 'boolean',
    description: 'Whether the connection matches SAP standard naming patterns',
    values: [true, false],
  },
};

export const RFC_RULE_OPERATORS = {
  EQUALS: { name: 'EQUALS', description: 'Exact match' },
  NOT_EQUALS: { name: 'NOT_EQUALS', description: 'Not equal to' },
  IN: { name: 'IN', description: 'Matches any value in list' },
  NOT_IN: { name: 'NOT_IN', description: 'Does not match any value in list' },
};

export const RFC_RULE_SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

export interface RfcRuleCondition {
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'IN' | 'NOT_IN';
  value: boolean | string | string[] | boolean[];
}

export interface RfcRuleAIOutput {
  ruleName: string;
  ruleDescription: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  conditions: RfcRuleCondition[];
}
