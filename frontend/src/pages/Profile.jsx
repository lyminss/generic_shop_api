import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService, addressService } from '../services/api';
import Orders from './Orders';
import { User, MapPin, Lock, CheckCircle, AlertCircle, Plus, Edit2, Trash2, Star, ClipboardList } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'info';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  
  // Address state
  const [addresses, setAddresses] = useState([]);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    recipientName: '',
    phone: '',
    fullAddress: '',
    default: false
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      });
    }
    fetchAddresses();
  }, [user]);

  // Sync state tab with query parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['info', 'address', 'password', 'orders'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setSearchParams({ tab: tabName });
  };

  const fetchAddresses = async () => {
    try {
      const res = await addressService.getMyAddresses();
      setAddresses(res.data);
    } catch (err) {
      console.error("Failed to fetch addresses");
    }
  };

  const showStatus = (type, message) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: '', message: '' }), 3000);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.updateProfile(profileData);
      await refreshUser();
      showStatus('success', 'Cập nhật thông tin cá nhân thành công!');
    } catch (err) {
      showStatus('error', err.response?.data?.message || 'Cập nhật thông tin thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const openAddressForm = (address = null) => {
    if (address) {
      setEditingAddressId(address.id);
      setAddressForm({
        recipientName: address.recipientName || '',
        phone: address.phone || '',
        fullAddress: address.fullAddress || '',
        default: address.default || false
      });
    } else {
      setEditingAddressId(null);
      setAddressForm({
        recipientName: '',
        phone: '',
        fullAddress: '',
        default: addresses.length === 0
      });
    }
    setIsAddressFormOpen(true);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingAddressId) {
        await addressService.updateAddress(editingAddressId, addressForm);
        showStatus('success', 'Cập nhật địa chỉ thành công!');
      } else {
        await addressService.addAddress(addressForm);
        showStatus('success', 'Thêm địa chỉ giao hàng thành công!');
      }
      setIsAddressFormOpen(false);
      fetchAddresses();
    } catch (err) {
      showStatus('error', err.response?.data?.message || 'Lưu địa chỉ thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này không?')) return;
    try {
      await addressService.deleteAddress(id);
      fetchAddresses();
      showStatus('success', 'Đã xóa địa chỉ');
    } catch (err) {
      showStatus('error', 'Xóa địa chỉ thất bại');
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      await addressService.setDefaultAddress(id);
      fetchAddresses();
      showStatus('success', 'Đã đặt làm địa chỉ mặc định');
    } catch (err) {
      showStatus('error', 'Đặt địa chỉ mặc định thất bại');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showStatus('error', 'Mật khẩu mới không trùng khớp.');
      return;
    }
    setLoading(true);
    try {
      await authService.changePassword(passwordData);
      showStatus('success', 'Đổi mật khẩu thành công!');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showStatus('error', err.response?.data || 'Đổi mật khẩu thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container animate-fade-in">
      <div className="profile-header glass-panel">
        <div className="profile-avatar">
          {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="profile-info">
          <h1>{user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email}</h1>
          <p className="profile-email">{user?.email}</p>
          <span className={`role-badge ${user?.role === 'ADMIN' ? 'role-admin' : 'role-user'}`}>
            {user?.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}
          </span>
        </div>
      </div>

      {status.message && (
        <div className={`status-alert ${status.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {status.message}
        </div>
      )}

      <div className="profile-layout">
        <div className="profile-tabs glass-panel">
          <button
            className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => handleTabChange('info')}
          >
            <User size={18} /> Thông tin cá nhân
          </button>
          <button
            className={`tab-btn ${activeTab === 'address' ? 'active' : ''}`}
            onClick={() => handleTabChange('address')}
          >
            <MapPin size={18} /> Địa chỉ giao hàng
          </button>
          <button
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => handleTabChange('orders')}
          >
            <ClipboardList size={18} /> Đơn hàng của tôi
          </button>
          <button
            className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => handleTabChange('password')}
          >
            <Lock size={18} /> Đổi mật khẩu
          </button>
        </div>

        <div className="profile-content glass-panel">
          {activeTab === 'info' && (
            <div className="tab-content">
              <h2 className="tab-title">Thông tin cá nhân</h2>
              <form onSubmit={handleProfileSave} className="profile-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Họ</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Nguyễn"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Tên</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="An"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    className="input-field"
                    value={user?.email || ''}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="09XXXXXXXX"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn-primary save-btn" disabled={loading}>
                  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'address' && (
            <div className="tab-content">
              <div className="address-header">
                <h2 className="tab-title">Địa chỉ giao hàng</h2>
                {!isAddressFormOpen && (
                  <button className="btn-secondary add-address-btn" onClick={() => openAddressForm()}>
                    <Plus size={16} /> Thêm địa chỉ mới
                  </button>
                )}
              </div>

              {isAddressFormOpen ? (
                <div className="address-form-container glass-panel">
                  <h3>{editingAddressId ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ giao nhận'}</h3>
                  <form onSubmit={handleAddressSubmit} className="profile-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Tên người nhận</label>
                        <input
                          type="text"
                          className="input-field"
                          required
                          value={addressForm.recipientName}
                          onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Số điện thoại nhận hàng</label>
                        <input
                          type="tel"
                          className="input-field"
                          required
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Địa chỉ chi tiết (Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/TP)</label>
                      <textarea
                        className="input-field address-textarea"
                        required
                        rows={3}
                        value={addressForm.fullAddress}
                        onChange={(e) => setAddressForm({ ...addressForm, fullAddress: e.target.value })}
                      />
                    </div>
                    <div className="form-group checkbox-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={addressForm.default}
                          onChange={(e) => setAddressForm({ ...addressForm, default: e.target.checked })}
                        />
                        Đặt làm địa chỉ mặc định
                      </label>
                    </div>
                    <div className="form-actions">
                      <button type="button" className="btn-secondary" onClick={() => setIsAddressFormOpen(false)}>
                        Hủy bỏ
                      </button>
                      <button type="submit" className="btn-primary save-btn" disabled={loading}>
                        {loading ? 'Đang lưu...' : 'Lưu địa chỉ'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="address-list">
                  {addresses.length === 0 ? (
                    <div className="address-empty">
                      <MapPin size={32} />
                      <p>Bạn chưa lưu địa chỉ giao nhận nào.</p>
                    </div>
                  ) : (
                    addresses.map(addr => (
                      <div key={addr.id} className={`address-card glass-panel ${addr.default ? 'is-default' : ''}`}>
                        <div className="address-card-header">
                          <span className="address-name">{addr.recipientName}</span>
                          {addr.default && <span className="default-badge"><Star size={12} /> Mặc định</span>}
                        </div>
                        <div className="address-card-body">
                          <p>{addr.phone}</p>
                          <p>{addr.fullAddress}</p>
                        </div>
                        <div className="address-card-actions">
                          {!addr.default && (
                            <button className="action-btn text-primary" onClick={() => handleSetDefaultAddress(addr.id)}>
                              Đặt làm mặc định
                            </button>
                          )}
                          <div className="action-group">
                            <button className="action-btn" onClick={() => openAddressForm(addr)}>
                              <Edit2 size={16} /> Sửa
                            </button>
                            <button className="action-btn text-danger" onClick={() => handleDeleteAddress(addr.id)}>
                              <Trash2 size={16} /> Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="tab-content">
              <Orders />
            </div>
          )}

          {activeTab === 'password' && (
            <div className="tab-content">
              <h2 className="tab-title">Đổi mật khẩu</h2>
              <form onSubmit={handlePasswordSubmit} className="profile-form">
                <div className="form-group">
                  <label>Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Mật khẩu mới</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Tối thiểu 6 ký tự"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <div className="form-group">
                  <label>Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <button type="submit" className="btn-primary save-btn" disabled={loading}>
                  {loading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
