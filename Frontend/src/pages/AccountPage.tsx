import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, AlertCircle, Save } from 'lucide-react';
import { useApp } from '@/store';
import { useProfile } from '@/lib/profileContext';
import { apiClient } from '@/lib/apiClient';

export default function AccountPage() {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const { profileToken } = useProfile();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);

  // Edit Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!profileToken) {
      navigate('/profiles');
      return;
    }

    loadUserData();
  }, [profileToken]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getCurrentUser();
      setUser(response.data);
      setName(response.data?.name || '');
      setPhone(response.data?.phone || '');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load user data';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      showToast('Name is required', 'error');
      return;
    }

    try {
      setSavingProfile(true);
      await apiClient.updateUser({ name, phone });
      setUser({ ...user, name, phone });
      setEditMode(false);
      showToast('Profile updated successfully', 'success');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update profile';
      showToast(msg, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (oldPassword === newPassword) {
      setPasswordError('New password must be different from old password');
      return;
    }

    try {
      setChangingPassword(true);
      await apiClient.changePassword(oldPassword, newPassword);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      showToast('Password changed successfully', 'success');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to change password';
      setPasswordError(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  if (!profileToken) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <div className="text-center">
          <Loader size={40} className="text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950 px-4 sm:px-6 lg:px-12 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Account Settings</h1>
          <p className="text-gray-400">Manage your account information and preferences</p>
        </div>

        {/* Profile Section */}
        <div className="bg-ink-850 border border-ink-600 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6">Profile Information</h2>

          {editMode ? (
            // Edit Form
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-ink-800 border border-ink-600 text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-ink-800 border border-ink-600 text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="btn-ghost flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // Display Form
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Full Name</label>
                <p className="text-white text-lg">{name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Email</label>
                <p className="text-white text-lg">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Phone</label>
                <p className="text-white text-lg">{phone || 'Not provided'}</p>
              </div>

              <button onClick={() => setEditMode(true)} className="btn-primary mt-4">
                Edit Profile
              </button>
            </div>
          )}
        </div>

        {/* Password Section */}
        <div className="bg-ink-850 border border-ink-600 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6">Security</h2>

          {showPasswordForm ? (
            // Password Change Form
            <div className="space-y-4">
              {passwordError && (
                <div className="p-4 bg-error-500/10 border border-error-500/30 rounded-lg flex gap-3">
                  <AlertCircle size={20} className="text-error-500 flex-shrink-0 mt-0.5" />
                  <p className="text-error-400 text-sm">{passwordError}</p>
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-2">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-4 py-2 rounded-lg bg-ink-800 border border-ink-600 text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  className="w-full px-4 py-2 rounded-lg bg-ink-800 border border-ink-600 text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2 rounded-lg bg-ink-800 border border-ink-600 text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="btn-primary flex-1"
                >
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordError('');
                  }}
                  className="btn-ghost flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowPasswordForm(true)} className="btn-primary">
              Change Password
            </button>
          )}
        </div>

        {/* Account Info */}
        <div className="bg-ink-850 border border-ink-600 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Account Information</h2>
          <div className="space-y-4 text-gray-300">
            <div className="flex justify-between">
              <span>Account Status</span>
              <span className="text-green-400 font-semibold">Active</span>
            </div>
            <div className="flex justify-between">
              <span>Member Since</span>
              <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Role</span>
              <span className="capitalize">{user?.role || 'user'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
