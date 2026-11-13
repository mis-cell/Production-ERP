import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Shield,
  Database,
  Server,
  Plus,
  Save,
  RefreshCw,
  Search,
  Copy,
  Trash2,
  Edit3,
  Table as TableIcon,
  Terminal,
  Activity,
} from 'lucide-react';
import {
  AdminUserRecord,
  RoleRecord,
  ModuleMeta,
  DbTableSummary,
  EffectivePermission,
} from '../types';

interface AdminConsoleProps {
  initialTab?: 'users' | 'roles' | 'database' | 'ubuntu';
  initialTableFilter?: string;
  currentUserId: number;
  onPermissionsUpdated: () => void;
  onOpenModule: (moduleKey: string) => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  initialTab = 'users',
  initialTableFilter = '',
  currentUserId,
  onPermissionsUpdated,
  onOpenModule,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'database' | 'ubuntu'>(initialTab);
  const [loading, setLoading] = useState(true);
  const [statusBanner, setStatusBanner] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [modules, setModules] = useState<ModuleMeta[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [selectedUserId, setSelectedUserId] = useState<number>(1);
  const [userPermDraft, setUserPermDraft] = useState<EffectivePermission[]>([]);

  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserRecord | null>(null);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    fullName: '',
    employeeCode: '',
    department: 'All Departments',
    roleId: 2,
    isActive: true,
  });

  const [selectedRoleId, setSelectedRoleId] = useState<number>(2);
  const [rolePermDraft, setRolePermDraft] = useState<RoleRecord['permissions']>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  const [dbTables, setDbTables] = useState<DbTableSummary[]>([]);
  const [schemaSql, setSchemaSql] = useState('');
  const [tableSearch, setTableSearch] = useState(initialTableFilter);
  const [selectedTable, setSelectedTable] = useState<string>('users');
  const [tableData, setTableData] = useState<{ columns: any[]; rows: any[] }>({ columns: [], rows: [] });
  const [loadingTable, setLoadingTable] = useState(false);

  // PostgreSQL (BJCL) Auto-Provisioning State
  const [pgConfig, setPgConfig] = useState({
    host: '127.0.0.1',
    port: '5432',
    user: 'postgres',
    password: '',
  });
  const [pgStatus, setPgStatus] = useState<any>(null);
  const [provisioningPg, setProvisioningPg] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusBanner({ text, type });
    setTimeout(() => setStatusBanner(null), 4000);
  };

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const [ovRes, dbRes] = await Promise.all([
        fetch('/api/admin/overview'),
        fetch('/api/admin/database/tables'),
      ]);
      const ovData = await ovRes.json();
      const dbData = await dbRes.json();

      if (ovData.ok) {
        setUsers(ovData.users);
        setRoles(ovData.roles);
        setModules(ovData.modules);
        setAuditLogs(ovData.auditLogs || []);

        const targetUser = ovData.users.find((u: AdminUserRecord) => u.id === selectedUserId) || ovData.users[0];
        if (targetUser) {
          setSelectedUserId(targetUser.id);
          setUserPermDraft(targetUser.effectivePermissions);
        }

        const targetRole = ovData.roles.find((r: RoleRecord) => r.id === selectedRoleId) || ovData.roles[0];
        if (targetRole) {
          setSelectedRoleId(targetRole.id);
          setRolePermDraft(targetRole.permissions);
        }
      }

      if (dbData.ok) {
        setDbTables(dbData.tables);
        setSchemaSql(dbData.schemaSql || '');
        if (dbData.postgresStatus) {
          setPgStatus(dbData.postgresStatus);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load admin console data', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedUserId, selectedRoleId]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (initialTableFilter) {
      setTableSearch(initialTableFilter);
      const match = dbTables.find((t) => t.moduleKey === initialTableFilter || t.tableName.includes(initialTableFilter));
      if (match) {
        setSelectedTable(match.tableName);
      }
    }
  }, [initialTableFilter, dbTables]);

  const loadTableRows = useCallback(async (tableName: string) => {
    if (!tableName) return;
    setLoadingTable(true);
    try {
      const res = await fetch(`/api/admin/database/tables/${tableName}`);
      const data = await res.json();
      if (data.ok) {
        setTableData({ columns: data.columns || [], rows: data.rows || [] });
      }
    } catch {
      // ignore
    } finally {
      setLoadingTable(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'database' && selectedTable) {
      loadTableRows(selectedTable);
    }
  }, [activeTab, selectedTable, loadTableRows]);

  const handleSelectUserForPerms = (user: AdminUserRecord) => {
    setSelectedUserId(user.id);
    setUserPermDraft(user.effectivePermissions.map((p) => ({ ...p })));
  };

  const handleUserPermChange = (
    moduleKey: string,
    field: keyof EffectivePermission,
    value: any
  ) => {
    setUserPermDraft((prev) =>
      prev.map((item) => {
        if (item.moduleKey !== moduleKey) return item;
        const updated = { ...item, [field]: value };
        if (field !== 'overrideMode' && item.overrideMode === 'inherit') {
          updated.overrideMode = 'grant';
        }
        if (field === 'overrideMode' && value === 'revoke') {
          updated.canView = false;
          updated.canCreate = false;
          updated.canEdit = false;
          updated.canDelete = false;
          updated.canReport = false;
        }
        return updated;
      })
    );
  };

  const saveUserSpecificPermissions = async () => {
    try {
      const res = await fetch(`/api/admin/users/${selectedUserId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: userPermDraft }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      showToast('User-specific permissions saved to "production" database.');
      await fetchOverview();
      onPermissionsUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to save user permissions', 'error');
    }
  };

  const openCreateUserModal = () => {
    setEditingUser(null);
    setUserForm({
      username: '',
      password: '',
      fullName: '',
      employeeCode: `BJM-${Math.floor(100 + Math.random() * 899)}`,
      department: 'All Departments',
      roleId: roles[1]?.id || 2,
      isActive: true,
    });
    setShowUserForm(true);
  };

  const openEditUserModal = (u: AdminUserRecord) => {
    setEditingUser(u);
    setUserForm({
      username: u.username,
      password: '',
      fullName: u.fullName,
      employeeCode: u.employeeCode,
      department: u.department,
      roleId: u.roleId,
      isActive: u.isActive,
    });
    setShowUserForm(true);
  };

  const handleSaveUserForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setShowUserForm(false);
      showToast(editingUser ? `Updated user ${userForm.username}` : `Created user ${userForm.username}`);
      await fetchOverview();
      onPermissionsUpdated();
    } catch (err: any) {
      showToast(err.message || 'Could not save user', 'error');
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (userId === 1 || userId === currentUserId) {
      showToast('Cannot delete the active or primary Super Admin account.', 'error');
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      showToast(`Deleted user ${username}`);
      await fetchOverview();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSelectRole = (role: RoleRecord) => {
    setSelectedRoleId(role.id);
    setRolePermDraft(role.permissions.map((p) => ({ ...p })));
  };

  const handleRolePermToggle = (
    moduleKey: string,
    field: 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canReport'
  ) => {
    setRolePermDraft((prev) =>
      prev.map((item) => (item.moduleKey === moduleKey ? { ...item, [field]: !item[field] } : item))
    );
  };

  const saveRolePermissions = async () => {
    try {
      const res = await fetch(`/api/admin/roles/${selectedRoleId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: rolePermDraft }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      showToast('Role permissions updated across all assigned users.');
      await fetchOverview();
      onPermissionsUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to update role permissions', 'error');
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoleName, description: newRoleDesc, isAdmin: false }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setNewRoleName('');
      setNewRoleDesc('');
      showToast(`Created role "${newRoleName}"`);
      await fetchOverview();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const selectedUserObj = users.find((u) => u.id === selectedUserId);
  const selectedRoleObj = roles.find((r) => r.id === selectedRoleId);

  const filteredTables = dbTables.filter(
    (t) =>
      t.tableName.toLowerCase().includes(tableSearch.toLowerCase()) ||
      t.moduleName.toLowerCase().includes(tableSearch.toLowerCase()) ||
      t.moduleKey.toLowerCase().includes(tableSearch.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#FCFBF9] p-6">
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* Top Admin Banner in Lotus Palette */}
        <div className="rounded-2xl bg-gradient-to-r from-[#3B0764] via-[#701A75] to-[#EA580C] text-white p-6 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-amber-300">
                Admin Panel · User & Role Permissions
              </div>
              <h1 className="text-2xl font-extrabold mt-0.5">
                System Administration & Permission Control
              </h1>
              <p className="text-xs text-purple-100 mt-1">
                Manage Users, Role Permissions, User Overrides, and SQL Tables.
              </p>
            </div>
          </div>
          <button
            onClick={fetchOverview}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-[#4C1D95] hover:bg-purple-50 text-xs font-bold cursor-pointer self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Admin Data
          </button>
        </div>

        {/* Status Toast */}
        {statusBanner && (
          <div
            className={`px-4 py-3 rounded-lg border text-sm font-medium flex items-center justify-between ${
              statusBanner.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <span>{statusBanner.text}</span>
            <button
              onClick={() => setStatusBanner(null)}
              className="text-xs underline ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-purple-200 pb-3">
          <button
            onClick={() => setActiveTab('users')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-[#4C1D95] to-[#9D174D] text-white shadow-xs'
                : 'bg-white text-slate-700 border border-purple-200 hover:bg-purple-50'
            }`}
          >
            <Users className="w-4 h-4" />
            1. Users & User Permissions ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'roles'
                ? 'bg-gradient-to-r from-[#4C1D95] to-[#9D174D] text-white shadow-xs'
                : 'bg-white text-slate-700 border border-purple-200 hover:bg-purple-50'
            }`}
          >
            <Shield className="w-4 h-4" />
            2. Role Permissions ({roles.length})
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'database'
                ? 'bg-gradient-to-r from-[#4C1D95] to-[#9D174D] text-white shadow-xs'
                : 'bg-white text-slate-700 border border-purple-200 hover:bg-purple-50'
            }`}
          >
            <Database className="w-4 h-4" />
            3. &ldquo;production&rdquo; Database ({dbTables.length} Tables)
          </button>
          <button
            onClick={() => setActiveTab('ubuntu')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'ubuntu'
                ? 'bg-gradient-to-r from-[#4C1D95] to-[#9D174D] text-white shadow-xs'
                : 'bg-white text-slate-700 border border-purple-200 hover:bg-purple-50'
            }`}
          >
            <Server className="w-4 h-4" />
            4. Ubuntu Server (192.168.1.6:3002)
          </button>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: USERS & USER-SPECIFIC PERMISSION OVERRIDES                   */}
        {/* =================================================================== */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white border border-purple-200 rounded-xl overflow-hidden flex flex-col shadow-xs">
              <div className="p-4 bg-purple-50/60 border-b border-purple-200 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#3B0764]">User Accounts</h2>
                  <p className="text-xs text-slate-600">Click a user to edit their department permissions</p>
                </div>
                <button
                  onClick={openCreateUserModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#EA580C] to-[#9D174D] hover:opacity-95 text-white text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create New User
                </button>
              </div>

              <div className="divide-y divide-purple-100">
                {users.map((u) => {
                  const isSelected = u.id === selectedUserId;
                  const accessibleCount = u.effectivePermissions.filter((p) => p.canView).length;
                  const overrideCount = u.effectivePermissions.filter((p) => p.overrideMode !== 'inherit').length;

                  return (
                    <div
                      key={u.id}
                      onClick={() => handleSelectUserForPerms(u)}
                      className={`p-4 transition-colors cursor-pointer ${
                        isSelected ? 'bg-orange-50/90' : 'hover:bg-purple-50/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#3B0764]">{u.fullName}</span>
                            {!u.isActive && (
                              <span className="text-xs font-semibold text-red-600">(Disabled)</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5 font-mono">
                            Login ID: <strong>{u.username}</strong> · Role: <strong>{u.roleName}</strong>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Allowed Forms: <strong className="tabular-nums text-[#9D174D]">{accessibleCount}/16</strong>
                            {overrideCount > 0 && (
                              <span className="text-orange-700 font-semibold">
                                {' '}· {overrideCount} Custom User Permission(s)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openEditUserModal(u)}
                            title="Edit User"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#3B0764] hover:bg-purple-100 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {u.id !== 1 && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              title="Delete User"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-7 bg-white border border-purple-200 rounded-xl overflow-hidden flex flex-col shadow-xs">
              <div className="p-4 bg-purple-50/60 border-b border-purple-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-[#3B0764]">
                    User Permissions: {selectedUserObj?.fullName} ({selectedUserObj?.username})
                  </h2>
                  <p className="text-xs text-slate-600">
                    Role: <strong>{selectedUserObj?.roleName}</strong> · Check or uncheck any form below to grant or revoke access for this specific user.
                  </p>
                </div>
                <button
                  onClick={saveUserSpecificPermissions}
                  disabled={selectedUserObj?.isAdmin}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3B0764] hover:bg-[#4C1D95] disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save User Permissions
                </button>
              </div>

              {selectedUserObj?.isAdmin ? (
                <div className="p-6 text-sm text-slate-700 bg-orange-50/50">
                  <strong>Super Admin Account:</strong> This user has full access to all 16 forms, all reports, and the Admin Panel. To restrict specific forms for a user, assign them a non-admin role (such as Mill Manager or Supervisor) and then customize their checkboxes here.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#3B0764] text-white text-[11px] font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Department Form (1–16)</th>
                        <th className="py-2.5 px-3">Rule Type</th>
                        <th className="py-2.5 px-2 text-center">Show Form</th>
                        <th className="py-2.5 px-2 text-center">Save Entry</th>
                        <th className="py-2.5 px-2 text-center">Edit</th>
                        <th className="py-2.5 px-2 text-center">Delete</th>
                        <th className="py-2.5 px-2 text-center">View Report</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-100 text-xs">
                      {userPermDraft.map((perm, idx) => (
                        <tr key={perm.moduleKey} className="hover:bg-orange-50/40">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-[#3B0764]">
                              {idx + 1}. {perm.moduleName}
                            </div>
                            <div className="text-[11px] text-slate-500">{perm.category}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <select
                              value={perm.overrideMode}
                              onChange={(e) =>
                                handleUserPermChange(
                                  perm.moduleKey,
                                  'overrideMode',
                                  e.target.value as 'inherit' | 'grant' | 'revoke'
                                )
                              }
                              className={`text-xs rounded-md border px-2 py-1 font-semibold ${
                                perm.overrideMode === 'grant'
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                  : perm.overrideMode === 'revoke'
                                  ? 'border-red-300 bg-red-50 text-red-800'
                                  : 'border-purple-200 bg-white text-slate-700'
                              }`}
                            >
                              <option value="inherit">Use Role Default</option>
                              <option value="grant">Custom User Permission</option>
                              <option value="revoke">Block Form Completely</option>
                            </select>
                          </td>
                          {(['canView', 'canCreate', 'canEdit', 'canDelete', 'canReport'] as const).map((field) => (
                            <td key={field} className="py-2.5 px-2 text-center">
                              <input
                                type="checkbox"
                                checked={Boolean(perm[field])}
                                disabled={perm.overrideMode === 'revoke'}
                                onChange={(e) =>
                                  handleUserPermChange(perm.moduleKey, field, e.target.checked)
                                }
                                className="w-4 h-4 accent-[#9D174D] rounded cursor-pointer"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: ROLES & ROLE PERMISSION MATRIX                               */}
        {/* =================================================================== */}
        {activeTab === 'roles' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white border border-purple-200 rounded-xl overflow-hidden shadow-xs">
                <div className="p-4 bg-purple-50/60 border-b border-purple-200">
                  <h2 className="text-base font-bold text-[#3B0764]">Roles List</h2>
                  <p className="text-xs text-slate-600">Select a role to edit its 16 department permissions</p>
                </div>
                <div className="divide-y divide-purple-100">
                  {roles.map((r) => {
                    const activeCount = r.permissions.filter((p) => p.canView).length;
                    return (
                      <div
                        key={r.id}
                        onClick={() => handleSelectRole(r)}
                        className={`p-4 cursor-pointer transition-colors ${
                          r.id === selectedRoleId ? 'bg-orange-50/90' : 'hover:bg-purple-50/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-[#3B0764]">{r.name}</span>
                          <span className="text-xs font-mono font-bold text-[#9D174D] tabular-nums">
                            {activeCount}/16 forms
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{r.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <form
                onSubmit={handleCreateRole}
                className="bg-white border border-purple-200 rounded-xl p-4 space-y-3 shadow-xs"
              >
                <h3 className="text-sm font-bold text-[#3B0764]">Add New Role</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role Name</label>
                  <input
                    type="text"
                    required
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="e.g., Shift Supervisor"
                    className="w-full px-3 py-2 text-xs border border-purple-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                    placeholder="What forms can this role access?"
                    className="w-full px-3 py-2 text-xs border border-purple-200 rounded-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-[#EA580C] to-[#9D174D] text-white text-xs font-bold cursor-pointer"
                >
                  Create Role
                </button>
              </form>
            </div>

            <div className="lg:col-span-8 bg-white border border-purple-200 rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 bg-purple-50/60 border-b border-purple-200 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#3B0764]">
                    Role Permissions: {selectedRoleObj?.name}
                  </h2>
                  <p className="text-xs text-slate-600">{selectedRoleObj?.description}</p>
                </div>
                <button
                  onClick={saveRolePermissions}
                  disabled={selectedRoleObj?.isAdmin}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3B0764] hover:bg-[#4C1D95] disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Role Permissions
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#3B0764] text-white text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-4">Department Form</th>
                      <th className="py-2.5 px-3">Group</th>
                      <th className="py-2.5 px-2 text-center">Show Form</th>
                      <th className="py-2.5 px-2 text-center">Save Entry</th>
                      <th className="py-2.5 px-2 text-center">Edit</th>
                      <th className="py-2.5 px-2 text-center">Delete</th>
                      <th className="py-2.5 px-2 text-center">View Report</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100 text-xs">
                    {rolePermDraft.map((perm, idx) => (
                      <tr key={perm.moduleKey} className="hover:bg-orange-50/40">
                        <td className="py-2.5 px-4 font-bold text-[#3B0764]">
                          {idx + 1}. {perm.moduleName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{perm.category}</td>
                        {(['canView', 'canCreate', 'canEdit', 'canDelete', 'canReport'] as const).map((field) => (
                          <td key={field} className="py-2.5 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={Boolean(perm[field])}
                              disabled={selectedRoleObj?.isAdmin}
                              onChange={() => handleRolePermToggle(perm.moduleKey, field)}
                              className="w-4 h-4 accent-[#9D174D] rounded cursor-pointer"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: DATABASE ("production") EXPLORER                             */}
        {/* =================================================================== */}
        {activeTab === 'database' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 bg-white border border-purple-200 rounded-xl overflow-hidden flex flex-col max-h-[760px] shadow-xs">
              <div className="p-4 bg-purple-50/60 border-b border-purple-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[#3B0764]">
                    Database: <code className="font-mono text-[#9D174D]">production</code>
                  </h2>
                  <span className="text-xs font-mono text-slate-600 tabular-nums">
                    {dbTables.length} Tables
                  </span>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Filter tables..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-purple-200 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="overflow-y-auto divide-y divide-purple-100 flex-1">
                {filteredTables.map((t) => (
                  <button
                    key={t.tableName}
                    onClick={() => setSelectedTable(t.tableName)}
                    className={`w-full text-left p-3 transition-colors flex items-center justify-between cursor-pointer ${
                      selectedTable === t.tableName ? 'bg-orange-50/90' : 'hover:bg-purple-50/40'
                    }`}
                  >
                    <div>
                      <div className="font-mono text-xs font-bold text-[#3B0764]">
                        {t.tableName}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {t.moduleName} · {t.columns.length} cols
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#9D174D] tabular-nums">
                      {t.rowCount} rows
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white border border-purple-200 rounded-xl overflow-hidden shadow-xs">
                <div className="p-4 bg-purple-50/60 border-b border-purple-200 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <TableIcon className="w-4 h-4 text-[#9D174D]" />
                      <h3 className="font-mono text-sm font-bold text-[#3B0764]">
                        production.{selectedTable}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Live table rows stored in <code className="font-mono">production.db</code>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadTableRows(selectedTable)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 bg-white text-xs font-semibold text-slate-700 hover:bg-purple-50 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingTable ? 'animate-spin' : ''}`} />
                      Reload
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(schemaSql);
                        showToast('Copied full production_schema.sql to clipboard!');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3B0764] text-white text-xs font-bold hover:bg-[#4C1D95] cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy SQL Schema
                    </button>
                  </div>
                </div>

                <div className="px-4 py-2.5 bg-[#FCFBF9] border-b border-purple-100 flex flex-wrap gap-2">
                  {tableData.columns.map((col: any) => (
                    <span
                      key={col.name}
                      className="font-mono text-[11px] text-slate-700 bg-white border border-purple-200 px-2 py-0.5 rounded"
                    >
                      <strong>{col.name}</strong>: <span className="text-slate-500">{col.type}</span>
                      {col.pk ? ' (PK)' : ''}
                    </span>
                  ))}
                </div>

                <div className="overflow-x-auto max-h-[520px]">
                  {tableData.rows.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">
                      No rows in <code className="font-mono">{selectedTable}</code> yet.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#3B0764] text-white text-[11px] font-mono font-bold">
                          {tableData.columns.map((c: any) => (
                            <th key={c.name} className="py-2.5 px-3 whitespace-nowrap">
                              {c.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-100 text-xs font-mono">
                        {tableData.rows.map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-orange-50/40">
                            {tableData.columns.map((c: any) => (
                              <td
                                key={c.name}
                                className="py-2 px-3 max-w-[260px] truncate text-slate-700"
                                title={String(row[c.name] ?? '')}
                              >
                                {String(row[c.name] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: UBUNTU 24 LOCAL SERVER (192.168.1.6:3002) & PGADMIN 4 GUIDE  */}
        {/* =================================================================== */}
        {activeTab === 'ubuntu' && (
          <div className="space-y-6">
            {/* Beginner Visual Overview of their exact pgAdmin 4 BJCL Server */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Exact pgAdmin 4 Object Explorer Visual + 1-Click Auto-Creator */}
              <div className="lg:col-span-5 bg-white border border-purple-200 rounded-xl p-5 space-y-4 shadow-xs">
                <div className="text-xs font-extrabold uppercase tracking-wider text-orange-600">
                  Your pgAdmin 4 Server on 192.168.1.6
                </div>
                <h2 className="text-base font-extrabold text-[#3B0764]">
                  How &ldquo;production&rdquo; is Added Safely Beside SQC &amp; bjcl_db
                </h2>

                {/* Visual Tree matching user's screenshot */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs space-y-1.5 text-slate-800">
                  <div className="font-bold text-slate-900">▾ Servers (1)</div>
                  <div className="pl-4 font-bold text-[#3B0764]">▾ 🐘 BJCL (PostgreSQL on 192.168.1.6)</div>
                  <div className="pl-8 font-semibold text-slate-700">▾ 🗄️ Databases (4)</div>
                  <div className="pl-12 text-slate-500">▸ 🛢️ SQC <span className="text-[10px] text-emerald-700 font-sans font-semibold">(Safe — Not Touched)</span></div>
                  <div className="pl-12 text-slate-500">▸ 🛢️ bjcl_db <span className="text-[10px] text-emerald-700 font-sans font-semibold">(Safe — Not Touched)</span></div>
                  <div className="pl-12 text-slate-500">▸ 🛢️ postgres <span className="text-[10px] text-emerald-700 font-sans font-semibold">(Safe — Not Touched)</span></div>
                  <div className="pl-12 py-1 px-2 rounded bg-amber-100 border border-amber-300 font-bold text-[#3B0764]">
                    ▾ 🛢️ production <span className="text-[10px] text-orange-700 font-sans">(NEW — Auto-Created!)</span>
                    <div className="pl-4 text-[11px] text-[#9D174D] font-normal mt-0.5">
                      ↳ Schemas ▸ public ▸ Tables (42 Tables Auto-Created)
                    </div>
                  </div>
                </div>

                {/* 1-Click Auto-Create in PostgreSQL Form */}
                <div className="border-t border-purple-100 pt-4 space-y-3">
                  <h3 className="text-sm font-extrabold text-[#3B0764]">
                    Automatic PostgreSQL Creator (When Running on 192.168.1.6)
                  </h3>
                  <p className="text-xs text-slate-600">
                    Enter your local PostgreSQL password below and click the button—the server will automatically create the <code className="font-mono font-bold">production</code> database and all 42 tables inside <strong>BJCL</strong> without touching <code className="font-mono">SQC</code> or <code className="font-mono">bjcl_db</code>:
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">PostgreSQL Host</label>
                      <input
                        type="text"
                        value={pgConfig.host}
                        onChange={(e) => setPgConfig({ ...pgConfig, host: e.target.value })}
                        className="w-full px-3 py-1.5 border border-purple-200 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Port</label>
                      <input
                        type="text"
                        value={pgConfig.port}
                        onChange={(e) => setPgConfig({ ...pgConfig, port: e.target.value })}
                        className="w-full px-3 py-1.5 border border-purple-200 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">PG Username</label>
                      <input
                        type="text"
                        value={pgConfig.user}
                        onChange={(e) => setPgConfig({ ...pgConfig, user: e.target.value })}
                        className="w-full px-3 py-1.5 border border-purple-200 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">PG Password</label>
                      <input
                        type="password"
                        value={pgConfig.password}
                        onChange={(e) => setPgConfig({ ...pgConfig, password: e.target.value })}
                        placeholder="postgres password"
                        className="w-full px-3 py-1.5 border border-purple-200 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={provisioningPg}
                    onClick={async () => {
                      setProvisioningPg(true);
                      try {
                        const res = await fetch('/api/admin/postgres/provision', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(pgConfig),
                        });
                        const data = await res.json();
                        setPgStatus(data.status);
                        if (data.ok) {
                          showToast(data.status.message, 'success');
                        } else {
                          showToast(data.status?.message || 'Could not reach PostgreSQL from cloud preview; run on 192.168.1.6 or use Method 1 below.', 'error');
                        }
                      } catch (err: any) {
                        showToast(err.message, 'error');
                      } finally {
                        setProvisioningPg(false);
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#EA580C] to-[#9D174D] text-white text-xs font-extrabold shadow-xs hover:opacity-95 cursor-pointer"
                  >
                    {provisioningPg
                      ? 'Connecting & Creating Database "production"...'
                      : 'Auto-Create "production" Database & 42 Tables Now'}
                  </button>
                  {pgStatus && (
                    <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-[11px] font-mono text-[#3B0764]">
                      Status: {pgStatus.message}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Beginner Step-by-Step Guide (Method 1: pgAdmin 4 GUI & Method 2: Terminal) */}
              <div className="lg:col-span-7 bg-white border border-purple-200 rounded-xl p-6 space-y-5 shadow-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-wider">
                      <Terminal className="w-4 h-4" />
                      Beginner Step-by-Step Guide for 192.168.1.6
                    </div>
                    <h2 className="text-lg font-extrabold text-[#3B0764] mt-0.5">
                      2 Easy Ways to Create &ldquo;production&rdquo; &amp; Run on Port 3002
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(schemaSql);
                      showToast('Copied PostgreSQL 42-Table Script to Clipboard! Paste it in pgAdmin 4 Query Tool.');
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3B0764] hover:bg-[#4C1D95] text-white text-xs font-extrabold cursor-pointer shadow-xs"
                  >
                    <Copy className="w-3.5 h-3.5 text-amber-300" />
                    Copy PostgreSQL Script (42 Tables)
                  </button>
                </div>

                {/* METHOD 1: Inside pgAdmin 4 (the window open in user's screenshot) */}
                <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200 space-y-2.5">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-[#9D174D]">
                    Method 1 (Easiest): Using pgAdmin 4 Open on Your Screen (BJCL)
                  </div>
                  <ol className="list-decimal list-inside text-xs text-slate-800 space-y-2 leading-relaxed">
                    <li>
                      In your <strong>pgAdmin 4</strong> window under <strong>BJCL</strong>, <strong>Right-Click</strong> on <strong>Databases (3)</strong> &rarr; click <strong>Create</strong> &rarr; click <strong>Database...</strong>
                    </li>
                    <li>
                      In the <strong>Database</strong> name box, type <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-orange-300 text-[#3B0764]">production</code> and click <strong>Save</strong>. <em>(Your existing <code className="font-mono">SQC</code> and <code className="font-mono">bjcl_db</code> databases are not touched at all!)</em>
                    </li>
                    <li>
                      Click once on your new <strong>production</strong> database on the left, then click <strong>Tools &rarr; Query Tool</strong> in the top menu bar of pgAdmin 4.
                    </li>
                    <li>
                      Click the purple <strong>&ldquo;Copy PostgreSQL Script (42 Tables)&rdquo;</strong> button above, press <strong>Ctrl + V</strong> inside the pgAdmin Query Tool, and click the <strong>Play / Execute (▶)</strong> button. All <strong>42 tables and fields</strong> are created automatically!
                    </li>
                  </ol>
                </div>

                {/* METHOD 2: 1-Command Ubuntu Terminal Auto-Setup */}
                <div className="space-y-2">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-[#3B0764]">
                    Method 2 (Automatic): Run 1 Command in Ubuntu Terminal on 192.168.1.6
                  </div>
                  <p className="text-xs text-slate-600">
                    Open the Terminal inside your project folder on Ubuntu (<code className="font-mono">192.168.1.6</code>) and run this single script—it automatically creates the <code className="font-mono">production</code> database in PostgreSQL, creates all 42 tables, and starts the web app on <strong>Port 3002</strong>:
                  </p>
                  <div className="bg-[#1E0B36] text-purple-100 rounded-xl p-4 font-mono text-xs overflow-x-auto space-y-2">
                    <div className="text-amber-400 font-bold"># 1. Download from GitHub into Production-ERP-main:</div>
                    <div>cd ~</div>
                    <div>git clone https://github.com/mis-cell/Production-ERP.git Production-ERP-main</div>
                    <div>cd ~/Production-ERP-main</div>
                    <div className="text-amber-400 font-bold pt-1"># 2. Auto-create PostgreSQL "production" DB + 42 Tables + Start Port 3002:</div>
                    <div>chmod +x setup-postgres-production.sh</div>
                    <div>./setup-postgres-production.sh</div>
                    <div className="text-emerald-400 pt-1"># 3. Or keep running 24/7 in background:</div>
                    <div>chmod +x deploy-ubuntu24-port3002.sh && ./deploy-ubuntu24-port3002.sh</div>
                  </div>
                </div>

                {/* Activity Log Summary */}
                <div className="border-t border-purple-100 pt-3 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 font-semibold text-[#3B0764]">
                    <Activity className="w-3.5 h-3.5 text-[#9D174D]" />
                    Recent Database Events: {auditLogs.length} logged actions
                  </span>
                  <span className="font-mono">Target: http://192.168.1.6:3002</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit User Modal */}
      {showUserForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-purple-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-[#3B0764]">
              {editingUser ? `Edit User: @${editingUser.username}` : 'Create New User Account'}
            </h3>
            <form onSubmit={handleSaveUserForm} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Username (Login ID)</label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingUser)}
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="e.g. carding_user"
                  className="w-full px-3 py-2 border border-purple-200 rounded-lg disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="Enter password"
                  className="w-full px-3 py-2 border border-purple-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={userForm.fullName}
                    onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                    placeholder="Operator Name"
                    className="w-full px-3 py-2 border border-purple-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Employee Code</label>
                  <input
                    type="text"
                    value={userForm.employeeCode}
                    onChange={(e) => setUserForm({ ...userForm, employeeCode: e.target.value })}
                    placeholder="BJM-105"
                    className="w-full px-3 py-2 border border-purple-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assign Role</label>
                  <select
                    value={userForm.roleId}
                    onChange={(e) => setUserForm({ ...userForm, roleId: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-purple-200 rounded-lg bg-white"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={userForm.department}
                    onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                    className="w-full px-3 py-2 border border-purple-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="userActiveChk"
                  checked={userForm.isActive}
                  onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
                  className="w-4 h-4 accent-[#9D174D]"
                />
                <label htmlFor="userActiveChk" className="font-bold text-slate-700">
                  Account Active (Allow Login)
                </label>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-purple-100">
                <button
                  type="button"
                  onClick={() => setShowUserForm(false)}
                  className="px-4 py-2 rounded-lg border border-purple-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#EA580C] to-[#9D174D] text-white font-bold cursor-pointer"
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
