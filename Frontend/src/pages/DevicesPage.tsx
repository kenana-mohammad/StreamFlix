import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, AlertCircle, Trash2, Smartphone, Laptop, Monitor } from 'lucide-react';
import { useApp } from '@/store';
import { useProfile } from '@/lib/profileContext';
import { apiClient } from '@/lib/apiClient';

export default function DevicesPage() {
  const navigate = useNavigate();
  const { removeDevice, showToast } = useApp();
  const { profileToken } = useProfile();

  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!profileToken) {
      navigate('/profiles');
      return;
    }

    loadDevices();
  }, [profileToken]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apiClient.getMyDevices();
      const devicesData = Array.isArray(response) ? response : (response?.data || response);
      setDevices(devicesData || []);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load devices';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (deviceId: string) => {
    if (!window.confirm('Are you sure you want to remove this device? You may not be able to watch on it anymore.')) {
      return;
    }

    try {
      setDeletingId(deviceId);
      await removeDevice(deviceId);
      setDevices(devices.filter((d) => d._id !== deviceId));
    } finally {
      setDeletingId(null);
    }
  };

  const getDeviceIcon = (type: string) => {
    const iconProps = { size: 24, className: 'text-brand-400' };
    switch (type?.toLowerCase()) {
      case 'mobile':
        return <Smartphone {...iconProps} />;
      case 'tablet':
        return <Laptop {...iconProps} />;
      case 'desktop':
      case 'web':
      default:
        return <Monitor {...iconProps} />;
    }
  };

  const getDeviceName = (device: any) => {
    if (device.deviceName) return device.deviceName;
    if (device.userAgent?.includes('Windows')) return 'Windows PC';
    if (device.userAgent?.includes('Mac')) return 'Mac';
    if (device.userAgent?.includes('Linux')) return 'Linux';
    if (device.userAgent?.includes('iPhone')) return 'iPhone';
    if (device.userAgent?.includes('Android')) return 'Android';
    return device.deviceType || 'Unknown Device';
  };

  if (!profileToken) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <div className="text-center">
          <Loader size={40} className="text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading devices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950 px-4 sm:px-6 lg:px-12 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Your Devices</h1>
          <p className="text-gray-400">Manage and remove devices that can access your account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-error-500/10 border border-error-500/30 rounded-lg flex gap-3">
            <AlertCircle size={20} className="text-error-500 flex-shrink-0 mt-0.5" />
            <p className="text-error-400 text-sm">{error}</p>
          </div>
        )}

        {/* Devices List */}
        {devices.length > 0 ? (
          <div className="space-y-4 mb-8">
            {devices.map((device) => (
              <div key={device._id} className="bg-ink-850 border border-ink-600 rounded-lg p-6 flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {getDeviceIcon(device.deviceType)}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{getDeviceName(device)}</h3>
                    <div className="space-y-1 text-sm text-gray-400">
                      {device.ipAddress && (
                        <p>
                          <span className="text-gray-500">IP Address:</span> {device.ipAddress}
                        </p>
                      )}
                      {device.lastActivity && (
                        <p>
                          <span className="text-gray-500">Last Active:</span>{' '}
                          {new Date(device.lastActivity).toLocaleDateString()} at{' '}
                          {new Date(device.lastActivity).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                      {device.createdAt && (
                        <p>
                          <span className="text-gray-500">Added:</span> {new Date(device.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(device._id)}
                  disabled={deletingId === device._id}
                  className="px-4 py-2 rounded-lg border border-error-500 text-error-400 hover:bg-error-500/10 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  {deletingId === device._id ? 'Removing...' : 'Remove'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-ink-850 border border-ink-600 rounded-lg p-12 text-center">
            <AlertCircle size={40} className="text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No devices found</p>
            <p className="text-gray-500 text-sm mt-2">Start watching to register your devices</p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-blue-400 text-sm">
            <strong>Note:</strong> You can have up to 4 devices streaming simultaneously depending on your subscription plan.
            Remove devices you no longer use to free up slots.
          </p>
        </div>
      </div>
    </div>
  );
}
