export interface UserSession {
  id: number;
  username: string;
  fullName: string;
  employeeCode: string;
  department: string;
  roleId: number;
  roleName: string;
  isAdmin: boolean;
}

export interface EffectivePermission {
  moduleKey: string;
  moduleName: string;
  category: string;
  overrideMode: 'inherit' | 'grant' | 'revoke';
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canReport: boolean;
}

export interface AdminUserRecord extends UserSession {
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  effectivePermissions: EffectivePermission[];
}

export interface RolePermissionItem {
  moduleKey: string;
  moduleName: string;
  category: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canReport: boolean;
}

export interface RoleRecord {
  id: number;
  name: string;
  description: string;
  isAdmin: boolean;
  permissions: RolePermissionItem[];
}

export interface ModuleMeta {
  key: string;
  docIndex: number;
  name: string;
  shortName: string;
  category: 'Spinning & Prep' | 'Beaming' | 'Weaving & Looms' | 'Finishing & Packing';
  description: string;
  tables: string[];
}

export interface DbTableSummary {
  tableName: string;
  rowCount: number;
  columns: { name: string; type: string; pk: boolean }[];
  moduleKey: string;
  moduleName: string;
}
