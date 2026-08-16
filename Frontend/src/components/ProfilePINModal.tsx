import { useState } from 'react';
import { X } from 'lucide-react';

interface ProfilePINModalProps {
  profileName: string;
  onSubmit: (pin: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string;
}

export default function ProfilePINModal({
  profileName,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
}: ProfilePINModalProps) {
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 0) return;
    setSubmitting(true);
    try {
      await onSubmit(pin);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-ink-850 rounded-2xl p-6 border border-ink-600 shadow-2xl animate-scaleIn"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Enter PIN</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          Profile "{profileName}" is protected. Enter your PIN to continue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN"
            className="input-field w-full text-center text-2xl tracking-widest"
            autoFocus
            disabled={submitting}
          />

          {error && (
            <div className="text-error-500 text-sm bg-error-500/10 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || pin.length === 0}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Verifying...' : 'Unlock Profile'}
          </button>
        </form>

        <button
          onClick={onCancel}
          disabled={submitting}
          className="w-full mt-2 px-4 py-2 text-gray-400 hover:text-white rounded-md font-medium transition-colors disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
