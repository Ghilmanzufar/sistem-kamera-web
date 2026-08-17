import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import UserFilterCard from '../components/users/UserFilterCard';
import UserTable from '../components/users/UserTable';
import UserFormModal from '../components/users/UserFormModal';
import UserDeleteModal from '../components/users/UserDeleteModal';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Form State
  const [username, setUsername] = useState('');
  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('pengawas');
  const [fullname, setFullname] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Delete User State with Admin Password Verification
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await api.get('/api/admin/users');
      setUsers(res.data || []);
    } catch {
      if (!isSilent) toast.error('Gagal mengambil data user');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(false);
    const interval = setInterval(() => {
      fetchUsers(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setUsername('');
    setNik('');
    setPassword('');
    setRole('pengawas');
    setFullname('');
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setUsername(u.username);
    setNik(u.nik || '');
    setPassword(''); // Kosongkan jika tidak ingin ganti password
    setRole(u.role);
    setFullname(u.fullname || '');
    setIsActive(u.is_active ?? true);
    setShowModal(true);
  };

  const openDeleteModal = (u) => {
    setDeleteUserTarget(u);
    setAdminPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      username,
      nik: nik.trim() || null,
      role,
      fullname,
      is_active: isActive,
    };
    if (password) {
      payload.password = password;
    }

    try {
      if (editingUser) {
        await api.put(`/api/admin/users/${editingUser.id}`, payload);
        toast.success(`User ${username} berhasil diperbarui!`);
      } else {
        if (!password) return toast.error('PIN / Password wajib diisi untuk user baru!');
        await api.post('/api/admin/users', payload);
        toast.success(`User ${username} berhasil dibuat!`);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menyimpan data user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (e) => {
    if (e) e.preventDefault();
    if (!deleteUserTarget) return;
    if (!adminPassword || !adminPassword.trim()) {
      return toast.error('Silakan masukkan password admin untuk validasi!');
    }

    setDeleting(true);
    try {
      await api.delete(`/api/admin/users/${deleteUserTarget.id}`, {
        data: { admin_password: adminPassword },
      });
      toast.success(`User ${deleteUserTarget.username} berhasil dihapus.`);
      setDeleteUserTarget(null);
      setAdminPassword('');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menghapus user. Periksa kembali password admin Anda.');
    } finally {
      setDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q || (u.username || '').toLowerCase().includes(q) || (u.fullname || '').toLowerCase().includes(q) || (u.nik || '').toLowerCase().includes(q);
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? u.is_active : !u.is_active);
    return matchQuery && matchRole && matchStatus;
  });

  const headers = ["# ID", "NIK", "Username", "Nama Lengkap", "Role", "Status", "Aksi"];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen"
        highlightTitle="User & PIN"
        subtitle="Kelola akun pengguna, NIK, dan hak akses sistem inspeksi"
        actionButton={
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah User Baru
          </button>
        }
      />

      {/* Filter Toolbar Card */}
      <UserFilterCard
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        totalCount={users.length}
        filteredCount={filteredUsers.length}
        onResetFilters={handleResetFilters}
      />

      {/* User Table */}
      <UserTable
        headers={headers}
        loading={loading}
        users={filteredUsers}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
      />

      {/* User Create/Edit Modal */}
      <UserFormModal
        show={showModal}
        editingUser={editingUser}
        username={username}
        setUsername={setUsername}
        nik={nik}
        setNik={setNik}
        password={password}
        setPassword={setPassword}
        role={role}
        setRole={setRole}
        fullname={fullname}
        setFullname={setFullname}
        isActive={isActive}
        setIsActive={setIsActive}
        submitting={submitting}
        onSubmit={handleSubmit}
        onClose={() => setShowModal(false)}
      />

      {/* SECURE ADMIN PASSWORD CONFIRMATION MODAL FOR DELETING USER */}
      <UserDeleteModal
        targetUser={deleteUserTarget}
        adminPassword={adminPassword}
        setAdminPassword={setAdminPassword}
        deleting={deleting}
        onDelete={handleDeleteUser}
        onClose={() => { setDeleteUserTarget(null); setAdminPassword(''); }}
      />
    </div>
  );
}
