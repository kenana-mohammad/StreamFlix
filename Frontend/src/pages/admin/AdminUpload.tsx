import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Upload, Film, Image as ImageIcon, Trash2,
  CheckCircle, XCircle, Loader, Copy, ExternalLink,
  Plus, ChevronDown, ChevronUp, AlertCircle, RefreshCw,
  Tv, Layers, PlayCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/lib/useToast';

// ── Constants ──────────────────────────────────────────────────────────────
const AGE_RATINGS = ['G', 'PG', 'PG-13', 'R', 'NC-17'];
const STATUSES    = ['Published', 'Draft'];

// ── Helpers ────────────────────────────────────────────────────────────────
const fileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3)   return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
};

// ── Field component ────────────────────────────────────────────────────────
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inp = 'w-full px-3 py-2.5 rounded-lg bg-ink-800 border border-ink-600 text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none text-sm';
const sel = `${inp} cursor-pointer`;

// ── Upload zone + progress ─────────────────────────────────────────────────
function UploadField({
  label, type, value, onChange,
}: {
  label: string; type: 'video' | 'image'; value: string; onChange: (url: string) => void;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);

  const accept = type === 'video' ? '.mp4,.mov,.avi,.mkv,.webm,video/*' : '.jpg,.jpeg,.png,.webp,image/*';

  const handleFile = async (file: File) => {
    try {
      setUploading(true); setProgress(0);
      const onProg = (p: number) => setProgress(p);
      let result: any;
      if (type === 'video') {
        result = await apiClient.uploadVideo(file, onProg);
      } else {
        result = await apiClient.uploadPoster(file, onProg);
      }
      onChange(result.url);
      toast.success(`${type === 'video' ? 'Video' : 'Image'} uploaded`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false); setProgress(0);
    }
  };

  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
      <div className="space-y-2">
        {/* Manual URL input */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={type === 'video' ? 'https://res.cloudinary.com/.../video.mp4' : 'https://res.cloudinary.com/.../poster.jpg'}
          className={inp}
        />
        {/* Or upload */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-ink-600 text-gray-400 hover:border-brand-500 hover:text-white transition-all text-xs disabled:opacity-50"
          >
            {uploading ? <Loader size={13} className="animate-spin" /> : <Upload size={13} />}
            {uploading ? `Uploading ${progress}%` : `Upload ${type === 'video' ? 'Video' : 'Image'}`}
          </button>
          {value && (
            <a href={value} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300">
              <ExternalLink size={12} /> Preview
            </a>
          )}
          <input ref={inputRef} type="file" accept={accept} className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ''; }} />
        </div>
        {/* Progress bar */}
        {uploading && (
          <div className="h-1.5 rounded-full bg-ink-700 overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
        )}
        {/* Poster preview */}
        {type === 'image' && value && (
          <img src={value} alt="poster" className="h-24 rounded-lg object-cover border border-ink-700 mt-1" />
        )}
      </div>
    </div>
  );
}

