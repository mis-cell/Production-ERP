import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Shield,
  Database,
  Plus,
  Save,
  RefreshCw,
  Search,
  Copy,
  Trash2,
  Edit3,
  Table as TableIcon,
} from 'lucide-react';
import {
  AdminUserRecord,
  RoleRecord,
  DbTableSummary,
  EffectivePermission,
} from '../types';

interface AdminConsoleProps {
  initialTab?: 'users' | 'roles' | 'database';
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
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'database'>(initialTab);
  const [loading, setLoading] = useState(true);
  const [statusBanner, setStatusBanner] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);

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

  const [dbTables, setDbTables] = useState<DbTableSummary[]>([]);
  const [schemaSql, setSchemaSql] = useState('');
  const [tableSearch, setTableSearch] = useState(initialTableFilter);
  const [selectedTable, setSelectedTable] = useState<string>('users');
  const [tableData, setTableData] = useState<{ columns: any[]; rows: any[] }>({ columns: [], rows: [] });
  const [loadingTable, setLoadingTable] = useState(false);

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
      showToast('Permissions saved to "production" database.');
      await fetchOverview();
      onPermissionsUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to save permissions', 'error');
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
        body: JSON.stringify({ name: newRoleName, description: '', isAdmin: false }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setNewRoleName('');
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
    <div className="flex-1 overflow-y-auto bg-[#FDE2EF] p-6 text-[#38001E]">
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* Top Admin Banner in 8-Plate Glossy Magenta-to-Blush */}
        <div className="rounded-2xl hd-gloss-banner text-white p-6 border-2 border-[#F595C3] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black drop-shadow-xs">
              System Administration &amp; Permission Control
            </h1>
          </div>
          <button
            onClick={fetchOverview}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-[#38001E] hover:bg-[#FDE2EF] text-xs font-black cursor-pointer self-start md:self-auto shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#9E0059] ${loading ? 'animate-spin' : ''}`} />
            Refresh Admin Data
          </button>
        </div>

        {/* Status Toast */}
        {statusBanner && (
          <div
            className={`px-4 py-3 rounded-lg border-2 text-sm font-black flex items-center justify-between ${
              statusBanner.type === 'error'
                ? 'bg-red-50 border-red-400 text-red-900'
                : 'bg-[#F9BCDA] border-[#9E0059] text-[#38001E]'
            }`}
          >
            <span>{statusBanner.text}</span>
            <button
              onClick={() => setStatusBanner(null)}
              className="text-xs font-black underline ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b-2 border-[#EC69A8] pb-3">
          <button
            onClick={() => setActiveTab('users')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-black transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'hd-gloss-btn text-white'
                : 'bg-white text-[#38001E] border-2 border-[#EC69A8] hover:bg-[#F9BCDA]'
            }`}
          >
            <Users className="w-4 h-4" />
            1. Users &amp; User Permissions ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-black transition-all cursor-pointer ${
              activeTab === 'roles'
                ? 'hd-gloss-btn text-white'
                : 'bg-white text-[#38001E] border-2 border-[#EC69A8] hover:bg-[#F9BCDA]'
            }`}
          >
            <Shield className="w-4 h-4" />
            2. Role Permissions ({roles.length})
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-black transition-all cursor-pointer ${
              activeTab === 'database'
                ? 'hd-gloss-btn text-white'
                : 'bg-white text-[#38001E] border-2 border-[#EC69A8] hover:bg-[#F9BCDA]'
            }`}
          >
            <Database className="w-4 h-4" />
            3. &ldquo;production&rdquo; Database ({dbTables.length} Tables)
          </button>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: USERS & USER-SPECIFIC PERMISSION OVERRIDES                   */}
        {/* =================================================================== */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 hd-gloss-card rounded-xl overflow-hidden flex flex-col">
              <div className="p-4 bg-gradient-to-r from-[#F9BCDA] to-[#FDE2EF] border-b-2 border-[#EC69A8] flex items-center justify-between">
                <h2 className="text-base font-black text-[#38001E]">User Accounts</h2>
                <button
                  onClick={openCreateUserModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg hd-gloss-btn text-white text-xs font-black cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create New User
                </button>
              </div>

              <div className="divide-y divide-[#F595C3] bg-white">
                {users.map((u) => {
                  const isSelected = u.id === selectedUserId;
                  const accessibleCount = u.effectivePermissions.filter((p) => p.canView).length;
                  const overrideCount = u.effectivePermissions.filter((p) => p.overrideMode !== 'inherit').length;

                  return (
                    <div
                      key={u.id}
                      onClick={() => handleSelectUserForPerms(u)}
                      className={`p-4 transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#F9BCDA]/80' : 'hover:bg-[#FDE2EF]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-[#38001E]">{u.fullName}</span>
                            {!u.isActive && (
                              <span className="text-xs font-black text-red-700">(Disabled)</span>
                            )}
                          </div>
                          <div className="text-xs font-extrabold text-[#38001E] mt-0.5 font-mono">
                            Login ID: <strong className="text-[#9E0059]">{u.username}</strong> · Role: <strong className="text-[#9E0059]">{u.roleName}</strong>
                          </div>
                          <div className="text-xs font-extrabold text-[#38001E] mt-1">
                            Allowed Forms: <strong className="tabular-nums font-black text-[#9E0059]">{accessibleCount}/16</strong>
                            {overrideCount > 0 && (
                              <span className="text-[#9E0059] font-black">
                                {' '}· {overrideCount} Custom User Permission(s)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openEditUserModal(u)}
                            title="Edit User"
                            className="p-1.5 rounded-lg text-[#38001E] hover:text-[#9E0059] hover:bg-[#FDE2EF] cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {u.id !== 1 && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              title="Delete User"
                              className="p-1.5 rounded-lg text-[#38001E] hover:text-red-700 hover:bg-red-50 cursor-pointer"
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

            <div className="lg:col-span-7 hd-gloss-card rounded-xl overflow-hidden flex flex-col">
              {!selectedUserObj?.isAdmin && (
                <div className="p-4 bg-gradient-to-r from-[#F9BCDA] to-[#FDE2EF] border-b-2 border-[#EC69A8] flex items-center justify-end">
                  <button
                    onClick={saveUserSpecificPermissions}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg hd-gloss-btn text-white text-xs font-black cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Permissions
                  </button>
                </div>
              )}

              <div className="overflow-x-auto bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="hd-gloss-banner text-white text-[11px] font-black uppercase tracking-wider">
                      <th className="py-2.5 px-3">Department Form (1–16)</th>
                      <th className="py-2.5 px-3">Rule Type</th>
                      <th className="py-2.5 px-2 text-center">Show Form</th>
                      <th className="py-2.5 px-2 text-center">Save Entry</th>
                      <th className="py-2.5 px-2 text-center">Edit</th>
                      <th className="py-2.5 px-2 text-center">Delete</th>
                      <th className="py-2.5 px-2 text-center">View Report</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F595C3] text-xs font-extrabold text-[#38001E]">
                    {userPermDraft.map((perm, idx) => (
                      <tr key={perm.moduleKey} className="hover:bg-[#FDE2EF]">
                        <td className="py-2.5 px-3">
                          <div className="font-black text-[#38001E]">
                            {idx + 1}. {perm.moduleName}
                          </div>
                          <div className="text-[11px] font-bold text-[#9E0059]">{perm.category}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={perm.overrideMode}
                            disabled={Boolean(selectedUserObj?.isAdmin)}
                            onChange={(e) =>
                              handleUserPermChange(
                                perm.moduleKey,
                                'overrideMode',
                                e.target.value as 'inherit' | 'grant' | 'revoke'
                              )
                            }
                            className={`text-xs rounded-md border-2 px-2 py-1 font-black ${
                              perm.overrideMode === 'grant'
                                ? 'border-[#9E0059] bg-[#F9BCDA] text-[#38001E]'
                                : perm.overrideMode === 'revoke'
                                ? 'border-red-400 bg-red-50 text-red-900'
                                : 'border-[#EC69A8] bg-white text-[#38001E]'
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
                              disabled={Boolean(selectedUserObj?.isAdmin) || perm.overrideMode === 'revoke'}
                              onChange={(e) =>
                                handleUserPermChange(perm.moduleKey, field, e.target.checked)
                              }
                              className="w-4 h-4 accent-[#9E0059] rounded cursor-pointer"
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
        {/* TAB 2: ROLES & ROLE PERMISSION MATRIX                               */}
        {/* =================================================================== */}
        {activeTab === 'roles' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-6">
              <div className="hd-gloss-card rounded-xl overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-[#F9BCDA] to-[#FDE2EF] border-b-2 border-[#EC69A8]">
                  <h2 className="text-base font-black text-[#38001E]">Roles List</h2>
                </div>
                <div className="divide-y divide-[#F595C3] bg-white">
                  {roles.map((r) => {
                    const activeCount = r.permissions.filter((p) => p.canView).length;
                    return (
                      <div
                        key={r.id}
                        onClick={() => handleSelectRole(r)}
                        className={`p-4 cursor-pointer transition-colors ${
                          r.id === selectedRoleId ? 'bg-[#F9BCDA]/80' : 'hover:bg-[#FDE2EF]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-sm text-[#38001E]">{r.name}</span>
                          <span className="text-xs font-mono font-black text-[#9E0059] tabular-nums">
                            {activeCount}/16 forms
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <form
                onSubmit={handleCreateRole}
                className="hd-gloss-card rounded-xl p-4 space-y-3"
              >
                <h3 className="text-sm font-black text-[#38001E]">Add New Role</h3>
                <div>
                  <label className="block text-xs font-black text-[#38001E] mb-1">Role Name</label>
                  <input
                    type="text"
                    required
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="e.g., Shift Supervisor"
                    className="w-full px-3 py-2 text-xs font-black border-2 border-[#EC69A8] rounded-lg bg-white text-[#38001E]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg hd-gloss-btn text-white text-xs font-black cursor-pointer"
                >
                  Create Role
                </button>
              </form>
            </div>

            <div className="lg:col-span-8 hd-gloss-card rounded-xl overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-[#F9BCDA] to-[#FDE2EF] border-b-2 border-[#EC69A8] flex items-center justify-between">
                <h2 className="text-base font-black text-[#38001E]">
                  Role Permissions: {selectedRoleObj?.name}
                </h2>
                <button
                  onClick={saveRolePermissions}
                  disabled={selectedRoleObj?.isAdmin}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg hd-gloss-btn disabled:opacity-40 text-white text-xs font-black cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Role Permissions
                </button>
              </div>

              <div className="overflow-x-auto bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="hd-gloss-banner text-white text-[11px] font-black uppercase tracking-wider">
                      <th className="py-2.5 px-4">Department Form</th>
                      <th className="py-2.5 px-3">Group</th>
                      <th className="py-2.5 px-2 text-center">Show Form</th>
                      <th className="py-2.5 px-2 text-center">Save Entry</th>
                      <th className="py-2.5 px-2 text-center">Edit</th>
                      <th className="py-2.5 px-2 text-center">Delete</th>
                      <th className="py-2.5 px-2 text-center">View Report</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F595C3] text-xs font-extrabold text-[#38001E]">
                    {rolePermDraft.map((perm, idx) => (
                      <tr key={perm.moduleKey} className="hover:bg-[#FDE2EF]">
                        <td className="py-2.5 px-4 font-black text-[#38001E]">
                          {idx + 1}. {perm.moduleName}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#9E0059]">{perm.category}</td>
                        {(['canView', 'canCreate', 'canEdit', 'canDelete', 'canReport'] as const).map((field) => (
                          <td key={field} className="py-2.5 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={Boolean(perm[field])}
                              disabled={selectedRoleObj?.isAdmin}
                              onChange={() => handleRolePermToggle(perm.moduleKey, field)}
                              className="w-4 h-4 accent-[#9E0059] rounded cursor-pointer"
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
            <div className="lg:col-span-4 hd-gloss-card rounded-xl overflow-hidden flex flex-col max-h-[760px]">
              <div className="p-4 bg-gradient-to-r from-[#F9BCDA] to-[#FDE2EF] border-b-2 border-[#EC69A8] space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black text-[#38001E]">
                    Database: <code className="font-mono font-black text-[#9E0059]">production</code>
                  </h2>
                  <span className="text-xs font-mono font-black text-[#38001E] tabular-nums">
                    {dbTables.length} Tables
                  </span>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#9E0059] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Filter tables..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs font-black border-2 border-[#EC69A8] rounded-lg bg-white text-[#38001E]"
                  />
                </div>
              </div>

              <div className="overflow-y-auto divide-y divide-[#F595C3] flex-1 bg-white">
                {filteredTables.map((t) => (
                  <button
                    key={t.tableName}
                    onClick={() => setSelectedTable(t.tableName)}
                    className={`w-full text-left p-3 transition-colors flex items-center justify-between cursor-pointer ${
                      selectedTable === t.tableName ? 'bg-[#F9BCDA]/80' : 'hover:bg-[#FDE2EF]'
                    }`}
                  >
                    <div>
                      <div className="font-mono text-xs font-black text-[#38001E]">
                        {t.tableName}
                      </div>
                      <div className="text-[11px] font-bold text-[#9E0059] mt-0.5">
                        {t.moduleName} · {t.columns.length} cols
                      </div>
                    </div>
                    <span className="text-xs font-mono font-black text-[#9E0059] tabular-nums">
                      {t.rowCount} rows
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <div className="hd-gloss-card rounded-xl overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-[#F9BCDA] to-[#FDE2EF] border-b-2 border-[#EC69A8] flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <TableIcon className="w-4 h-4 text-[#9E0059]" />
                      <h3 className="font-mono text-sm font-black text-[#38001E]">
                        production.{selectedTable}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadTableRows(selectedTable)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-[#EC69A8] bg-white text-xs font-black text-[#38001E] hover:bg-[#F9BCDA] cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-[#9E0059] ${loadingTable ? 'animate-spin' : ''}`} />
                      Reload
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(schemaSql);
                        showToast('Copied SQL Schema to clipboard!');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hd-gloss-btn text-white text-xs font-black cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy SQL Schema
                    </button>
                  </div>
                </div>

                <div className="px-4 py-2.5 bg-[#FDE2EF] border-b-2 border-[#F595C3] flex flex-wrap gap-2">
                  {tableData.columns.map((col: any) => (
                    <span
                      key={col.name}
                      className="font-mono text-[11px] font-black text-[#38001E] bg-white border border-[#EC69A8] px-2 py-0.5 rounded"
                    >
                      <strong>{col.name}</strong>: <span className="text-[#9E0059]">{col.type}</span>
                      {col.pk ? ' (PK)' : ''}
                    </span>
                  ))}
                </div>

                <div className="overflow-x-auto max-h-[520px] bg-white">
                  {tableData.rows.length === 0 ? (
                    <div className="p-8 text-center text-sm font-black text-[#38001E]">
                      No rows in <code className="font-mono">{selectedTable}</code> yet.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="hd-gloss-banner text-white text-[11px] font-mono font-black">
                          {tableData.columns.map((c: any) => (
                            <th key={c.name} className="py-2.5 px-3 whitespace-nowrap">
                              {c.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F595C3] text-xs font-mono font-extrabold text-[#38001E]">
                        {tableData.rows.map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-[#FDE2EF]">
                            {tableData.columns.map((c: any) => (
                              <td
                                key={c.name}
                                className="py-2 px-3 max-w-[260px] truncate text-[#38001E]"
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
      </div>

      {/* Create / Edit User Modal */}
      {showUserForm && (
        <div className="fixed inset-0 z-50 bg-[#38001E]/60 flex items-center justify-center p-4">
          <div className="hd-gloss-card rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-[#38001E]">
              {editingUser ? `Edit User: @${editingUser.username}` : 'Create New User Account'}
            </h3>
            <form onSubmit={handleSaveUserForm} className="space-y-3 text-xs font-extrabold text-[#38001E]">
              <div>
                <label className="block font-black text-[#38001E] mb-1">Username (Login ID)</label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingUser)}
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="e.g. carding_user"
                  className="w-full px-3 py-2 border-2 border-[#EC69A8] rounded-lg bg-white text-[#38001E] font-black disabled:bg-[#FDE2EF]"
                />
              </div>
              <div>
                <label className="block font-black text-[#38001E] mb-1">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="Enter password"
                  className="w-full px-3 py-2 border-2 border-[#EC69A8] rounded-lg bg-white text-[#38001E] font-black"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-[#38001E] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={userForm.fullName}
                    onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                    placeholder="Operator Name"
                    className="w-full px-3 py-2 border-2 border-[#EC69A8] rounded-lg bg-white text-[#38001E] font-black"
                  />
                </div>
                <div>
                  <label className="block font-black text-[#38001E] mb-1">Employee Code</label>
                  <input
                    type="text"
                    value={userForm.employeeCode}
                    onChange={(e) => setUserForm({ ...userForm, employeeCode: e.target.value })}
                    placeholder="BJM-105"
                    className="w-full px-3 py-2 border-2 border-[#EC69A8] rounded-lg bg-white text-[#38001E] font-black"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-[#38001E] mb-1">Assign Role</label>
                  <select
                    value={userForm.roleId}
                    onChange={(e) => setUserForm({ ...userForm, roleId: Number(e.target.value) })}
                    className="w-full px-3 py-2 border-2 border-[#EC69A8] rounded-lg bg-white text-[#38001E] font-black"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-black text-[#38001E] mb-1">Department</label>
                  <input
                    type="text"
                    value={userForm.department}
                    onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-[#EC69A8] rounded-lg bg-white text-[#38001E] font-black"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="userActiveChk"
                  checked={userForm.isActive}
                  onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
                  className="w-4 h-4 accent-[#9E0059]"
                />
                <label htmlFor="userActiveChk" className="font-black text-[#38001E]">
                  Account Active (Allow Login)
                </label>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t-2 border-[#F595C3]">
                <button
                  type="button"
                  onClick={() => setShowUserForm(false)}
                  className="px-4 py-2 rounded-lg border-2 border-[#EC69A8] bg-white text-[#38001E] font-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg hd-gloss-btn text-white font-black cursor-pointer"
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
