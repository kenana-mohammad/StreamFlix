import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, X, Lock, ShieldCheck, Pencil, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/lib/useToast';
import { useProfile } from '@/lib/profileContext';
import { apiClient } from '@/lib/apiClient';
import { getInitials } from '@/lib/utils';
import ProfilePINModal from '@/components/ProfilePINModal';
import { useNavigate } from 'react-router-dom';

const AVATAR_COLORS = [
  '#ff3b2f', '#3b82f6', '#22c55e', '#f59e0b',
  '#ec4899', '#8b5cf6', '#06b6d4', '#f97316',
];

const LS_KEY = 'sf_pinned_profiles';

function loadPinnedFromStorage(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
}

function savePinnedToStorage(ids: Set<string>) {
  localStorage.setItem(LS_KEY, JSON.stringify([...ids]));
}

function PinInput({
  value, onChange, placeholder = '······', autoFocus = false,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder={placeholder}
        maxLength={6}
        autoFocus={autoFocus}
        className="w-full px-4 py-2.5 pr-10 rounded-lg bg-ink-800 border border-ink-600 text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none tracking-widest text-center text-lg"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export default function ProfilesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { setProfileToken, setCurrentProfile } = useProfile();

  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [managing, setManaging] = useState(false);
  const [busy, setBusy] = useState(false);

  // Cache the primary profile token so we only fetch it once per session
  const primaryTokenRef = useRef<string | null>(null);

  // PIN status — start empty every session, populate only from confirmed backend responses
  const [pinnedIds, setPinnedIdsState] = useState<Set<string>>(new Set());

  const setPinnedIds = useCallback((updater: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    setPinnedIdsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return next;
    });
  }, []);

  // Selection PIN modal
  const [selectPinProfile, setSelectPinProfile] = useState<any>(null);
  const [selectPinError, setSelectPinError] = useState('');

  // Add profile modal
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIsKids, setNewIsKids] = useState(false);
  const [newColor, setNewColor] = useState(AVATAR_COLORS[0]);
  const [addingProfile, setAddingProfile] = useState(false);

  // Edit profile modal
  const [editProfile, setEditProfile] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editIsKids, setEditIsKids] = useState(false);
  const [editColor, setEditColor] = useState(AVATAR_COLORS[0]);
  const [savingEdit, setSavingEdit] = useState(false);

  // PIN management: 'none' | 'add' | 'change' | 'delete'
  const [pinMode, setPinMode] = useState<'none' | 'add' | 'change' | 'delete'>('none');
  const [pinOld, setPinOld] = useState('');
  const [pinNew, setPinNew] = useState('');
  const [pinError, setPinError] = useState('');
  const [savingPin, setSavingPin] = useState(false);

  // ── Load profiles ──────────────────────────────────────────────────────

  useEffect(() => { loadProfiles(); }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getProfiles();
      const data: any[] = Array.isArray(res) ? res : (res?.data || []);
      setProfiles(data);
      // Seed pinnedIds from the backend's isPinProtected virtual field
      const pinned = new Set<string>(
        data.filter((p: any) => p.isPinProtected).map((p: any) => p._id)
      );
      setPinnedIds(pinned);
      // Invalidate cached primary token — always re-fetch for the current account
      primaryTokenRef.current = null;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  /** Gets a primary-profile token for management API calls.
   *  Caches the token in a ref — only fetches once per session.
   *  If the primary profile has a PIN, throws PRIMARY_PIN_REQUIRED so
   *  the caller can prompt the user once, then cache the result.
   */
  const ensurePrimaryToken = async (): Promise<string> => {
    // Already have it cached this session — reuse it
    if (primaryTokenRef.current) {
      apiClient.setProfileToken(primaryTokenRef.current);
      return primaryTokenRef.current;
    }

    const primary = profiles.find((p) => p.primaryProfile);
    if (!primary) throw new Error('No primary profile found');

    try {
      const res = await apiClient.selectProfile(primary._id);
      const d = res.data || res;
      const token = d.token || d.profileToken;
      if (!token) throw new Error('Could not get primary profile token');
      primaryTokenRef.current = token;
      apiClient.setProfileToken(token);
      // Primary has no PIN — remove from pinnedIds if it was there
      setPinnedIds((prev) => { const n = new Set(prev); n.delete(primary._id); return n; });
      return token;
    } catch (err: any) {
      const status: number = err?.response?.status;
      const msg: string = (err?.response?.data?.message || '').toLowerCase();
      // Only treat as PIN-required if the message explicitly mentions PIN
      if (status === 400 && msg.includes('pin')) {
        setPinnedIds((prev) => new Set([...prev, primary._id]));
        throw new Error('PRIMARY_PIN_REQUIRED');
      }
      throw err;
    }
  };

  // State for primary-PIN prompt during management operations
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);
  const [primaryPinError, setPrimaryPinError] = useState('');

  const runWithPrimaryToken = async (action: () => Promise<void>) => {
    try {
      await ensurePrimaryToken();
      await action();
    } catch (err: any) {
      if (err?.message === 'PRIMARY_PIN_REQUIRED') {
        setPendingAction(() => action);
        setPrimaryPinError('');
        const primary = profiles.find((p) => p.primaryProfile);
        setSelectPinProfile({ ...primary, _pendingManagement: true });
        setSelectPinError('');
      } else {
        throw err;
      }
    }
  };

  const handlePrimaryPinForManagement = async (pin: string) => {
    const primary = profiles.find((p) => p.primaryProfile);
    if (!primary) return;
    try {
      setBusy(true);
      setPrimaryPinError('');
      const res = await apiClient.selectProfile(primary._id, pin);
      const d = res.data || res;
      const token = d.token || d.profileToken;
      if (!token) throw new Error('No token received');
      // Cache it so we never ask again this session
      primaryTokenRef.current = token;
      apiClient.setProfileToken(token);
      setSelectPinProfile(null);
      if (pendingAction) {
        await pendingAction();
        setPendingAction(null);
      }
    } catch (err: any) {
      setSelectPinError(err?.response?.data?.message || 'Incorrect PIN. Try again.');
    } finally {
      setBusy(false);
    }
  };

  // ── Select profile ─────────────────────────────────────────────────────

  const handleSelect = async (profile: any) => {
    if (managing) return;

    // If we already know this profile has a PIN, show modal immediately
    if (pinnedIds.has(profile._id)) {
      setSelectPinProfile(profile);
      setSelectPinError('');
      return;
    }

    // Otherwise try to select — if backend returns PIN error, show modal
    try {
      setBusy(true);
      const res = await apiClient.selectProfile(profile._id);
      const d = res.data || res;
      const token = d.token || d.profileToken;
      if (!token) throw new Error('No token received');
      setProfileToken(token);
      setCurrentProfile(d.profile || d);
      toast.success(`Welcome, ${(d.profile || d).name}!`);
      const plan = sessionStorage.getItem('redirectToPlan');
      if (plan) { sessionStorage.removeItem('redirectToPlan'); navigate(`/subscription?planId=${plan}`); }
      else navigate('/');
    } catch (err: any) {
      const status: number = err?.response?.status;
      const msg: string = (err?.response?.data?.message || '').toLowerCase();

      // Only show PIN modal if backend explicitly says PIN is required
      if (status === 400 && msg.includes('pin')) {
        setPinnedIds((prev) => new Set([...prev, profile._id]));
        setSelectPinProfile(profile);
        setSelectPinError('');
      } else {
        toast.error(err?.response?.data?.message || 'Failed to select profile');
      }
    } finally {
      setBusy(false);
    }
  };

  const handlePinSubmitForSelect = async (pin: string) => {
    try {
      setBusy(true);
      setSelectPinError('');
      const res = await apiClient.selectProfile(selectPinProfile._id, pin);
      const d = res.data || res;
      const token = d.token || d.profileToken;
      if (!token) throw new Error('No token received');
      setProfileToken(token);
      setCurrentProfile(d.profile || d);
      setSelectPinProfile(null);
      toast.success(`Welcome, ${(d.profile || d).name}!`);
      const plan = sessionStorage.getItem('redirectToPlan');
      if (plan) { sessionStorage.removeItem('redirectToPlan'); navigate(`/subscription?planId=${plan}`); }
      else navigate('/');
    } catch (err: any) {
      setSelectPinError(err?.response?.data?.message || 'Incorrect PIN. Try again.');
    } finally {
      setBusy(false);
    }
  };

  // ── Add profile ────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!newName.trim()) { toast.error('Please enter a profile name'); return; }
    setAddingProfile(true);
    try {
      await runWithPrimaryToken(async () => {
        await apiClient.createProfile({ name: newName.trim(), isKids: newIsKids, avatar: newColor });
        toast.success('Profile created');
        setAdding(false); setNewName(''); setNewIsKids(false); setNewColor(AVATAR_COLORS[0]);
        await loadProfiles();
      });
    } catch (err: any) {
      const msg: string = err?.response?.data?.message || err?.message || '';
      // checkPinForCreation: primary profile must have a PIN before creating sub-profiles
      if (msg.toLowerCase().includes('pin') || msg.toLowerCase().includes('set a pin')) {
        toast.error('You must add a PIN to your primary profile before creating sub-profiles. Edit your primary profile first.');
      } else {
        toast.error(msg || 'Failed to create profile');
      }
    } finally { setAddingProfile(false); }
  };

  // ── Delete profile ─────────────────────────────────────────────────────

  const handleDelete = async (profileId: string) => {
    if (!confirm('Delete this profile? This cannot be undone.')) return;
    try {
      await runWithPrimaryToken(async () => {
        await apiClient.deleteProfile(profileId);
        toast.success('Profile deleted');
        setPinnedIds((prev) => { const n = new Set(prev); n.delete(profileId); return n; });
        await loadProfiles();
      });
    } catch (err: any) {
      if (err?.message !== 'PRIMARY_PIN_REQUIRED') {
        toast.error(err?.response?.data?.message || 'Failed to delete profile');
      }
    }
  };

  // ── Edit modal ─────────────────────────────────────────────────────────

  const openEdit = (profile: any) => {
    setEditProfile(profile);
    setEditName(profile.name);
    setEditIsKids(profile.isKids || false);
    setEditColor(profile.avatar || AVATAR_COLORS[0]);
    setPinMode('none'); setPinOld(''); setPinNew(''); setPinError('');

    // Seed PIN status immediately from the backend virtual field `isPinProtected`
    // so the modal renders the correct state without waiting for an async probe
    if (profile.isPinProtected) {
      setPinnedIds((prev) => new Set([...prev, profile._id]));
    } else if (!pinnedIds.has(profile._id)) {
      // If not already confirmed via a prior select attempt, probe to be sure
      apiClient.selectProfile(profile._id).then(() => {
        setPinnedIds((prev) => { const n = new Set(prev); n.delete(profile._id); return n; });
      }).catch((err: any) => {
        const status: number = err?.response?.status;
        const msg: string = (err?.response?.data?.message || '').toLowerCase();
        if (status === 400 && msg.includes('pin')) {
          setPinnedIds((prev) => new Set([...prev, profile._id]));
        }
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) { toast.error('Name cannot be empty'); return; }
    setSavingEdit(true);
    try {
      await runWithPrimaryToken(async () => {
        await apiClient.updateProfile(editProfile._id, {
          name: editName.trim(), isKids: editIsKids, avatar: editColor,
        });
        toast.success('Profile updated');
        setEditProfile(null);
        await loadProfiles();
      });
    } catch (err: any) {
      if (err?.message !== 'PRIMARY_PIN_REQUIRED') {
        toast.error(err?.response?.data?.message || 'Failed to update profile');
      }
    } finally { setSavingEdit(false); }
  };

  // ── PIN operations ─────────────────────────────────────────────────────

  const resetPinForm = () => { setPinMode('none'); setPinOld(''); setPinNew(''); setPinError(''); };

  const handleSavePin = async () => {
    const profileId = editProfile._id;
    setPinError('');
    setSavingPin(true);
    try {
      await runWithPrimaryToken(async () => {
        if (pinMode === 'add') {
          if (pinNew.length !== 6) { setPinError('PIN must be exactly 6 digits'); return; }
          await apiClient.addProfilePin(profileId, pinNew);
          toast.success('PIN added — this profile is now protected');
          setPinnedIds((prev) => new Set([...prev, profileId]));
          resetPinForm();

        } else if (pinMode === 'change') {
          if (pinOld.length !== 6) { setPinError('Current PIN must be 6 digits'); return; }
          if (pinNew.length !== 6) { setPinError('New PIN must be 6 digits'); return; }
          await apiClient.changeProfilePin(profileId, pinOld, pinNew);
          toast.success('PIN changed successfully');
          setPinnedIds((prev) => new Set([...prev, profileId]));
          resetPinForm();

        } else if (pinMode === 'delete') {
          if (pinOld.length !== 6) { setPinError('Enter your current 6-digit PIN'); return; }
          await apiClient.verifyProfilePin(profileId, pinOld);
          setPinError('PIN removal is not supported by the server. Please change it to a new one instead.');
          setPinMode('change');
          setPinNew('');
          return;
        }

        // Refresh editProfile data
        const updated = await apiClient.getProfiles();
        const all: any[] = Array.isArray(updated) ? updated : (updated?.data || []);
        const refreshed = all.find((p: any) => p._id === profileId);
        if (refreshed) setEditProfile(refreshed);
      });
    } catch (err: any) {
      if (err?.message !== 'PRIMARY_PIN_REQUIRED') {
        setPinError(err?.response?.data?.message || 'Failed. Please check your PIN and try again.');
      }
    } finally { setSavingPin(false); }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-950">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading profiles…</p>
        </div>
      </div>
    );
  }

  const primaryProfile = profiles.find((p) => p.primaryProfile);
  const secondaryProfiles = profiles.filter((p) => !p.primaryProfile);
  const canAddMore = profiles.length < 6;
  const editHasPin = editProfile ? pinnedIds.has(editProfile._id) : false;

  const ProfileCard = ({ profile, isPrimary }: { profile: any; isPrimary?: boolean }) => {
    const isPin = pinnedIds.has(profile._id) || !!profile.isPinProtected;
    return (
      <div className="flex flex-col items-center group">
        <div className="relative">
          <button
            onClick={() => handleSelect(profile)}
            disabled={busy || managing}
            className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden transition-all hover:ring-4 hover:ring-white/30 disabled:cursor-default"
            style={{ backgroundColor: profile.avatar || (isPrimary ? '#ff3b2f' : '#3b82f6') }}
          >
            <div className="w-full h-full flex items-center justify-center text-white text-3xl sm:text-4xl font-bold select-none">
              {getInitials(profile.name)}
            </div>
            {profile.isKids && (
              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] bg-white/20 text-white font-bold">KIDS</span>
            )}
          </button>

          {isPin && (
            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center shadow-lg">
              <Lock size={12} className="text-white" />
            </div>
          )}

          {managing && (
            <button
              onClick={() => openEdit(profile)}
              className="absolute inset-0 rounded-lg bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Pencil size={26} className="text-white" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-3">
          <p className="text-gray-300 font-medium text-sm sm:text-base">{profile.name}</p>
          {isPrimary && <ShieldCheck size={14} className="text-gold-500 flex-shrink-0" />}
          {isPin && !managing && <Lock size={11} className="text-brand-400 flex-shrink-0" />}
        </div>

        {managing && (
          <div className="flex items-center gap-2 mt-1.5">
            <button onClick={() => openEdit(profile)} className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-0.5">
              <Pencil size={10} /> Edit
            </button>
            {!isPrimary && (
              <>
                <span className="text-gray-600 text-xs">·</span>
                <button onClick={() => handleDelete(profile._id)} className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-0.5">
                  <Trash2 size={10} /> Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20 bg-ink-950">
      <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2 text-center">
        {managing ? 'Manage Profiles' : "Who's watching?"}
      </h1>
      <p className="text-gray-400 mb-12 text-center max-w-md">
        {managing ? 'Edit, add, or remove profiles' : 'Select a profile to start streaming'}
      </p>

      <div className="flex flex-wrap items-start justify-center gap-6 sm:gap-8 max-w-4xl">
        {primaryProfile && <ProfileCard profile={primaryProfile} isPrimary />}
        {secondaryProfiles.map((p) => <ProfileCard key={p._id} profile={p} />)}
        {canAddMore && managing && (
          <div className="flex flex-col items-center">
            <button onClick={() => setAdding(true)}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg border-2 border-dashed border-ink-500 flex items-center justify-center text-gray-500 hover:border-white hover:text-white transition-all">
              <Plus size={40} />
            </button>
            <p className="text-gray-400 text-sm mt-3">Add Profile</p>
          </div>
        )}
      </div>

      <div className="mt-12 flex gap-4">
        <button onClick={() => setManaging(!managing)}
          className="px-6 py-2.5 border border-ink-500 text-gray-300 hover:border-white hover:text-white rounded-md font-medium transition-all">
          {managing ? 'Done' : 'Manage Profiles'}
        </button>
        <button
          onClick={async () => {
            try {
              primaryTokenRef.current = null;
              await apiClient.logout();
              window.location.href = '/login';
            } catch { toast.error('Error logging out'); }
          }}
          className="px-6 py-2.5 border border-red-500/50 text-red-400 hover:border-red-400 hover:text-red-300 rounded-md font-medium transition-all">
          Logout
        </button>
      </div>

      {/* ── Add Profile Modal ─────────────────────────────────────────── */}
      {adding && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setAdding(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-ink-850 rounded-2xl p-6 border border-ink-600 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">Create New Profile</h2>
              <button onClick={() => setAdding(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Profile Name</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Kids, Dad, Mom" className="input-field" autoFocus disabled={addingProfile} />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Avatar Color</label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_COLORS.map((c) => (
                    <button key={c} onClick={() => setNewColor(c)}
                      className={`w-10 h-10 rounded-lg transition-all ${newColor === c ? 'ring-2 ring-white scale-110' : ''}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={newIsKids} onChange={(e) => setNewIsKids(e.target.checked)} className="w-5 h-5 rounded accent-brand-500" />
                <span className="text-gray-300 text-sm">Kids profile</span>
              </label>
              <button onClick={handleCreate} disabled={addingProfile || !newName.trim()} className="btn-primary w-full disabled:opacity-50">
                {addingProfile ? 'Creating…' : 'Create Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Profile Modal ────────────────────────────────────────── */}
      {editProfile && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setEditProfile(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-ink-850 rounded-2xl border border-ink-600 shadow-2xl overflow-hidden">

            <div className="flex items-center justify-between px-6 py-4 border-b border-ink-700">
              <h2 className="text-xl font-bold text-white">Edit Profile</h2>
              <button onClick={() => setEditProfile(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">

              {/* Avatar preview */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-xl flex items-center justify-center text-white text-3xl font-bold relative"
                  style={{ backgroundColor: editColor }}>
                  {getInitials(editName || editProfile.name)}
                  {editHasPin && (
                    <div className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center shadow-lg">
                      <Lock size={13} className="text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* PIN status banner */}
              {editHasPin ? (
                <div className="flex items-center gap-2.5 px-4 py-3 bg-brand-500/10 border border-brand-500/30 rounded-lg">
                  <Lock size={16} className="text-brand-400 flex-shrink-0" />
                  <div>
                    <p className="text-brand-300 text-sm font-semibold">PIN Protected</p>
                    <p className="text-brand-400/70 text-xs">A PIN is required to access this profile</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 px-4 py-3 bg-gray-500/10 border border-gray-600/30 rounded-lg">
                  <Lock size={16} className="text-gray-500 flex-shrink-0" />
                  <div>
                    <p className="text-gray-400 text-sm font-semibold">No PIN Set</p>
                    <p className="text-gray-500 text-xs">Anyone can access this profile</p>
                  </div>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Profile Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-ink-800 border border-ink-600 text-white focus:border-brand-500 focus:outline-none"
                  disabled={savingEdit} />
              </div>

              {/* Color */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Avatar Color</label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_COLORS.map((c) => (
                    <button key={c} onClick={() => setEditColor(c)}
                      className={`w-10 h-10 rounded-lg transition-all ${editColor === c ? 'ring-2 ring-white scale-110' : ''}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              {/* Kids */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={editIsKids} onChange={(e) => setEditIsKids(e.target.checked)} className="w-5 h-5 rounded accent-brand-500" />
                <span className="text-gray-300 text-sm">Kids profile (restricted content)</span>
              </label>

              <button onClick={handleSaveEdit} disabled={savingEdit || !editName.trim()} className="btn-primary w-full disabled:opacity-50">
                {savingEdit ? 'Saving…' : 'Save Changes'}
              </button>

              {/* ── PIN section ── */}
              <div className="border-t border-ink-700 pt-5">
                <div className="flex items-center gap-2 mb-4">
                  <KeyRound size={17} className="text-brand-400" />
                  <span className="text-white font-semibold">PIN Management</span>
                </div>

                {/* PIN error */}
                {pinError && (
                  <div className="mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
                    {pinError}
                  </div>
                )}

                {pinMode === 'none' && (
                  <div className="space-y-2">
                    {!editHasPin ? (
                      <button onClick={() => { setPinMode('add'); setPinError(''); }}
                        className="w-full px-4 py-3 rounded-lg bg-ink-800 border border-ink-600 text-gray-300 hover:border-brand-500 hover:text-white transition-all text-sm font-medium flex items-center gap-2">
                        <Plus size={15} className="text-brand-400" />
                        Add PIN
                        <span className="ml-auto text-xs text-gray-600">protect this profile</span>
                      </button>
                    ) : (
                      <>
                        <button onClick={() => { setPinMode('change'); setPinError(''); }}
                          className="w-full px-4 py-3 rounded-lg bg-ink-800 border border-ink-600 text-gray-300 hover:border-brand-500 hover:text-white transition-all text-sm font-medium flex items-center gap-2">
                          <KeyRound size={15} className="text-brand-400" />
                          Change PIN
                          <span className="ml-auto text-xs text-gray-600">requires current PIN</span>
                        </button>
                        <button onClick={() => { setPinMode('delete'); setPinError(''); }}
                          className="w-full px-4 py-3 rounded-lg bg-ink-800 border border-red-500/25 text-red-400 hover:border-red-500/60 hover:text-red-300 transition-all text-sm font-medium flex items-center gap-2">
                          <Trash2 size={15} />
                          Remove PIN
                          <span className="ml-auto text-xs text-red-500/50">requires current PIN</span>
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Add PIN */}
                {pinMode === 'add' && (
                  <div className="space-y-3 bg-ink-900/60 rounded-xl p-4 border border-ink-700">
                    <p className="text-sm text-gray-400">Choose a 6-digit PIN for this profile.</p>
                    <PinInput value={pinNew} onChange={setPinNew} placeholder="New PIN" autoFocus />
                    <div className="flex gap-2">
                      <button onClick={resetPinForm} className="flex-1 px-4 py-2 rounded-lg border border-ink-600 text-gray-400 hover:text-white text-sm transition-all">Cancel</button>
                      <button onClick={handleSavePin} disabled={savingPin || pinNew.length !== 6}
                        className="flex-1 btn-primary text-sm disabled:opacity-50">
                        {savingPin ? 'Saving…' : 'Set PIN'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Change PIN */}
                {pinMode === 'change' && (
                  <div className="space-y-3 bg-ink-900/60 rounded-xl p-4 border border-ink-700">
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">Current PIN</label>
                      <PinInput value={pinOld} onChange={setPinOld} placeholder="Current PIN" autoFocus />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">New PIN</label>
                      <PinInput value={pinNew} onChange={setPinNew} placeholder="New PIN" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={resetPinForm} className="flex-1 px-4 py-2 rounded-lg border border-ink-600 text-gray-400 hover:text-white text-sm transition-all">Cancel</button>
                      <button onClick={handleSavePin} disabled={savingPin || pinOld.length !== 6 || pinNew.length !== 6}
                        className="flex-1 btn-primary text-sm disabled:opacity-50">
                        {savingPin ? 'Updating…' : 'Change PIN'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Remove PIN */}
                {pinMode === 'delete' && (
                  <div className="space-y-3 bg-red-950/30 rounded-xl p-4 border border-red-500/20">
                    <p className="text-sm text-red-300">Enter your current PIN to confirm removal.</p>
                    <PinInput value={pinOld} onChange={setPinOld} placeholder="Current PIN" autoFocus />
                    <div className="flex gap-2">
                      <button onClick={resetPinForm} className="flex-1 px-4 py-2 rounded-lg border border-ink-600 text-gray-400 hover:text-white text-sm transition-all">Cancel</button>
                      <button onClick={handleSavePin} disabled={savingPin || pinOld.length !== 6}
                        className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium disabled:opacity-50 transition-all">
                        {savingPin ? 'Verifying…' : 'Remove PIN'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PIN modal for profile selection OR primary management ──────── */}
      {selectPinProfile && (
        <ProfilePINModal
          profileName={selectPinProfile.name}
          onSubmit={selectPinProfile._pendingManagement ? handlePrimaryPinForManagement : handlePinSubmitForSelect}
          onCancel={() => {
            setSelectPinProfile(null);
            setSelectPinError('');
            setPrimaryPinError('');
            if (selectPinProfile?._pendingManagement) setPendingAction(null);
          }}
          isLoading={busy}
          error={selectPinError || primaryPinError}
        />
      )}
    </div>
  );
}
