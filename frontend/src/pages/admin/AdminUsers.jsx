import { useState } from 'react';
import {
  Search,
  X,
  ShieldAlert,
  ShieldCheck,
  Crown,
  User,
  Phone,
  Calendar,
  Users,
  Sparkles,
} from 'lucide-react';
import { TableSkeleton, EmptyState } from '../../components/common/StateViews';
import './AdminUsers.css';

const AdminUsers = ({ usersList = [], loading = false, onToggleUserRole }) => {
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const adminCount = usersList.filter(u => u.role === 'ADMIN').length;
  const userCount  = usersList.filter(u => u.role !== 'ADMIN').length;

  const filtered = usersList.filter(u => {
    const name  = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    const q     = search.trim().toLowerCase();
    const matchSearch = !q || email.includes(q) || name.includes(q);
    const matchRole   = !roleFilter
      || (roleFilter === 'ADMIN' ? u.role === 'ADMIN' : u.role !== 'ADMIN');
    return matchSearch && matchRole;
  });

  return (
    <div className="admin-tab-content animate-fade-in">
      {/* ── Hero Banner (Matching AdminStats) ── */}
      <div className="admin-hero-banner">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-extrabold uppercase tracking-wider rounded-full border border-amber-500/30 mb-2.5">
            <Sparkles size={13} /> Phân quyền & Quản trị tài khoản
          </div>
          <h1 className="admin-hero-title">
            Quản Lý Thành Viên
          </h1>
          <p className="admin-hero-subtitle">
            Danh sách tài khoản đăng ký và thiết lập quyền hạn quản trị cho nhân viên hệ thống Túc Tắc.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="admin-filter-bar" role="group" aria-label="Lọc vai trò">
            <button
              type="button"
              onClick={() => setRoleFilter('')}
              className={`admin-filter-btn ${roleFilter === '' ? 'active' : ''}`}
            >
              Tất cả ({usersList.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('ADMIN')}
              className={`admin-filter-btn ${roleFilter === 'ADMIN' ? 'active' : ''}`}
            >
              <Crown size={13} /> Quản trị viên ({adminCount})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('USER')}
              className={`admin-filter-btn ${roleFilter === 'USER' ? 'active' : ''}`}
            >
              <User size={13} /> Khách hàng ({userCount})
            </button>
          </div>
        </div>
      </div>

      {/* ── 3 KPI Stat Cards Grid ── */}
      <div className="admin-cards-grid-3">
        {/* Card 1: Tổng số thành viên */}
        <div className="stat-tile accent-taro flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Tổng số thành viên</p>
            <div className="icon-tile ml-2">
              <Users size={18} />
            </div>
          </div>
          <div>
            <h3 className="stat-tile-value">{usersList.length}</h3>
            <div className="stats-card-caption">
              Tài khoản đã đăng ký trên hệ thống
            </div>
          </div>
        </div>

        {/* Card 2: Quản trị viên */}
        <div className="stat-tile accent-caramel flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Quản trị viên (Admin)</p>
            <div className="icon-tile ml-2">
              <Crown size={18} />
            </div>
          </div>
          <div>
            <h3 className="stat-tile-value">{adminCount}</h3>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-semibold text-stone-700">Quyền truy cập toàn phần</span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Admin
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Khách hàng */}
        <div className="stat-tile accent-matcha flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Khách hàng (User)</p>
            <div className="icon-tile ml-2">
              <User size={18} />
            </div>
          </div>
          <div>
            <h3 className="stat-tile-value">{userCount}</h3>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-semibold text-stone-700">Đặt hàng qua App / Web</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Thành viên
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Utility Filter Bar ── */}
      <div className="admin-utility-bar">
        {/* Role Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 mr-1">Vai trò:</span>
          <button
            type="button"
            onClick={() => setRoleFilter('')}
            className={`filter-pill ${roleFilter === '' ? 'active' : ''}`}
          >
            Tất cả ({usersList.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('ADMIN')}
            className={`filter-pill ${roleFilter === 'ADMIN' ? 'active' : ''}`}
          >
            <Crown size={13} className="inline mr-1" /> Quản trị viên ({adminCount})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('USER')}
            className={`filter-pill ${roleFilter === 'USER' ? 'active' : ''}`}
          >
            <User size={13} className="inline mr-1" /> Khách hàng ({userCount})
          </button>
        </div>

        {/* Search */}
        <div className="admin-search-input-group">
          <Search size={15} className="text-stone-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Tìm theo email hoặc họ tên…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Bento Panel Table (Matching AdminStats) ── */}
      <div className="stats-bento-panel">
        <div className="stats-panel-header">
          <div>
            <h3 className="stats-panel-title">
              <Users size={18} className="text-purple-700" />
              Danh Sách Thành Viên Hệ Thống
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Hiển thị {filtered.length} tài khoản phù hợp với điều kiện tìm kiếm.
            </p>
          </div>
        </div>

        <div className="stats-table-wrapper">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', paddingLeft: '1.25rem' }}>ID</th>
                <th style={{ textAlign: 'left' }}>Tài khoản</th>
                <th style={{ textAlign: 'left' }}>Họ và tên</th>
                <th>Số điện thoại</th>
                <th>Ngày đăng ký</th>
                <th>Vai trò</th>
                <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}>Phân quyền</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={5} cols={7} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <EmptyState
                      title="Không tìm thấy thành viên nào"
                      description="Thay đổi bộ lọc hoặc từ khóa để tìm đúng tài khoản cần quản lý."
                      actionText="Xóa bộ lọc"
                      onAction={() => { setSearch(''); setRoleFilter(''); }}
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const isAdmin = u.role === 'ADMIN';
                  const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || '—';
                  const initial  = (u.firstName || u.email || 'U').charAt(0).toUpperCase();

                  return (
                    <tr key={u.id}>
                      {/* ID */}
                      <td style={{ textAlign: 'left', paddingLeft: '1.25rem' }}>
                        <span className="font-mono text-xs font-bold text-stone-400">#{u.id}</span>
                      </td>

                      {/* Avatar + Email */}
                      <td style={{ textAlign: 'left' }}>
                        <div className="flex items-center gap-3">
                          <div className={`user-avatar-badge ${isAdmin ? 'admin' : 'user'}`}>
                            {initial}
                          </div>
                          <div>
                            <p className="font-extrabold text-xs text-stone-900">{u.email}</p>
                            <span className="text-[10px] text-stone-400">Thành viên Túc Tắc</span>
                          </div>
                        </div>
                      </td>

                      {/* Họ tên */}
                      <td style={{ textAlign: 'left' }}>
                        <span className="text-xs font-semibold text-stone-800">{fullName}</span>
                      </td>

                      {/* Điện thoại */}
                      <td>
                        {u.phone ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-stone-700 font-medium">
                            <Phone size={12} className="text-stone-400" />{u.phone}
                          </span>
                        ) : (
                          <span className="text-stone-300 font-mono text-xs">—</span>
                        )}
                      </td>

                      {/* Ngày đăng ký */}
                      <td>
                        <span className="inline-flex items-center gap-1.5 text-xs text-stone-500">
                          <Calendar size={12} className="text-stone-400" />
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}
                        </span>
                      </td>

                      {/* Vai trò */}
                      <td>
                        <span className={`role-pill ${isAdmin ? 'admin' : 'user'}`}>
                          {isAdmin ? <Crown size={12} /> : <User size={12} />}
                          {isAdmin ? 'Admin' : 'User'}
                        </span>
                      </td>

                      {/* Nút phân quyền */}
                      <td style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                        <button
                          type="button"
                          onClick={() => onToggleUserRole(u)}
                          className={`role-action-btn ${isAdmin ? 'demote' : 'promote'}`}
                        >
                          {isAdmin ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                          {isAdmin ? 'Hạ quyền User' : 'Nâng quyền Admin'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
