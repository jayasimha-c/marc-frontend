export interface MasterDataType {
  key: string;
  label: string;
  icon: string;
  apiEndpoint: string;
  hasActiveField: boolean;
  singularLabel: string;
}

export const MASTER_DATA_TYPES: MasterDataType[] = [
  {
    key: 'categories',
    label: 'Categories',
    icon: 'appstore',
    apiEndpoint: 'icm/category',
    hasActiveField: true,
    singularLabel: 'Category',
  },
  {
    key: 'groups',
    label: 'Groups',
    icon: 'folder',
    apiEndpoint: 'icm/group',
    hasActiveField: true,
    singularLabel: 'Group',
  },
  {
    key: 'regulations',
    label: 'Regulations',
    icon: 'audit',
    apiEndpoint: 'icm/regulation',
    hasActiveField: false,
    singularLabel: 'Regulation',
  },
];

export interface MasterDataItem {
  id?: number;
  name: string;
  description: string;
  isActive?: boolean;
  active?: boolean;
  status?: string;
}
