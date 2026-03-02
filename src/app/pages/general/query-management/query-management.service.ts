export interface QueryDefinition {
  id: string;
  name: string;
  description: string;
  systemId: number;
  systemName: string;
  status: 'active' | 'draft' | 'inactive';
  active?: boolean;
  createdAt: Date;
  modifiedAt: Date;
  tableCount: number;

  selectedTables: Array<{
    id: number;
    tableName: string;
    formattedTableName: string;
    description: string;
  }>;

  selectedFields: Array<{
    id: number;
    fieldName: string;
    formattedFieldName: string;
    fieldDescription: string;
    fieldType: string;
    tableName: string;
  }>;

  joins: Array<{
    srcTable: string;
    srcField: string;
    targetTable: string;
    targetField: string;
    joinType: string;
  }>;

  extractionFilter: any;
  ruleFilter: any;
}
