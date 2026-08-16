import { CheckCircle, XCircle, Info } from 'lucide-react';
import { useApp } from '@/store';

export default function Toast() {
  const { toast } = useApp();
  if (!toast) return null;

  const icon = toast.type === 'success' ? <CheckCircle size={20} /> : toast.type === 'error' ? <XCircle size={20} /> : <Info size={20} />;
  const color = toast.type === 'success' ? 'text-success-500' : toast.type === 'error' ? 'text-error-500' : 'text-gold-500';

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-slideUp">
      <div className="glass rounded-lg border border-ink-600 px-5 py-3 shadow-2xl flex items-center gap-3">
        <span className={color}>{icon}</span>
        <span className="text-sm font-medium text-white">{toast.message}</span>
      </div>
    </div>
  );
}