// ── Cast row ───────────────────────────────────────────────────────────────
function CastRow({
  cast, allCast, onChange, onRemove,
}: {
  cast: { castId: string; characterName: string };
  allCast: any[];
  onChange: (field: string, val: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-2 items-center">
      <select value={cast.castId} onChange={(e) => onChange('castId', e.target.value)} className={`${sel} flex-1`}>
        <option value="">Select actor</option>
        {allCast.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
      </select>
      <input value={cast.characterName} onChange={(e) => onChange('characterName', e.target.value)}
        placeholder="Character name" className={`${inp} flex-1`} />
      <button type="button" onClick={onRemove} className="p-2 text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
    </div>
  );
}

// ── Base content fields (shared by movie + series) ─────────────────────────
function BaseFields({
  form, setForm, genres, allCast,
}: {
  form: any; setForm: (f: any) => void; genres: any[]; allCast: any[];
}) {
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const toggleGenre = (id: string) => {
    const cur: string[] = form.genres || [];
    set('genres', cur.includes(id) ? cur.filter((g) => g !== id) : [...cur, id]);
  };

  const addCast = () => set('casts', [...(form.casts || []), { castId: '', characterName: '' }]);
  const removeCast = (i: number) => set('casts', form.casts.filter((_: any, idx: number) => idx !== i));
  const setCast = (i: number, field: string, val: string) =>
    set('casts', form.casts.map((c: any, idx: number) => idx === i ? { ...c, [field]: val } : c));

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Title" required>
          <input value={form.title || ''} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Inception" className={inp} />
        </Field>
        <Field label="Release Year" required>
          <input type="number" value={form.releaseYear || ''} onChange={(e) => set('releaseYear', +e.target.value)} placeholder="2024" className={inp} min={1900} max={2100} />
        </Field>
      </div>

      <Field label="Description" required>
        <textarea value={form.description || ''} onChange={(e) => set('description', e.target.value)}
          placeholder="Describe the content…" rows={3} className={`${inp} resize-none`} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Age Rating" required>
          <select value={form.ageRating || ''} onChange={(e) => set('ageRating', e.target.value)} className={sel}>
            <option value="">Select rating</option>
            {AGE_RATINGS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select value={form.status || 'Draft'} onChange={(e) => set('status', e.target.value)} className={sel}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      <UploadField label="Poster Image *" type="image" value={form.poster || ''} onChange={(v) => set('poster', v)} />
      <Field label="Trailer URL (optional)">
        <input value={form.trailerUrl || ''} onChange={(e) => set('trailerUrl', e.target.value)} placeholder="https://youtube.com/watch?v=..." className={inp} />
      </Field>
      <Field label="Publish Date (optional)">
        <input type="datetime-local" value={form.publishAt || ''} onChange={(e) => set('publishAt', e.target.value)} className={inp} />
      </Field>

      {/* Genres */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Genres</label>
        <div className="flex flex-wrap gap-2">
          {genres.map((g: any) => {
            const sel2 = (form.genres || []).includes(g._id);
            return (
              <button key={g._id} type="button" onClick={() => toggleGenre(g._id)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${sel2 ? 'bg-brand-500 border-brand-500 text-white' : 'bg-ink-800 border-ink-600 text-gray-400 hover:border-ink-400'}`}>
                {g.name}
              </button>
            );
          })}
          {genres.length === 0 && <p className="text-gray-600 text-xs">No genres loaded</p>}
        </div>
      </div>

      {/* Cast */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-gray-400">Cast (optional)</label>
          <button type="button" onClick={addCast} className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300">
            <Plus size={12} /> Add
          </button>
        </div>
        <div className="space-y-2">
          {(form.casts || []).map((c: any, i: number) => (
            <CastRow key={i} cast={c} allCast={allCast} onChange={(f, v) => setCast(i, f, v)} onRemove={() => removeCast(i)} />
          ))}
          {(form.casts || []).length === 0 && (
            <p className="text-gray-600 text-xs">No cast added yet</p>
          )}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MOVIE FORM
// ═══════════════════════════════════════════════════════════════════════════
function MovieForm({ genres, allCast, onSuccess }: { genres: any[]; allCast: any[]; onSuccess: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState<any>({ status: 'Draft', genres: [], casts: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!form.title || !form.description || !form.poster || !form.ageRating || !form.releaseYear) {
      setError('Please fill in all required fields.'); return;
    }
    if (!form.duration || form.duration < 1) { setError('Duration is required (minutes).'); return; }
    if (!form.videoUrl) { setError('Video URL is required.'); return; }
    try {
      setSaving(true);
      await apiClient.adminCreateMovie({
        ...form,
        releaseYear: Number(form.releaseYear),
        duration: Number(form.duration),
        casts: (form.casts || []).filter((c: any) => c.castId),
      });
      toast.success('Movie created successfully');
      setForm({ status: 'Draft', genres: [], casts: [] });
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message ||
        (err?.response?.data?.errors?.map((e: any) => e.message).join(' • ')) ||
        'Failed to create movie';
      setError(msg);
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <BaseFields form={form} setForm={setForm} genres={genres} allCast={allCast} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Duration (minutes)" required>
          <input type="number" value={form.duration || ''} onChange={(e) => setForm((p: any) => ({ ...p, duration: +e.target.value }))}
            placeholder="120" min={1} className={inp} />
        </Field>
      </div>

      <UploadField label="Video URL *" type="video" value={form.videoUrl || ''} onChange={(v) => setForm((p: any) => ({ ...p, videoUrl: v }))} />

      {error && <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"><AlertCircle size={15} className="flex-shrink-0 mt-0.5" />{error}</div>}

      <button type="submit" disabled={saving} className="btn-primary w-full py-3 disabled:opacity-50 flex items-center justify-center gap-2">
        {saving ? <><Loader size={16} className="animate-spin" /> Creating Movie…</> : <><Film size={16} /> Create Movie</>}
      </button>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SERIES FORM
// ═══════════════════════════════════════════════════════════════════════════
function SeriesForm({ genres, allCast, onSuccess }: { genres: any[]; allCast: any[]; onSuccess: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState<any>({ status: 'Draft', genres: [], casts: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!form.title || !form.description || !form.poster || !form.ageRating || !form.releaseYear) {
      setError('Please fill in all required fields.'); return;
    }
    try {
      setSaving(true);
      await apiClient.adminCreateSeries({
        ...form,
        releaseYear: Number(form.releaseYear),
        casts: (form.casts || []).filter((c: any) => c.castId),
      });
      toast.success('Series created successfully');
      setForm({ status: 'Draft', genres: [], casts: [] });
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message ||
        (err?.response?.data?.errors?.map((e: any) => e.message).join(' • ')) ||
        'Failed to create series';
      setError(msg);
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <BaseFields form={form} setForm={setForm} genres={genres} allCast={allCast} />

      {error && <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"><AlertCircle size={15} className="flex-shrink-0 mt-0.5" />{error}</div>}

      <button type="submit" disabled={saving} className="btn-primary w-full py-3 disabled:opacity-50 flex items-center justify-center gap-2">
        {saving ? <><Loader size={16} className="animate-spin" /> Creating Series…</> : <><Tv size={16} /> Create Series</>}
      </button>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EPISODE FORM  (requires choosing series → season)
// ═══════════════════════════════════════════════════════════════════════════
function EpisodeForm({ onSuccess }: { onSuccess: () => void }) {
  const toast = useToast();
  const [seriesList, setSeriesList]   = useState<any[]>([]);
  const [seasons, setSeasons]         = useState<any[]>([]);
  const [selectedSeries, setSelectedSeries] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [form, setForm] = useState<any>({ description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  // Add season inline
  const [addingSeason, setAddingSeason] = useState(false);
  const [newSeasonNum, setNewSeasonNum] = useState('');
  const [newSeasonTitle, setNewSeasonTitle] = useState('');
  const [savingSeason, setSavingSeason] = useState(false);

  useEffect(() => {
    apiClient.adminGetSeries()
      .then((res) => setSeriesList(Array.isArray(res) ? res : []))
      .catch(() => {});
  }, []);

  const loadSeasons = async (seriesId: string) => {
    setSelectedSeries(seriesId);
    setSelectedSeason('');
    setSeasons([]);
    if (!seriesId) return;
    try {
      setLoadingSeasons(true);
      // Use the admin series detail endpoint — it returns all seasons (including Draft)
      // The public seasons endpoint only returns Published seasons, so new seasons
      // (which start without a status) would not appear there.
      const seriesDetail = await apiClient.adminGetSeriesById(seriesId);
      const detail = seriesDetail?.series || seriesDetail;
      const seasonData = detail?.seasons || [];
      setSeasons(Array.isArray(seasonData) ? [...seasonData].sort((a: any, b: any) => a.seasonNumber - b.seasonNumber) : []);
    } catch {
      // Fallback to public endpoint if admin detail fails
      try {
        const res = await apiClient.adminGetSeasonsBySeries(seriesId);
        setSeasons(Array.isArray(res) ? res : []);
      } catch { toast.error('Failed to load seasons'); }
    }
    finally { setLoadingSeasons(false); }
  };

  const handleAddSeason = async () => {
    if (!newSeasonNum) { toast.error('Season number required'); return; }
    try {
      setSavingSeason(true);
      const newSeason = await apiClient.adminCreateSeason(selectedSeries, {
        seasonNumber: Number(newSeasonNum),
        title: newSeasonTitle || undefined,
      });
      toast.success('Season added');

      // Append directly from the create response — don't re-fetch the public endpoint
      // (public endpoint filters by Published status, new seasons won't appear there)
      const seasonData = newSeason?.data || newSeason;
      if (seasonData?._id) {
        setSeasons((prev) => {
          const updated = [...prev, seasonData].sort((a, b) => a.seasonNumber - b.seasonNumber);
          return updated;
        });
        setSelectedSeason(seasonData._id); // auto-select the new season
      }

      setNewSeasonNum(''); setNewSeasonTitle(''); setAddingSeason(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add season');
    } finally { setSavingSeason(false); }
  };

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!selectedSeries) { setError('Please select a series.'); return; }
    if (!selectedSeason) { setError('Please select a season.'); return; }
    if (!form.title) { setError('Episode title is required.'); return; }
    if (!form.episodeNumber) { setError('Episode number is required.'); return; }
    if (!form.duration) { setError('Duration is required.'); return; }
    if (!form.videoUrl) { setError('Video URL is required.'); return; }
    try {
      setSaving(true);
      await apiClient.adminCreateEpisode(selectedSeason, {
        ...form,
        episodeNumber: Number(form.episodeNumber),
        duration: Number(form.duration),
      });
      toast.success('Episode created successfully');
      setForm({ description: '' });
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message ||
        (err?.response?.data?.errors?.map((e: any) => e.message).join(' • ')) ||
        'Failed to create episode';
      setError(msg);
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Series & Season selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Series" required>
          <select value={selectedSeries} onChange={(e) => loadSeasons(e.target.value)} className={sel}>
            <option value="">Select series</option>
            {seriesList.map((s: any) => (
              <option key={s._id} value={s._id}>{s.contentId?.title || s.title || s._id}</option>
            ))}
          </select>
        </Field>

        <Field label="Season" required>
          <div className="flex gap-2">
            <select value={selectedSeason} onChange={(e) => setSelectedSeason(e.target.value)} className={`${sel} flex-1`} disabled={!selectedSeries || loadingSeasons}>
              <option value="">{loadingSeasons ? 'Loading…' : 'Select season'}</option>
              {seasons.map((s: any) => (
                <option key={s._id} value={s._id}>Season {s.seasonNumber}{s.title ? ` — ${s.title}` : ''}</option>
              ))}
            </select>
            {selectedSeries && (
              <button type="button" onClick={() => setAddingSeason(!addingSeason)}
                className="p-2.5 rounded-lg border border-ink-600 text-gray-400 hover:text-white hover:border-ink-400 transition-all flex-shrink-0" title="Add season">
                <Plus size={15} />
              </button>
            )}
          </div>
        </Field>
      </div>

      {/* Add season inline */}
      {addingSeason && selectedSeries && (
        <div className="p-4 bg-ink-900/50 rounded-xl border border-ink-700 space-y-3">
          <p className="text-sm font-medium text-white flex items-center gap-2"><Layers size={15} className="text-brand-400" /> Add New Season</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Season Number *">
              <input type="number" value={newSeasonNum} onChange={(e) => setNewSeasonNum(e.target.value)} min={1} placeholder="1" className={inp} />
            </Field>
            <Field label="Title (optional)">
              <input value={newSeasonTitle} onChange={(e) => setNewSeasonTitle(e.target.value)} placeholder="e.g. The Beginning" className={inp} />
            </Field>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setAddingSeason(false)} className="flex-1 px-4 py-2 rounded-lg border border-ink-600 text-gray-400 hover:text-white text-sm transition-all">Cancel</button>
            <button type="button" onClick={handleAddSeason} disabled={savingSeason || !newSeasonNum}
              className="flex-1 btn-primary text-sm disabled:opacity-50">
              {savingSeason ? 'Adding…' : 'Add Season'}
            </button>
          </div>
        </div>
      )}

      {/* Episode fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Episode Number" required>
          <input type="number" value={form.episodeNumber || ''} onChange={(e) => set('episodeNumber', e.target.value)} min={1} placeholder="1" className={inp} />
        </Field>
        <Field label="Duration (minutes)" required>
          <input type="number" value={form.duration || ''} onChange={(e) => set('duration', e.target.value)} min={1} placeholder="45" className={inp} />
        </Field>
      </div>

      <Field label="Title" required>
        <input value={form.title || ''} onChange={(e) => set('title', e.target.value)} placeholder="Episode title" className={inp} />
      </Field>

      <Field label="Description">
        <textarea value={form.description || ''} onChange={(e) => set('description', e.target.value)}
          placeholder="Episode description (optional)" rows={3} className={`${inp} resize-none`} />
      </Field>

      <UploadField label="Video URL *" type="video" value={form.videoUrl || ''} onChange={(v) => set('videoUrl', v)} />

      {error && <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"><AlertCircle size={15} className="flex-shrink-0 mt-0.5" />{error}</div>}

      <button type="submit" disabled={saving} className="btn-primary w-full py-3 disabled:opacity-50 flex items-center justify-center gap-2">
        {saving ? <><Loader size={16} className="animate-spin" /> Creating Episode…</> : <><PlayCircle size={16} /> Create Episode</>}
      </button>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
type ContentType = 'movie' | 'series' | 'episode';

export default function AdminUpload() {
  const navigate = useNavigate();
  const toast    = useToast();

  const [tab, setTab]         = useState<ContentType>('movie');
  const [genres, setGenres]   = useState<any[]>([]);
  const [allCast, setAllCast] = useState<any[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Recent uploads list
  const [recentMovies, setRecentMovies]   = useState<any[]>([]);
  const [recentSeries, setRecentSeries]   = useState<any[]>([]);
  const [loadingList, setLoadingList]     = useState(false);
  const [showList, setShowList]           = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.getGenres().then((r) => setGenres(Array.isArray(r) ? r : (r?.data || []))),
      apiClient.adminGetCast().then((r) => setAllCast(Array.isArray(r) ? r : (r?.data || []))),
    ]).catch(() => {}).finally(() => setLoadingMeta(false));
  }, []);

  const loadRecentContent = async () => {
    try {
      setLoadingList(true);
      const [movies, series] = await Promise.all([
        apiClient.adminGetMovies(),
        apiClient.adminGetSeries(),
      ]);
      setRecentMovies(Array.isArray(movies) ? movies.slice(0, 5) : []);
      setRecentSeries(Array.isArray(series) ? series.slice(0, 5) : []);
    } catch { toast.error('Failed to load content list'); }
    finally { setLoadingList(false); }
  };

  const handleSuccess = () => {
    setShowList(true);
    loadRecentContent();
  };

  const deleteContent = async (type: 'movie' | 'series', id: string) => {
    if (!confirm(`Delete this ${type}? This cannot be undone.`)) return;
    try {
      if (type === 'movie') {
        await apiClient.adminDeleteMovie(id);
        setRecentMovies((p) => p.filter((m) => m._id !== id));
      } else {
        await apiClient.adminDeleteSeries(id);
        setRecentSeries((p) => p.filter((s) => s._id !== id));
      }
      toast.success(`${type} deleted`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete');
    }
  };

  const tabs: { id: ContentType; label: string; icon: any; color: string }[] = [
    { id: 'movie',   label: 'Add Movie',   icon: Film,       color: 'text-purple-400' },
    { id: 'series',  label: 'Add Series',  icon: Tv,         color: 'text-blue-400'   },
    { id: 'episode', label: 'Add Episode', icon: PlayCircle, color: 'text-green-400'  },
  ];

  return (
    <div className="min-h-screen pt-6 pb-16 px-4 sm:px-6 lg:px-10 max-w-4xl mx-auto">
      <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm">
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Content Management</h1>
        <p className="text-gray-400 text-sm mt-1">Add movies, series, and episodes to the platform</p>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 mb-7 flex-wrap">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-brand-500 text-white'
                : 'bg-ink-800 border border-ink-600 text-gray-400 hover:text-white hover:border-ink-400'
            }`}>
            <t.icon size={15} className={tab === t.id ? 'text-white' : t.color} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading metadata */}
      {loadingMeta ? (
        <div className="flex items-center gap-3 text-gray-400 py-10 justify-center">
          <Loader size={20} className="animate-spin text-brand-500" /> Loading genres and cast…
        </div>
      ) : (
        <div className="glass rounded-2xl border border-ink-600 p-6">
          {tab === 'movie'   && <MovieForm   genres={genres} allCast={allCast} onSuccess={handleSuccess} />}
          {tab === 'series'  && <SeriesForm  genres={genres} allCast={allCast} onSuccess={handleSuccess} />}
          {tab === 'episode' && <EpisodeForm onSuccess={handleSuccess} />}
        </div>
      )}

      {/* Recent content list */}
      <div className="mt-8">
        <button
          onClick={() => { setShowList(!showList); if (!showList && recentMovies.length === 0) loadRecentContent(); }}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium transition-all"
        >
          {showList ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {showList ? 'Hide' : 'Show'} recent content
          {loadingList && <Loader size={13} className="animate-spin ml-1" />}
        </button>

        {showList && (
          <div className="mt-4 space-y-6">
            {/* Movies */}
            {recentMovies.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2"><Film size={14} /> Recent Movies</h3>
                <div className="space-y-2">
                  {recentMovies.map((m: any) => (
                    <div key={m._id} className="glass rounded-xl border border-ink-700 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {m.contentId?.poster && <img src={m.contentId.poster} alt="" className="w-8 h-12 rounded object-cover" />}
                        <div>
                          <p className="text-white text-sm font-medium">{m.contentId?.title || '—'}</p>
                          <p className="text-gray-500 text-xs">{m.contentId?.releaseYear} · {m.duration} min</p>
                        </div>
                      </div>
                      <button onClick={() => deleteContent('movie', m._id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Series */}
            {recentSeries.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2"><Tv size={14} /> Recent Series</h3>
                <div className="space-y-2">
                  {recentSeries.map((s: any) => (
                    <div key={s._id} className="glass rounded-xl border border-ink-700 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {s.contentId?.poster && <img src={s.contentId.poster} alt="" className="w-8 h-12 rounded object-cover" />}
                        <div>
                          <p className="text-white text-sm font-medium">{s.contentId?.title || '—'}</p>
                          <p className="text-gray-500 text-xs">{s.contentId?.releaseYear}</p>
                        </div>
                      </div>
                      <button onClick={() => deleteContent('series', s._id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recentMovies.length === 0 && recentSeries.length === 0 && !loadingList && (
              <p className="text-gray-600 text-sm text-center py-4">No content added yet.</p>
            )}

            <button onClick={loadRecentContent} disabled={loadingList}
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50">
              <RefreshCw size={12} /> Refresh list
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
