import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService, addressService } from '../services/api';
import { User, MapPin, Lock, CheckCircle, AlertCircle, Plus, Edit2, Trash2, Star } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
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
      showStatus('success', 'Profile updated successfully!');
    } catch (err) {
      showStatus('error', err.response?.data?.message || 'Failed to update profile.');
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
        showStatus('success', 'Address updated successfully!');
      } else {
        await addressService.addAddress(addressForm);
        showStatus('success', 'Address added successfully!');
      }
      setIsAddressFormOpen(false);
      fetchAddresses();
    } catch (err) {
      showStatus('error', err.response?.data?.message || 'Failed to save address.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await addressService.deleteAddress(id);
      fetchAddresses();
      showStatus('success', 'Address deleted');
    } catch (err) {
      showStatus('error', 'Failed to delete address');
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      await addressService.setDefaultAddress(id);
      fetchAddresses();
      showStatus('success', 'Default address updated');
    } catch (err) {
      showStatus('error', 'Failed to update default address');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showStatus('error', 'New passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await authService.changePassword(passwordData);
      showStatus('success', 'Password changed successfully!');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showStatus('error', err.response?.data || 'Failed to change password.');
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
            {user?.role}
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
            onClick={() => setActiveTab('info')}
          >
            <User size={18} /> Personal Info
          </button>
          <button
            className={`tab-btn ${activeTab === 'address' ? 'active' : ''}`}
            onClick={() => setActiveTab('address')}
          >
            <MapPin size={18} /> Shipping Addresses
          </button>
          <button
            className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <Lock size={18} /> Change Password
          </button>
        </div>

        <div className="profile-content glass-panel">
          {activeTab === 'info' && (
            <div className="tab-content">
              <h2 className="tab-title">Personal Information</h2>
              <form onSubmit={handleProfileSave} className="profile-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="John"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Doe"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
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
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="+1 234 567 890"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn-primary save-btn" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'address' && (
            <div className="tab-content">
              <div className="address-header">
                <h2 className="tab-title">Shipping Addresses</h2>
                {!isAddressFormOpen && (
                  <button className="btn-secondary add-address-btn" onClick={() => openAddressForm()}>
                    <Plus size={16} /> Add New Address
                  </button>
                )}
              </div>

              {isAddressFormOpen ? (
                <div className="address-form-container glass-panel">
                  <h3>{editingAddressId ? 'Edit Address' : 'Add New Address'}</h3>
                  <form onSubmit={handleAddressSubmit} className="profile-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Recipient Name</label>
                        <input
                          type="text"
                          className="input-field"
                          required
                          value={addressForm.recipientName}
                          onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Phone Number</label>
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
                      <label>Full Address</label>
                      <textarea
                        className="input-field address-textarea"
                        required
                        rows={3}
                        value={addressForm.fullAddress}
                        onChange={(e) => setAddressForm({ ...addressForm, fullAddress: e.target.value })}
                      />
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={addressForm.default}
                          onChange={(e) => setAddressForm({ ...addressForm, default: e.target.checked })}
                        />
                        Set as default address
                      </label>
                    </div>
                    <div className="form-actions">
                      <button type="button" className="btn-secondary" onClick={() => setIsAddressFormOpen(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary save-btn" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Address'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="address-list">
                  {addresses.length === 0 ? (
                    <div className="address-empty">
                      <MapPin size={32} />
                      <p>You have not saved any addresses yet.</p>
                    </div>
                  ) : (
                    addresses.map(addr => (
                      <div key={addr.id} className={`address-card glass-panel ${addr.default ? 'is-default' : ''}`}>
                        <div className="address-card-header">
                          <span className="address-name">{addr.recipientName}</span>
                          {addr.default && <span className="default-badge"><Star size={12} /> Default</span>}
                        </div>
                        <div className="address-card-body">
                          <p>{addr.phone}</p>
                          <p>{addr.fullAddress}</p>
                        </div>
                        <div className="address-card-actions">
                          {!addr.default && (
                            <button className="action-btn text-primary" onClick={() => handleSetDefaultAddress(addr.id)}>
                              Set as Default
                            </button>
                          )}
                          <div className="action-group">
                            <button className="action-btn" onClick={() => openAddressForm(addr)}>
                              <Edit2 size={16} /> Edit
                            </button>
                            <button className="action-btn text-danger" onClick={() => handleDeleteAddress(addr.id)}>
                              <Trash2 size={16} /> Delete
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

          {activeTab === 'password' && (
            <div className="tab-content">
              <h2 className="tab-title">Change Password</h2>
              <form onSubmit={handlePasswordSubmit} className="profile-form">
                <div className="form-group">
                  <label>Current Password</label>
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
                  <label>New Password</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
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
                  {loading ? 'Updating...' : 'Update Password'}
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
