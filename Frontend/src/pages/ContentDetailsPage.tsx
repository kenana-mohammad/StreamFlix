import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play, Plus, Check, Star, AlertCircle, Loader, Heart,
  ChevronDown, ChevronUp, Clock, Calendar, Tag, Users,
} from 'lucide-react';
import { useProfile } from '@/lib/profileContext';
import { apiClient } from '@/lib/apiClient';
import { normalizeContent } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import ContentRow from '@/components/ContentRow';

type Tab = 'overview' | 'episodes' | 'ratings';

export default function ContentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { profileToken } = useProfile();

  const [content, setContent]           = useState<any>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [tab, setTab]                   = useState<Tab>('overview');

  // Watchlist / Favorites
  const [isFavorite, setIsFavorite]     = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  // Ratings
  const [ratings, setRatings]           = useState<any[]>([]);
  const [myRating, setMyRating]         = useState(0);
  const [myReview, setMyReview]         = useState('');
  const [ratingOpen, setRatingOpen]     = useState(false);
  const [submitting, setSubmitting]     = useState(false);

  // Episodes (series)
  const [seasons, setSeasons]           = useState<any[]>([]);
  const [openSeason, setOpenSeason]     = useState<string | null>(null);
  const [episodes, setEpisodes]         = useState<Record<string, any[]>>({});
  const [loadingEp, setLoadingEp]       = useState<string | null>(null);

  // Related
  const [related, setRelated]           = useState<any[]>([]);

  useEffect(() => {
    if (!id || !profileToken) { navigate('/profiles'); return; }
    load();
  }, [id, profileToken]);

  // ── Load ─────────────────────────────────────────────────────────────────
  const load = async () => {
    try {
      setLoading(true); setError('');

      const raw = await apiClient.getContentById(id!);
      const c   = normalizeContent(raw);
      if (!c) throw new Error('Content not found');
      setContent(c);

      const isSeries = c.type === 'series' || c.type === 'Series';

      if (isSeries) {
        await loadSeasonsForSeries(id!, raw);
      }

      // Ratings
      try {
        const rRes = await apiClient.getContentRatings(id!);
        const rData = rRes?.ratings || rRes?.data || (Array.isArray(rRes) ? rRes : []);
        setRatings(Array.isArray(rData) ? rData : []);
      } catch { /* silent */ }

      // My rating
      try {
        const mine = await apiClient.getMyRatingForContent(id!);
        const d = mine?.data || mine;
        if (d?.rating) { setMyRating(d.rating); setMyReview(d.review || ''); }
      } catch { /* not rated yet */ }

      // Favorites / Watchlist
      try {
        const [favRes, wlRes] = await Promise.all([
          apiClient.getFavorites(),
          apiClient.getWatchlist(),
        ]);
        const favList = Array.isArray(favRes) ? favRes : (favRes?.data || []);
        const wlList  = Array.isArray(wlRes)  ? wlRes  : (wlRes?.data  || []);
        setIsFavorite(favList.some((f: any) => f.contentId?._id === id || f.contentId === id));
        setIsWatchlisted(wlList.some((w: any) => w.contentId?._id === id || w.contentId === id));
      } catch { /* silent */ }

      // Related
      try {
        const [movies, series] = await Promise.all([
          apiClient.getAllMovies(),
          apiClient.getAllSeries(),
        ]);
        const all = [
          ...(Array.isArray(movies) ? movies : []).map(normalizeContent),
          ...(Array.isArray(series) ? series : []).map(normalizeContent),
        ].filter(Boolean);
        const genreNames = new Set((c.genres || []).map((g: any) => g.name).filter(Boolean));
        const rel = all.filter((x: any) =>
          x._id !== id &&
          (x.genres || []).some((g: any) => genreNames.has(g.name))
        );
        setRelated(rel.slice(0, 10));
      } catch { /* silent */ }

    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  // ── Load seasons — tries every available path ──────────────────────────
  const loadSeasonsForSeries = async (seriesId: string, rawData?: any) => {
    // Strategy 1: public seasons endpoint — returns seasons with episodes populated inline
    try {
      const pubRes = await apiClient.adminGetSeasonsBySeries(seriesId);
      const pubSeasons: any[] = Array.isArray(pubRes) ? pubRes : (pubRes?.data || []);
      if (pubSeasons.length > 0) {
        const sorted = sortSeasons(pubSeasons);
        setSeasons(sorted);
        setOpenSeason(sorted[0]._id);
        // Episodes come populated inline from the seasons endpoint
        populateEpisodesFromInline(sorted);
        return;
      }
    } catch { /* silent */ }

    // Strategy 2: admin series endpoint — works for super_admin/content_manager
    try {
      const adminRes = await apiClient.adminGetSeriesById(seriesId);
      const detail = adminRes?.series || adminRes;
      const adminSeasons: any[] = detail?.seasons || [];
      if (adminSeasons.length > 0) {
        const sorted = sortSeasons(adminSeasons);
        setSeasons(sorted);
        setOpenSeason(sorted[0]._id);
        populateEpisodesFromInline(sorted);
        return;
      }
    } catch { /* 403 for regular users — expected */ }

    // Strategy 3: inline from the series client response
    const inlineSeasons: any[] = rawData?.seasons || [];
    if (inlineSeasons.length > 0) {
      const sorted = sortSeasons(inlineSeasons);
      setSeasons(sorted);
      setOpenSeason(sorted[0]._id);
      populateEpisodesFromInline(sorted);
    }
  };

  const sortSeasons = (s: any[]) =>
    [...s].filter(Boolean).sort((a, b) => a.seasonNumber - b.seasonNumber);

  const populateEpisodesFromInline = (sorted: any[]) => {
    const epMap: Record<string, any[]> = {};
    sorted.forEach((s: any) => {
      const eps: any[] = s.episodes || [];
      if (eps.length > 0) {
        epMap[s._id] = [...eps].sort((a: any, b: any) => a.episodeNumber - b.episodeNumber);
      }
    });
    if (Object.keys(epMap).length > 0) setEpisodes(epMap);
  };

  // ── Load episodes for a season (fallback if not populated inline) ─────────
  const loadEpisodes = async (seasonId: string) => {
    // Skip if already loaded
    if (episodes[seasonId]?.length > 0) return;
    try {
      setLoadingEp(seasonId);
      const res = await apiClient.adminGetEpisodesBySeason(seasonId);
      const eps = Array.isArray(res) ? res : (res?.data || []);
      setEpisodes((prev) => ({
        ...prev,
        [seasonId]: [...eps].sort((a: any, b: any) => a.episodeNumber - b.episodeNumber),
      }));
    } catch {
      setEpisodes((prev) => ({ ...prev, [seasonId]: [] }));
    } finally {
      setLoadingEp(null);
    }
  };

  const toggleSeason = (seasonId: string) => {
    if (openSeason === seasonId) {
      setOpenSeason(null);
    } else {
      setOpenSeason(seasonId);
      loadEpisodes(seasonId);
    }
  };

  // Auto-load episodes for the open season when seasons are first set
  useEffect(() => {
    if (openSeason && !episodes[openSeason]) {
      loadEpisodes(openSeason);
    }
  }, [openSeason]);

  // ── Favorites / Watchlist ─────────────────────────────────────────────────
  const toggleFav = async () => {
    try {
      if (isFavorite) { await apiClient.removeFromFavorites(id!); setIsFavorite(false); toast.success('Removed from favorites'); }
      else { await apiClient.addToFavorites(id!); setIsFavorite(true); toast.success('Added to favorites'); }
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); }
  };

  const toggleWl = async () => {
    try {
      if (isWatchlisted) { await apiClient.removeFromWatchlist(id!); setIsWatchlisted(false); toast.success('Removed from watchlist'); }
      else { await apiClient.addToWatchlist(id!); setIsWatchlisted(true); toast.success('Added to watchlist'); }
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); }
  };

  // ── Submit rating ─────────────────────────────────────────────────────────
  const submitRating = async () => {
    if (!myRating) { toast.error('Select a rating first'); return; }
    try {
      setSubmitting(true);
      await apiClient.addOrUpdateRating(id!, { rating: myRating, review: myReview });
      toast.success('Rating saved');
      setRatingOpen(false);
      // Refresh ratings
      const rRes = await apiClient.getContentRatings(id!);
      const rData = rRes?.ratings || rRes?.data || (Array.isArray(rRes) ? rRes : []);
      setRatings(Array.isArray(rData) ? rData : []);
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to submit'); }
    finally { setSubmitting(false); }
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!profileToken) return null;

  if (loading) return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center">
      <Loader size={40} className="text-brand-500 animate-spin" />
    </div>
  );

  if (error || !content) return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-4">
      <div className="text-center">
        <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
        <p className="text-red-400 mb-4">{error || 'Content not found'}</p>
        <button onClick={() => navigate('/browse')} className="btn-primary">Back to Browse</button>
      </div>
    </div>
  );

  const isSeries = content.type === 'series' || content.type === 'Series';
  const poster   = content.poster || content.posterUrl;
  const avgRating = ratings.length > 0
    ? (ratings.reduce((s: number, r: any) => s + (r.rating || 0), 0) / ratings.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-ink-950">

      {/* ── Hero ── */}
      <section className="relative min-h-[480px] flex items-end overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img src={poster} alt={content.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/60 to-ink-950/20" />
        </div>

        {/* Back */}
        <div className="absolute top-6 left-4 sm:left-6 lg:left-12 z-10">
          <button onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg glass border border-ink-600 text-white hover:bg-white/10 transition-colors text-sm">
            ← Back
          </button>
        </div>

        {/* Info */}
        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-12 pb-8">
          <div className="max-w-4xl flex items-end gap-6">
            {/* Poster */}
            {poster && (
              <img src={poster} alt={content.title}
                className="hidden sm:block w-36 h-52 rounded-xl object-cover shadow-2xl flex-shrink-0 border border-ink-600" />
            )}
            <div className="flex-1">
              <h1 className="text-3xl sm:text-5xl font-bold text-white mb-3 leading-tight">{content.title}</h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
                {content.releaseYear && <span className="flex items-center gap-1 text-gray-300"><Calendar size={14} />{content.releaseYear}</span>}
                {content.ageRating  && <span className="px-2 py-0.5 border border-gray-500 rounded text-xs text-gray-300">{content.ageRating}</span>}
                {content.type       && <span className="px-2 py-0.5 bg-brand-500/20 border border-brand-500/50 rounded text-xs text-brand-300 uppercase">{content.type}</span>}
                {isSeries && content.totalSeasons && <span className="flex items-center gap-1 text-gray-300"><Users size={14} />{content.totalSeasons} Season{content.totalSeasons !== 1 ? 's' : ''}</span>}
                {!isSeries && content.duration && <span className="flex items-center gap-1 text-gray-300"><Clock size={14} />{content.duration} min</span>}
                {avgRating && <span className="flex items-center gap-1 text-yellow-400 font-semibold"><Star size={14} className="fill-yellow-400" />{avgRating}</span>}
              </div>

              <p className="text-gray-300 line-clamp-2 mb-5 max-w-2xl">{content.description}</p>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {isSeries ? (
                  <button onClick={() => setTab('episodes')}
                    className="btn-primary text-base px-7 py-3 inline-flex items-center gap-2">
                    <Play size={20} className="fill-white" /> View Episodes
                  </button>
                ) : (
                  <button onClick={() => navigate(`/watch/${id}`)}
                    className="btn-primary text-base px-7 py-3 inline-flex items-center gap-2">
                    <Play size={20} className="fill-white" /> Watch Now
                  </button>
                )}
                <button onClick={toggleWl}
                  className={`btn-ghost px-4 py-2.5 inline-flex items-center gap-2 ${isWatchlisted ? 'border-brand-500 text-brand-300' : ''}`}>
                  {isWatchlisted ? <Check size={18} /> : <Plus size={18} />}
                  {isWatchlisted ? 'In Watchlist' : 'Watchlist'}
                </button>
                <button onClick={toggleFav}
                  className={`btn-ghost px-4 py-2.5 inline-flex items-center gap-2 ${isFavorite ? 'border-red-500 text-red-400' : ''}`}>
                  <Heart size={18} className={isFavorite ? 'fill-current' : ''} />
                  {isFavorite ? 'Favorited' : 'Favorite'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tabs ── */}
      <div className="sticky top-16 z-20 bg-ink-950/95 backdrop-blur-sm border-b border-ink-700 px-4 sm:px-6 lg:px-12">
        <div className="flex gap-0 max-w-6xl mx-auto">
          {(['overview', ...(isSeries ? ['episodes'] : []), 'ratings'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-4 text-sm font-medium border-b-2 transition-colors capitalize ${
                tab === t ? 'border-brand-500 text-white' : 'border-transparent text-gray-400 hover:text-white'
              }`}>
              {t === 'episodes' ? `Episodes${seasons.length > 0 ? ` (${seasons.length} season${seasons.length !== 1 ? 's' : ''})` : ''}` :
               t === 'ratings' && ratings.length > 0 ? `Ratings (${ratings.length})` :
               t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 sm:px-6 lg:px-12 py-10 max-w-6xl mx-auto">

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <div>
                <h2 className="text-xl font-bold text-white mb-3">Description</h2>
                <p className="text-gray-300 leading-relaxed">{content.description}</p>
              </div>

              {/* Genres */}
              {content.genres?.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-3">Genres</h2>
                  <div className="flex flex-wrap gap-2">
                    {content.genres.map((g: any) => (
                      <span key={g._id || g.name} className="px-3 py-1 rounded-full bg-ink-800 border border-ink-600 text-gray-300 text-sm">
                        {g.name || g}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cast */}
              {content.casts?.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-3">Cast</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {content.casts.slice(0, 6).map((c: any) => (
                      <div key={c._id} className="flex items-center gap-3 bg-ink-800/50 rounded-lg p-3">
                        <div className="w-10 h-10 rounded-full bg-ink-700 overflow-hidden flex-shrink-0">
                          {c.actor?.profileImage
                            ? <img src={c.actor.profileImage} alt={c.actor?.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-bold">
                                {c.actor?.name?.[0] || '?'}
                              </div>
                          }
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{c.actor?.name || '—'}</p>
                          {c.characterName && <p className="text-gray-500 text-xs">{c.characterName}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div>
              <div className="glass rounded-xl border border-ink-600 p-5 space-y-4 sticky top-24">
                {poster && (
                  <img src={poster} alt={content.title} className="w-full rounded-lg object-cover aspect-[2/3] mb-4" />
                )}
                {[
                  ['Release Year', content.releaseYear],
                  ['Type',         content.type?.toUpperCase()],
                  ['Age Rating',   content.ageRating],
                  ['Duration',     !isSeries && content.duration ? `${content.duration} min` : null],
                  ['Seasons',      isSeries && content.totalSeasons ? content.totalSeasons : null],
                  ['Views',        content.viewsCount?.toLocaleString()],
                  ['Avg Rating',   avgRating ? `${avgRating} / 10` : null],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k as string}>
                    <p className="text-xs text-gray-500 uppercase mb-0.5">{k}</p>
                    <p className="text-white font-semibold text-sm">{v}</p>
                  </div>
                ))}
                <button onClick={() => setRatingOpen(true)} className="btn-primary w-full mt-2 text-sm">
                  {myRating ? '✏️ Update My Rating' : '⭐ Rate This'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EPISODES */}
        {tab === 'episodes' && isSeries && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Episodes</h2>
              {seasons.length > 0 && (
                <span className="text-gray-400 text-sm">{seasons.length} season{seasons.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            {seasons.length === 0 ? (
              <div className="text-center py-16 glass rounded-xl border border-ink-600">
                <div className="text-5xl mb-4">📺</div>
                <p className="text-gray-300 font-semibold mb-2">No seasons available</p>
                <p className="text-gray-500 text-sm">Episodes haven't been added yet or are not yet published.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {seasons.map((season: any) => (
                  <div key={season._id} className="glass rounded-xl border border-ink-600 overflow-hidden">
                    {/* Season header */}
                    <button onClick={() => toggleSeason(season._id)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-300 text-sm font-bold flex items-center justify-center">
                          {season.seasonNumber}
                        </span>
                        <div className="text-left">
                          <p className="text-white font-semibold">Season {season.seasonNumber}{season.title ? ` — ${season.title}` : ''}</p>
                          {episodes[season._id] && (
                            <p className="text-gray-500 text-xs">{episodes[season._id].length} episode{episodes[season._id].length !== 1 ? 's' : ''}</p>
                          )}
                        </div>
                      </div>
                      {openSeason === season._id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                    </button>

                    {/* Episode list */}
                    {openSeason === season._id && (
                      <div className="border-t border-ink-700">
                        {loadingEp === season._id ? (
                          <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                            <Loader size={18} className="animate-spin" /> Loading episodes…
                          </div>
                        ) : (episodes[season._id] || []).length === 0 ? (
                          <p className="text-gray-500 text-center py-8 text-sm">No episodes yet.</p>
                        ) : (
                          <div className="divide-y divide-ink-800/50">
                            {(episodes[season._id] || []).map((ep: any) => (
                              <div key={ep._id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors">
                                <div className="w-10 h-10 rounded-lg bg-ink-800 flex items-center justify-center flex-shrink-0 text-gray-400 font-bold text-sm">
                                  {ep.episodeNumber}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-medium truncate">{ep.title || `Episode ${ep.episodeNumber}`}</p>
                                  {ep.description && <p className="text-gray-500 text-xs line-clamp-1 mt-0.5">{ep.description}</p>}
                                  {ep.duration && <p className="text-gray-600 text-xs mt-0.5 flex items-center gap-1"><Clock size={11} />{ep.duration} min</p>}
                                </div>
                                {ep.videoUrl && (
                                  <button
                                    onClick={() => navigate(`/watch/${ep._id}?type=episode`)}
                                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-medium transition-all">
                                    <Play size={12} className="fill-white" /> Play
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RATINGS */}
        {tab === 'ratings' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Ratings & Reviews</h2>
              <button onClick={() => setRatingOpen(true)} className="btn-primary text-sm px-4 py-2">
                {myRating ? '✏️ Edit My Rating' : '⭐ Add Rating'}
              </button>
            </div>

            {ratings.length === 0 ? (
              <div className="text-center py-16">
                <Star size={48} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">No ratings yet. Be the first to rate!</p>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="glass rounded-xl border border-ink-600 p-6 mb-6 flex flex-col sm:flex-row items-center gap-6">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-yellow-400">{avgRating}</p>
                    <p className="text-gray-400 text-sm mt-1">out of 10</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                        <div key={n} className={`h-2 flex-1 rounded-full ${n <= Math.round(Number(avgRating)) ? 'bg-yellow-400' : 'bg-ink-700'}`} />
                      ))}
                    </div>
                    <p className="text-gray-400 text-sm">{ratings.length} rating{ratings.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                {/* Reviews grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ratings.map((r: any) => (
                    <div key={r._id} className="glass rounded-xl border border-ink-600 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {[1,2,3,4,5].map((s) => (
                            <Star key={s} size={14} className={s <= Math.round((r.rating || 0) / 2) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'} />
                          ))}
                          <span className="text-yellow-400 font-bold text-sm ml-1">{r.rating}/10</span>
                        </div>
                        <span className="text-gray-600 text-xs">
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                      {r.review && <p className="text-gray-300 text-sm leading-relaxed">{r.review}</p>}
                      {r.profileId?.name && <p className="text-gray-600 text-xs mt-2">— {r.profileId.name}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Related */}
      {related.length > 0 && <ContentRow title="You Might Also Like" items={related} />}

      {/* Rating Modal */}
      {ratingOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setRatingOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-ink-850 rounded-2xl p-6 border border-ink-600 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-5">Rate This Content</h2>

            {/* 1-10 rating */}
            <div className="mb-5">
              <p className="text-sm text-gray-400 mb-3">Your Rating (1–10)</p>
              <div className="flex gap-1.5 flex-wrap">
                {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                  <button key={n} onClick={() => setMyRating(n)}
                    className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                      n <= myRating ? 'bg-yellow-400 text-black' : 'bg-ink-800 text-gray-400 hover:bg-ink-700'
                    }`}>
                    {n}
                  </button>
                ))}
              </div>
              {myRating > 0 && <p className="text-yellow-400 text-xs mt-2">{myRating}/10</p>}
            </div>

            <div className="mb-5">
              <label className="text-sm text-gray-400 mb-2 block">Review (optional)</label>
              <textarea value={myReview} onChange={(e) => setMyReview(e.target.value)}
                placeholder="Share your thoughts…" rows={3} maxLength={500}
                className="w-full px-3 py-2 rounded-lg bg-ink-800 border border-ink-600 text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none resize-none text-sm" />
              <p className="text-xs text-gray-600 mt-1">{myReview.length}/500</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setRatingOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-ink-600 text-gray-400 hover:text-white transition-colors text-sm">
                Cancel
              </button>
              <button onClick={submitRating} disabled={submitting || !myRating}
                className="flex-1 btn-primary text-sm disabled:opacity-50">
                {submitting ? 'Saving…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
