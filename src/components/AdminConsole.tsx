import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  X,
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
  isCurrentUserAdmin?: boolean;
  onPermissionsUpdated: () => void;
  onOpenModule: (moduleKey: string) => void;
}

const PREFERRED_ROLE_ORDER = [
  'Operator',
  'User',
  'Super User',
  'Super Admin',
  'Mill Manager',
  'Spinning & Prep Supervisor',
  'Beaming & Loom Supervisor',
  'Finishing & Packing Officer',
];

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  initialTab = 'users',
  initialTableFilter = '',
  currentUserId,
  isCurrentUserAdmin = true,
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

  // Admin-only DB Row Edit Modal State
  const [editingDbRow, setEditingDbRow] = useState<any | null>(null);
  const [editingDbRowDraft, setEditingDbRowDraft] = useState<Record<string, any>>({});
  const [savingDbRow, setSavingDbRow] = useState(false);

  const orderedRoles = useMemo(() => {
    return [...roles].sort((a, b) => {
      const idxA = PREFERRED_ROLE_ORDER.findIndex((n) => n.toLowerCase() === a.name.toLowerCase());
      const idxB = PREFERRED_ROLE_ORDER.findIndex((n) => n.toLowerCase() === b.name.toLowerCase());
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.id - b.id;
    });
  }, [roles]);

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
      const match = dbTables.find(
        (t) => t.moduleKey === initialTableFilter || t.tableName.includes(initialTableFilter)
      );
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
    const defaultRole =
      orderedRoles.find((r) => r.name.toLowerCase() === 'operator') ||
      orderedRoles.find((r) => r.name.toLowerCase() === 'user') ||
      orderedRoles[0];
    setUserForm({
      username: '',
      password: '',
      fullName: '',
      employeeCode: `BJM-${Math.floor(100 + Math.random() * 899)}`,
      department: 'All Departments',
      roleId: defaultRole?.id || 2,
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

  // =========================================================================
  // ADMIN-ONLY DATABASE TABLE ROW EDIT & DELETE HANDLERS
  // =========================================================================
  const openEditDbRowModal = (row: any) => {
    if (!isCurrentUserAdmin) {
      showToast('Only Admin is permitted to edit database rows.', 'error');
      return;
    }
    const draft: Record<string, any> = {};
    for (const col of tableData.columns) {
      draft[col.name] = row[col.name] ?? '';
    }
    setEditingDbRow(row);
    setEditingDbRowDraft(draft);
  };

  const handleSaveDbRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDbRow || !selectedTable) return;
    setSavingDbRow(true);
    try {
      const pkColObj = tableData.columns.find((c: any) => c.pk);
      const pkCol = pkColObj ? pkColObj.name : undefined;
      const pkVal = pkCol ? editingDbRow[pkCol] : undefined;

      const res = await fetch(`/api/admin/database/tables/${selectedTable}/rows`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          rowid: editingDbRow.__rowid__,
          pkCol,
          pkVal,
          updatedFields: editingDbRowDraft,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Failed to update database row');
      setEditingDbRow(null);
      showToast(`Updated row in production.${selectedTable} (Synced to PostgreSQL)`);
      await loadTableRows(selectedTable);
      await fetchOverview();
      onPermissionsUpdated();
    } catch (err: any) {
      showToast(err.message || 'Could not update row', 'error');
    } finally {
      setSavingDbRow(false);
    }
  };

  const handleDeleteDbRow = async (row: any) => {
    if (!isCurrentUserAdmin) {
      showToast('Only Admin is permitted to delete database rows.', 'error');
      return;
    }
    const pkColObj = tableData.columns.find((c: any) => c.pk);
    const pkCol = pkColObj ? pkColObj.name : undefined;
    const pkVal = pkCol ? row[pkCol] : undefined;

    if (selectedTable === 'users' && (Number(pkVal) === 1 || Number(row.id) === 1)) {
      showToast('Primary Super Admin account (id=1) cannot be deleted.', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/admin/database/tables/${selectedTable}/rows`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          rowid: row.__rowid__,
          pkCol,
          pkVal,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Failed to delete database row');
      showToast(`Deleted row from production.${selectedTable} (Synced to PostgreSQL)`);
      await loadTableRows(selectedTable);
      await fetchOverview();
      onPermissionsUpdated();
    } catch (err: any) {
      showToast(err.message || 'Could not delete row', 'error');
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
    <div className="flex-1 overflow-y-auto bg-[#FAF7FD] p-6 text-[#1E0538]">
      <div className="max-w-[1440px] mx-auto space-y-5">
        {/* Top Admin Banner Matching Screenshot 2 (YAJUR Purple-Crimson-Orange Gradient) */}
        <div className="rounded-2xl yajur-banner p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight text-white">
              System Administration &amp; Permission Control
            </h1>
          </div>
          <button
            onClick={fetchOverview}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-semibold cursor-pointer self-start md:self-auto transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#FDE68A] ${loading ? 'animate-spin' : ''}`} />
            Refresh Admin Data
          </button>
        </div>

        {/* Status Toast */}
        {statusBanner && (
          <div
            className={`px-4 py-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
              statusBanner.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-[#F3E8FF] border-[#D8B4FE] text-[#3B0764]'
            }`}
          >
            <span>{statusBanner.text}</span>
            <button
              onClick={() => setStatusBanner(null)}
              className="text-xs font-bold underline ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Navigation Tabs Matching Screenshot 2 */}
        <div className="flex flex-wrap gap-2.5 border-b border-[#E9D5FF] pb-3">
          <button
            onClick={() => setActiveTab('users')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'yajur-active-tab text-white'
                : 'bg-white text-[#240046] border border-[#E9D5FF] hover:bg-[#FAF5FF]'
            }`}
          >
            <Users className="w-4 h-4" />
            1. Users &amp; User Permissions ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'roles'
                ? 'yajur-active-tab text-white'
                : 'bg-white text-[#240046] border border-[#E9D5FF] hover:bg-[#FAF5FF]'
            }`}
          >
            <Shield className="w-4 h-4" />
            2. Role Permissions ({roles.length})
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'database'
                ? 'yajur-active-tab text-white'
                : 'bg-white text-[#240046] border border-[#E9D5FF] hover:bg-[#FAF5FF]'
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
            <div className="lg:col-span-5 bg-white border border-[#E9D5FF] rounded-2xl shadow-xs overflow-hidden flex flex-col">
              <div className="p-4 bg-[#FAF5FF] border-b border-[#E9D5FF] flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#240046]">User Accounts</h2>
                {isCurrentUserAdmin && (
                  <button
                    onClick={openCreateUserModal}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#3B0764] hover:bg-[#4C1D95] text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create New User
                  </button>
                )}
              </div>

              <div className="divide-y divide-[#F3E8FF] bg-white">
                {users.map((u) => {
                  const isSelected = u.id === selectedUserId;
                  const accessibleCount = u.effectivePermissions.filter((p) => p.canView).length;
                  const overrideCount = u.effectivePermissions.filter((p) => p.overrideMode !== 'inherit').length;

                  return (
                    <div
                      key={u.id}
                      onClick={() => handleSelectUserForPerms(u)}
                      className={`p-4 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#FAF5FF] border-l-4 border-l-[#9D174D]'
                          : 'hover:bg-[#FAF5FF]/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#240046]">{u.fullName}</span>
                            {!u.isActive && (
                              <span className="text-xs font-semibold text-red-600">(Disabled)</span>
                            )}
                          </div>
                          <div className="text-xs text-[#4C1D95] mt-0.5 font-mono">
                            Login ID: <strong className="text-[#9D174D] font-bold">{u.username}</strong> · Role:{' '}
                            <strong className="text-[#9D174D] font-bold">{u.roleName}</strong>
                          </div>
                          <div className="text-xs text-[#3B0764] mt-1">
                            Allowed Forms:{' '}
                            <strong className="tabular-nums font-bold text-[#9D174D]">
                              {accessibleCount}/16
                            </strong>
                            {overrideCount > 0 && (
                              <span className="text-[#9D174D] font-semibold">
                                {' '}· {overrideCount} Custom Override(s)
                              </span>
                            )}
                          </div>
                        </div>
                        {isCurrentUserAdmin && (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => openEditUserModal(u)}
                              title="Edit User"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-[#3B0764] hover:bg-[#F3E8FF] border border-[#E9D5FF] cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            {u.id !== 1 && (
                              <button
                                onClick={() => handleDeleteUser(u.id, u.username)}
                                title="Delete User"
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-7 bg-white border border-[#E9D5FF] rounded-2xl shadow-xs overflow-hidden flex flex-col">
              {!selectedUserObj?.isAdmin && isCurrentUserAdmin && (
                <div className="p-4 bg-[#FAF5FF] border-b border-[#E9D5FF] flex items-center justify-end">
                  <button
                    onClick={saveUserSpecificPermissions}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3B0764] hover:bg-[#4C1D95] text-white text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Permissions
                  </button>
                </div>
              )}

              <div className="overflow-x-auto bg-white">
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
                  <tbody className="divide-y divide-[#F3E8FF] text-xs text-[#240046]">
                    {userPermDraft.map((perm, idx) => (
                      <tr key={perm.moduleKey} className="hover:bg-[#FAF5FF]">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-[#240046]">
                            {idx + 1}. {perm.moduleName}
                          </div>
                          <div className="text-[11px] text-[#6B21A8]">{perm.category}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={perm.overrideMode}
                            disabled={Boolean(selectedUserObj?.isAdmin) || !isCurrentUserAdmin}
                            onChange={(e) =>
                              handleUserPermChange(
                                perm.moduleKey,
                                'overrideMode',
                                e.target.value as 'inherit' | 'grant' | 'revoke'
                              )
                            }
                            className={`text-xs rounded-md border px-2 py-1 font-semibold ${
                              perm.overrideMode === 'grant'
                                ? 'border-[#D8B4FE] bg-[#F3E8FF] text-[#3B0764]'
                                : perm.overrideMode === 'revoke'
                                ? 'border-red-300 bg-red-50 text-red-800'
                                : 'border-[#E9D5FF] bg-white text-[#240046]'
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
                              disabled={
                                Boolean(selectedUserObj?.isAdmin) ||
                                perm.overrideMode === 'revoke' ||
                                !isCurrentUserAdmin
                              }
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
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: ROLES & ROLE PERMISSION MATRIX                               */}
        {/* =================================================================== */}
        {activeTab === 'roles' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-white border border-[#E9D5FF] rounded-2xl shadow-xs overflow-hidden">
                <div className="p-4 bg-[#FAF5FF] border-b border-[#E9D5FF]">
                  <h2 className="text-sm font-bold text-[#240046]">Roles List</h2>
                </div>
                <div className="divide-y divide-[#F3E8FF] bg-white">
                  {orderedRoles.map((r) => {
                    const activeCount = r.permissions.filter((p) => p.canView).length;
                    return (
                      <div
                        key={r.id}
                        onClick={() => handleSelectRole(r)}
                        className={`p-3.5 cursor-pointer transition-colors ${
                          r.id === selectedRoleId
                            ? 'bg-[#FAF5FF] border-l-4 border-l-[#9D174D]'
                            : 'hover:bg-[#FAF5FF]/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#240046]">{r.name}</span>
                          <span className="text-xs font-mono font-semibold text-[#9D174D] tabular-nums">
                            {activeCount}/16 forms
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {isCurrentUserAdmin && (
                <form
                  onSubmit={handleCreateRole}
                  className="bg-white border border-[#E9D5FF] rounded-2xl shadow-xs p-4 space-y-3"
                >
                  <h3 className="text-xs font-bold text-[#240046]">Add New Role</h3>
                  <div>
                    <label className="block text-xs font-semibold text-[#3B0764] mb-1">Role Name</label>
                    <input
                      type="text"
                      required
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="e.g., Shift Supervisor"
                      className="w-full px-3 py-2 text-xs border border-[#D8B4FE] rounded-lg bg-white text-[#240046] focus:outline-none focus:border-[#9D174D]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg bg-[#3B0764] hover:bg-[#4C1D95] text-white text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Create Role
                  </button>
                </form>
              )}
            </div>

            <div className="lg:col-span-8 bg-white border border-[#E9D5FF] rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 bg-[#FAF5FF] border-b border-[#E9D5FF] flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#240046]">
                  Role Permissions: {selectedRoleObj?.name}
                </h2>
                {isCurrentUserAdmin && (
                  <button
                    onClick={saveRolePermissions}
                    disabled={selectedRoleObj?.isAdmin}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3B0764] hover:bg-[#4C1D95] disabled:opacity-40 text-white text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Role Permissions
                  </button>
                )}
              </div>

              <div className="overflow-x-auto bg-white">
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
                  <tbody className="divide-y divide-[#F3E8FF] text-xs text-[#240046]">
                    {rolePermDraft.map((perm, idx) => (
                      <tr key={perm.moduleKey} className="hover:bg-[#FAF5FF]">
                        <td className="py-2.5 px-4 font-bold text-[#240046]">
                          {idx + 1}. {perm.moduleName}
                        </td>
                        <td className="py-2.5 px-3 text-[#6B21A8]">{perm.category}</td>
                        {(['canView', 'canCreate', 'canEdit', 'canDelete', 'canReport'] as const).map((field) => (
                          <td key={field} className="py-2.5 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={Boolean(perm[field])}
                              disabled={selectedRoleObj?.isAdmin || !isCurrentUserAdmin}
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
        {/* TAB 3: DATABASE ("production") EXPLORER WITH ADMIN ROW EDIT/DELETE  */}
        {/* =================================================================== */}
        {activeTab === 'database' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 bg-white border border-[#E9D5FF] rounded-2xl shadow-xs overflow-hidden flex flex-col max-h-[760px]">
              <div className="p-4 bg-[#FAF5FF] border-b border-[#E9D5FF] space-y-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-[#240046]">
                    Database: <code className="font-mono font-bold text-[#9D174D]">production</code>
                  </h2>
                  <span className="text-xs font-mono font-semibold text-[#6B21A8] tabular-nums">
                    {dbTables.length} Tables
                  </span>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#9333EA] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Filter tables..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#E9D5FF] rounded-lg bg-white text-[#240046] focus:outline-none focus:border-[#9D174D]"
                  />
                </div>
              </div>

              <div className="overflow-y-auto divide-y divide-[#F3E8FF] flex-1 bg-white">
                {filteredTables.map((t) => (
                  <button
                    key={t.tableName}
                    onClick={() => setSelectedTable(t.tableName)}
                    className={`w-full text-left p-3 transition-colors flex items-center justify-between cursor-pointer ${
                      selectedTable === t.tableName
                        ? 'bg-[#FAF5FF] border-l-4 border-l-[#9D174D]'
                        : 'hover:bg-[#FAF5FF]/60'
                    }`}
                  >
                    <div>
                      <div className="font-mono text-xs font-bold text-[#240046]">
                        {t.tableName}
                      </div>
                      <div className="text-[11px] text-[#6B21A8] mt-0.5">
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
              <div className="bg-white border border-[#E9D5FF] rounded-2xl shadow-xs overflow-hidden">
                <div className="p-4 bg-[#FAF5FF] border-b border-[#E9D5FF] flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <TableIcon className="w-4 h-4 text-[#9D174D]" />
                      <h3 className="font-mono text-sm font-bold text-[#240046]">
                        production.{selectedTable}
                      </h3>
                    </div>
                    <p className="text-[11px] text-[#6B21A8] mt-0.5">
                      Live table rows stored in production.db &amp; PostgreSQL production
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadTableRows(selectedTable)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E9D5FF] bg-white text-xs font-semibold text-[#240046] hover:bg-[#FAF5FF] cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-[#6B21A8] ${loadingTable ? 'animate-spin' : ''}`} />
                      Reload
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(schemaSql);
                        showToast('Copied SQL Schema to clipboard!');
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#3B0764] hover:bg-[#4C1D95] text-white text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy SQL Schema
                    </button>
                  </div>
                </div>

                <div className="px-4 py-2.5 bg-[#FAF5FF]/50 border-b border-[#E9D5FF] flex flex-wrap gap-1.5">
                  {tableData.columns.map((col: any) => (
                    <span
                      key={col.name}
                      className="font-mono text-[11px] text-[#240046] bg-white border border-[#E9D5FF] px-2 py-0.5 rounded"
                    >
                      <strong className="font-bold text-[#240046]">{col.name}</strong>:{' '}
                      <span className="text-[#6B21A8]">{col.type}</span>
                      {col.pk ? ' (PK)' : ''}
                    </span>
                  ))}
                </div>

                <div className="overflow-x-auto max-h-[520px] bg-white">
                  {tableData.rows.length === 0 ? (
                    <div className="p-8 text-center text-xs font-medium text-[#6B21A8]">
                      No rows in <code className="font-mono font-bold text-[#240046]">{selectedTable}</code> yet.
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
                          {isCurrentUserAdmin && (
                            <th className="py-2.5 px-3 whitespace-nowrap text-right sticky right-0 bg-[#3B0764] shadow-[-4px_0_8px_rgba(0,0,0,0.15)]">
                              actions (admin)
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F3E8FF] text-xs font-mono text-[#1E0538]">
                        {tableData.rows.map((row: any, idx: number) => {
                          const isPrimarySuperAdminUserRow =
                            selectedTable === 'users' && Number(row.id) === 1;
                          return (
                            <tr key={row.__rowid__ ?? idx} className="hover:bg-[#FAF5FF]">
                              {tableData.columns.map((c: any) => (
                                <td
                                  key={c.name}
                                  className="py-2.5 px-3 max-w-[240px] truncate text-[#1E0538]"
                                  title={String(row[c.name] ?? '')}
                                >
                                  {String(row[c.name] ?? '')}
                                </td>
                              ))}
                              {isCurrentUserAdmin && (
                                <td className="py-2 px-3 whitespace-nowrap text-right sticky right-0 bg-white/95 backdrop-blur-xs border-l border-[#F3E8FF]">
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      onClick={() => openEditDbRowModal(row)}
                                      title="Edit Row (Admin Only)"
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F3E8FF] hover:bg-[#E9D5FF] text-[#3B0764] font-sans text-[11px] font-bold cursor-pointer transition-colors"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteDbRow(row)}
                                      disabled={isPrimarySuperAdminUserRow}
                                      title={
                                        isPrimarySuperAdminUserRow
                                          ? 'Primary Super Admin cannot be deleted'
                                          : 'Delete Row (Admin Only)'
                                      }
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-700 disabled:opacity-35 disabled:cursor-not-allowed font-sans text-[11px] font-bold cursor-pointer transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* MODAL 1: CREATE / EDIT USER MODAL                                   */}
      {/* =================================================================== */}
      {showUserForm && (
        <div className="fixed inset-0 z-50 bg-[#1E0538]/55 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white border border-[#E9D5FF] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#240046]">
              {editingUser ? `Edit User: @${editingUser.username}` : 'Create New User Account'}
            </h3>
            <form onSubmit={handleSaveUserForm} className="space-y-3.5 text-xs text-[#240046]">
              <div>
                <label className="block font-semibold text-[#3B0764] mb-1">Username (Login ID)</label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingUser)}
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="e.g. carding_user"
                  className="w-full px-3 py-2 border border-[#D8B4FE] rounded-lg bg-white text-[#240046] font-medium disabled:bg-[#FAF5FF] focus:outline-none focus:border-[#9D174D]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#3B0764] mb-1">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="Enter password"
                  className="w-full px-3 py-2 border border-[#D8B4FE] rounded-lg bg-white text-[#240046] font-medium focus:outline-none focus:border-[#9D174D]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#3B0764] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={userForm.fullName}
                    onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                    placeholder="Operator Name"
                    className="w-full px-3 py-2 border border-[#D8B4FE] rounded-lg bg-white text-[#240046] font-medium focus:outline-none focus:border-[#9D174D]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#3B0764] mb-1">Employee Code</label>
                  <input
                    type="text"
                    value={userForm.employeeCode}
                    onChange={(e) => setUserForm({ ...userForm, employeeCode: e.target.value })}
                    placeholder="BJM-105"
                    className="w-full px-3 py-2 border border-[#D8B4FE] rounded-lg bg-white text-[#240046] font-medium focus:outline-none focus:border-[#9D174D]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#3B0764] mb-1">Assign Role</label>
                  <select
                    value={userForm.roleId}
                    onChange={(e) => setUserForm({ ...userForm, roleId: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#D8B4FE] rounded-lg bg-white text-[#240046] font-medium focus:outline-none focus:border-[#9D174D]"
                  >
                    {orderedRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#3B0764] mb-1">Department</label>
                  <input
                    type="text"
                    value={userForm.department}
                    onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D8B4FE] rounded-lg bg-white text-[#240046] font-medium focus:outline-none focus:border-[#9D174D]"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="userActiveChk"
                  checked={userForm.isActive}
                  onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
                  className="w-4 h-4 accent-[#9D174D] rounded"
                />
                <label htmlFor="userActiveChk" className="font-medium text-[#240046]">
                  Account Active (Allow Login)
                </label>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E9D5FF]">
                <button
                  type="button"
                  onClick={() => setShowUserForm(false)}
                  className="px-4 py-2 rounded-lg border border-[#D8B4FE] bg-white hover:bg-[#FAF5FF] text-[#3B0764] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#3B0764] hover:bg-[#4C1D95] text-white font-semibold cursor-pointer shadow-xs"
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: ADMIN-ONLY DATABASE ROW EDIT MODAL                         */}
      {/* =================================================================== */}
      {editingDbRow && isCurrentUserAdmin && (
        <div className="fixed inset-0 z-50 bg-[#1E0538]/55 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white border border-[#E9D5FF] rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 yajur-banner flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-mono">
                  Edit Row · production.{selectedTable}
                </h3>
                <p className="text-[11px] text-purple-100 mt-0.5">
                  Changes will update both SQLite (production.db) and PostgreSQL (production)
                </p>
              </div>
              <button
                onClick={() => setEditingDbRow(null)}
                className="p-1 rounded-lg bg-white/15 hover:bg-white/25 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDbRow} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {tableData.columns.map((col: any) => {
                  const isPrimaryKey = Boolean(col.pk && col.name === 'id');
                  const val = editingDbRowDraft[col.name] ?? '';
                  const isLongText =
                    col.name.includes('json') ||
                    col.name.includes('instruction') ||
                    col.name.includes('remark') ||
                    String(val).length > 80;

                  return (
                    <div
                      key={col.name}
                      className={isLongText ? 'md:col-span-2' : ''}
                    >
                      <label className="block text-xs font-mono font-bold text-[#3B0764] mb-1">
                        {col.name}{' '}
                        <span className="text-[10px] font-normal text-[#6B21A8]">
                          ({col.type}{col.pk ? ' · PK' : ''})
                        </span>
                      </label>
                      {isLongText ? (
                        <textarea
                          rows={2}
                          disabled={isPrimaryKey}
                          value={String(val)}
                          onChange={(e) =>
                            setEditingDbRowDraft({
                              ...editingDbRowDraft,
                              [col.name]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 text-xs font-mono border border-[#D8B4FE] rounded-lg bg-white text-[#1E0538] disabled:bg-[#FAF5FF] focus:outline-none focus:border-[#9D174D]"
                        />
                      ) : (
                        <input
                          type="text"
                          disabled={isPrimaryKey}
                          value={String(val)}
                          onChange={(e) =>
                            setEditingDbRowDraft({
                              ...editingDbRowDraft,
                              [col.name]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 text-xs font-mono border border-[#D8B4FE] rounded-lg bg-white text-[#1E0538] disabled:bg-[#FAF5FF] focus:outline-none focus:border-[#9D174D]"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E9D5FF]">
                <button
                  type="button"
                  onClick={() => setEditingDbRow(null)}
                  className="px-4 py-2 rounded-lg border border-[#D8B4FE] bg-white hover:bg-[#FAF5FF] text-xs font-semibold text-[#3B0764] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDbRow}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3B0764] hover:bg-[#4C1D95] text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingDbRow ? 'Saving...' : 'Save Row Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
