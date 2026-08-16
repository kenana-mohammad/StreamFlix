import { useState, useEffect } from 'react';
import { AlertCircle, Loader, ChevronLeft, ChevronRight, Eye, TrendingUp, Sparkles, Clock, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/lib/useToast';
import { useAuth } from '@/lib/authContext';
import { useProfile } from '@/lib/profileContext';
import { apiClient } from '@/lib/apiClient';
import { normalizeContentArray } from '@/lib/utils';
import HeroBanner from '@/components/HeroBanner';
import ContentCard from '@/components/ContentCard';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function HomePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  const { profileToken } = useProfile();

  const [homeContent, setHomeContent] = useState<any>(null);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const [myList, setMyList] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scrollPositions, setScrollPositions] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    loadHomeData();
  }, [isAuthenticated, profileToken]);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      setError('');

      // جلب البيانات العامة من Home API
      const homeData = await apiClient.getHomeContent();
      
      // Normalize home data
      const normalizedHome = {
        latestMovies: normalizeContentArray(homeData?.latestMovies || []),
        latestSeries: normalizeContentArray(homeData?.latestSeries || []),
        topRated: normalizeContentArray(homeData?.topRated || []),
        smartRecommendation: normalizeContentArray(homeData?.smartRecommendation || [])
      };
      
      setHomeContent(normalizedHome);

      // إذا كان المستخدم مسجل دخول ولديه profile token
      if (isAuthenticated && profileToken) {
        await Promise.all([
          loadContinueWatching(),
          loadMyList(),
          loadFavorites(),
          loadRecommendations(),
        ]);
      } else {
        // جلب الخطط للضيف
        const plansRes = await apiClient.getActivePlans();
        const plansData = Array.isArray(plansRes) ? plansRes : (plansRes?.data || []);
        setPlans(Array.isArray(plansData) ? plansData.slice(0, 3) : []);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load content';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadContinueWatching = async () => {
    try {
      const res = await apiClient.getWatchHistory();
      const data = Array.isArray(res) ? res : (res?.data || res);
      // احصل على المراقبة غير المكتملة فقط
      const incomplete = Array.isArray(data) ? data.filter((item: any) => !item.completed).slice(0, 6) : [];
      setContinueWatching(incomplete);
    } catch (err) {
      // صامت في حالة الخطأ
      console.error('Failed to load watch history:', err);
    }
  };

  const loadMyList = async () => {
    try {
      const res = await apiClient.getWatchlist();
      const data = Array.isArray(res) ? res : (res?.data || res);
      const items = Array.isArray(data) ? data.slice(0, 6) : [];
      setMyList(items);
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    }
  };

  const loadFavorites = async () => {
    try {
      const res = await apiClient.getFavorites();
      const data = Array.isArray(res) ? res : (res?.data || res);
      const items = Array.isArray(data) ? data.slice(0, 6) : [];
      setFavorites(items);
    } catch (err) {
      console.error('Failed to load favorites:', err);
    }
  };

  const loadRecommendations = async () => {
    try {
      const res = await apiClient.getRecommendations();
      const data = Array.isArray(res) ? res : (res?.data || res);
      const items = Array.isArray(data) ? data.slice(0, 6) : [];
      setRecommendations(items);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    }
  };

  const handleRetry = () => {
    loadHomeData();
  };

  const handleViewAll = (type: 'movies' | 'series' | 'toprated') => {
    if (type === 'movies') {
      navigate('/all-movies');
    } else if (type === 'series') {
      navigate('/all-series');
    } else {
      navigate('/all-toprated');
    }
  };

  // Helper to select hero content
  const getHeroContent = () => {
    // Priority: topRated[0] > latestMovies[0] > latestSeries[0]
    if (homeContent?.topRated?.length > 0) {
      return homeContent.topRated[0];
    }
    if (homeContent?.latestMovies?.length > 0) {
      return homeContent.latestMovies[0];
    }
    if (homeContent?.latestSeries?.length > 0) {
      return homeContent.latestSeries[0];
    }
    return null;
  };

  // Scroll handlers for horizontal carousels
  const handleScroll = (sectionId: string, direction: 'left' | 'right') => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      const scrollAmount = 400;
      const newPosition = (scrollPositions[sectionId] || 0) + (direction === 'left' ? -scrollAmount : scrollAmount);
      element.scrollLeft = newPosition;
      setScrollPositions((prev) => ({ ...prev, [sectionId]: newPosition }));
    }
  };

  // Helper component for rendering content sections
  const ContentSection = ({ 
    title, 
    items, 
    sectionId, 
    showViewAll = true,
    viewAllPath,
    icon: Icon = null
  }: {
    title: string;
    items: any[];
    sectionId: string;
    showViewAll?: boolean;
    viewAllPath?: string;
    icon?: any;
  }) => {
    if (!items || items.length === 0) return null;

    const [favs, setFavs] = useState<string[]>([]);

    useEffect(() => {
      const loadFavs = async () => {
        if (isAuthenticated && profileToken) {
          try {
            const res = await apiClient.getFavorites();
            const favData = Array.isArray(res) ? res : (res?.data || res);
            const favIds = Array.isArray(favData) 
              ? favData.map((f: any) => f.contentId?._id || f._id || f.contentId) 
              : [];
            setFavs(favIds);
          } catch (err) {
            console.error('Failed to load favorites:', err);
          }
        }
      };
      loadFavs();
    }, [isAuthenticated, profileToken]);

    const handleToggleFavorite = async (contentId: string) => {
      if (!isAuthenticated || !profileToken) {
        toast.error('Please login to add favorites');
        navigate('/login');
        return;
      }

      try {
        if (favs.includes(contentId)) {
          await apiClient.removeFromFavorites(contentId);
          setFavs(favs.filter((id) => id !== contentId));
          toast.success('Removed from favorites');
        } else {
          await apiClient.addToFavorites(contentId);
          setFavs([...favs, contentId]);
          toast.success('Added to favorites');
        }
      } catch (err: any) {
        toast.error('Failed to update favorites');
      }
    };

    return (
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8 px-4 sm:px-6 lg:px-0">
          <div className="flex items-center gap-3">
            {Icon && <Icon size={28} className="text-brand-500" />}
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{title}</h2>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative group px-4 sm:px-6 lg:px-0">
          <div
            id={`section-${sectionId}`}
            className="flex gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-3"
          >
            {items.slice(0, 10).map((item: any) => (
              <div key={item._id || item.id} className="flex-shrink-0 relative group/card">
                <ContentCard content={item} variant="default" />
                {/* Favorite Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(item._id);
                  }}
                  className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-brand-500/80 flex items-center justify-center transition-all opacity-0 group-hover/card:opacity-100"
                  title={favs.includes(item._id) ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart
                    size={16}
                    className={
                      favs.includes(item._id)
                        ? 'fill-red-500 text-red-500'
                        : 'text-white'
                    }
                  />
                </button>
              </div>
            ))}
          </div>

          {/* Scroll Arrows */}
          <button
            onClick={() => handleScroll(sectionId, 'left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 z-10 w-12 h-12 rounded-full bg-brand-500/20 hover:bg-brand-500/40 backdrop-blur-md border border-brand-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
          <button
            onClick={() => handleScroll(sectionId, 'right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 z-10 w-12 h-12 rounded-full bg-brand-500/20 hover:bg-brand-500/40 backdrop-blur-md border border-brand-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
          >
            <ChevronRight size={24} className="text-white" />
          </button>
        </div>

        {/* Show More Button - يظهر دائماً */}
        {viewAllPath && (
          <div className="flex justify-center mt-8 px-4 sm:px-6 lg:px-0">
            <button
              onClick={() => navigate(viewAllPath)}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-brand-500 to-pink-500 hover:from-brand-600 hover:to-pink-600 text-white rounded-lg font-bold transition-all duration-300 shadow-lg hover:shadow-brand-500/50"
            >
              <span>View All {items.length > 10 ? `(${items.length})` : 'Content'}</span>
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </section>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <div className="text-center">
          <Loader size={40} className="text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading content...</p>
        </div>
      </div>
    );
  }

  const heroContent = getHeroContent();

  return (
    <div className="min-h-screen bg-ink-950 flex flex-col">
      {/* ==================== NAVBAR ==================== */}
      <Navbar />

      {/* Main Content Wrapper */}
      <main className="flex-grow">
        {/* ==================== HERO BANNER ==================== */}
        <div className="pt-24 sm:pt-28 lg:pt-32 pb-8 sm:pb-12 lg:pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <HeroBanner content={heroContent} loading={false} />
          </div>
        </div>

        {/* ==================== MAIN CONTENT ==================== */}
        <div className="pb-16 sm:pb-20 lg:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Error State */}
          {error && (
            <div className="mb-12 px-4 sm:px-6 lg:px-0 p-6 bg-error-500/10 border border-error-500/30 rounded-xl flex gap-4 justify-between items-center backdrop-blur-sm">
              <div className="flex gap-4">
                <AlertCircle size={24} className="text-error-500 flex-shrink-0 mt-0.5" />
                <p className="text-error-400 text-sm md:text-base">{error}</p>
              </div>
              <button
                onClick={handleRetry}
                className="px-6 py-2.5 bg-error-500 hover:bg-error-600 text-white rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
              >
                Try Again
              </button>
            </div>
          )}

          {/* ==================== AUTHENTICATED USER SECTIONS ==================== */}
          {isAuthenticated && profileToken && (
            <>
              {/* Continue Watching */}
              <ContentSection
                title="Continue Watching"
                items={continueWatching}
                sectionId="continueWatching"
                showViewAll={continueWatching.length > 0}
                viewAllPath="/history"
                icon={Clock}
              />

              {/* My List / Watchlist */}
              <ContentSection
                title="My List"
                items={myList}
                sectionId="myList"
                showViewAll={myList.length > 0}
                viewAllPath="/watchlist"
              />

              {/* Favorites */}
              <ContentSection
                title="My Favorites"
                items={favorites}
                sectionId="favorites"
                showViewAll={favorites.length > 0}
                viewAllPath="/favorites"
              />

              {/* Recommendations */}
              <ContentSection
                title="Recommended For You"
                items={recommendations}
                sectionId="recommendations"
                showViewAll={recommendations.length > 0}
                viewAllPath="/recommendations"
                icon={Sparkles}
              />
            </>
          )}

          {/* Latest Movies Section */}
          {homeContent?.latestMovies && homeContent.latestMovies.length > 0 && (
            <ContentSection
              title="Latest Movies"
              items={homeContent.latestMovies}
              sectionId="latestMovies"
              showViewAll
              viewAllPath="/all-movies"
            />
          )}

          {/* Latest Series Section */}
          {homeContent?.latestSeries && homeContent.latestSeries.length > 0 && (
            <ContentSection
              title="Latest Series"
              items={homeContent.latestSeries}
              sectionId="latestSeries"
              showViewAll
              viewAllPath="/all-series"
            />
          )}

          {/* Top Rated Section */}
          {homeContent?.topRated && homeContent.topRated.length > 0 && (
            <ContentSection
              title="Top Rated"
              items={homeContent.topRated}
              sectionId="topRated"
              showViewAll
              viewAllPath="/all-toprated"
              icon={TrendingUp}
            />
          )}

          {/* ==================== PLANS SECTION FOR GUEST ==================== */}
          {!isAuthenticated && plans.length > 0 && (
            <section className="mb-16">
              <div className="flex items-center justify-between mb-8 px-4 sm:px-6 lg:px-0">
                <h2 className="text-3xl sm:text-4xl font-bold text-white">Choose Your Plan</h2>
                <button
                  onClick={() => navigate('/plans')}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-brand-500 to-pink-500 hover:from-brand-600 hover:to-pink-600 text-white rounded-lg font-bold transition-all duration-300 shadow-lg hover:shadow-brand-500/50"
                >
                  <span>View All Plans</span>
                  <ChevronRight size={20} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-4 sm:px-6 lg:px-0">
                {plans.map((plan) => (
                  <div
                    key={plan._id}
                    className="relative bg-gradient-to-br from-ink-850 to-ink-900 border border-ink-600 hover:border-brand-500 rounded-xl p-8 hover:shadow-2xl hover:shadow-brand-500/20 transition-all duration-300 group"
                  >
                    {/* Highlighted Badge */}
                    {plan.highlighted && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-brand-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg">
                        RECOMMENDED
                      </div>
                    )}

                    <h3 className="text-2xl font-bold text-white mb-4">{plan.name}</h3>

                    <p className="text-4xl sm:text-5xl font-bold text-brand-500 mb-6">
                      <span>${plan.price}</span>
                      <span className="text-sm text-gray-400 font-normal ml-2">/month</span>
                    </p>

                    {plan.description && (
                      <p className="text-gray-300 text-sm mb-8 leading-relaxed">{plan.description}</p>
                    )}

                    {/* Features */}
                    <div className="text-sm text-gray-300 mb-8 space-y-3 border-t border-b border-ink-700 py-6">
                      {plan.quality && (
                        <p className="flex items-center gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                          <span>{plan.quality} Quality</span>
                        </p>
                      )}
                      {plan.maxDevices && (
                        <p className="flex items-center gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                          <span>{plan.maxDevices} Device{plan.maxDevices > 1 ? 's' : ''}</span>
                        </p>
                      )}
                      {plan.maxProfiles && (
                        <p className="flex items-center gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                          <span>{plan.maxProfiles} Profile{plan.maxProfiles > 1 ? 's' : ''}</span>
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => navigate('/login')}
                      className={`w-full px-6 py-3.5 rounded-lg font-bold transition-all duration-300 mt-6 text-base ${
                        plan.highlighted
                          ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg hover:shadow-brand-500/50'
                          : 'bg-ink-700 hover:bg-ink-600 text-gray-100 border border-ink-600'
                      }`}
                    >
                      Get Started
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Guest CTA Section */}
          {!isAuthenticated && (
            <section className="px-4 sm:px-6 lg:px-0 mt-16 lg:mt-24">
              <div className="relative px-8 sm:px-12 py-16 sm:py-20 bg-gradient-to-r from-brand-500/15 via-brand-500/10 to-transparent rounded-2xl border border-brand-500/30 backdrop-blur-sm overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl -z-10"></div>
                
                <div className="max-w-2xl relative z-10">
                  <h3 className="text-3xl sm:text-4xl font-bold text-white mb-5 leading-tight">
                    Ready to Start Watching?
                  </h3>
                  <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                    Join StreamFlix today and discover thousands of movies and series. Unlimited entertainment at your fingertips.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => navigate('/register')}
                      className="btn-primary flex justify-center items-center gap-2 px-8 py-4 text-lg font-bold shadow-lg hover:shadow-brand-500/50"
                    >
                      Create Account
                    </button>
                    <button
                      onClick={() => navigate('/login')}
                      className="btn-outline flex justify-center items-center gap-2 px-8 py-4 text-lg font-bold"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* No Content State */}
          {!homeContent?.latestMovies?.length &&
            !homeContent?.latestSeries?.length &&
            !homeContent?.topRated?.length && (
              <div className="text-center py-24">
                <Eye size={64} className="text-gray-600 mx-auto mb-6" />
                <p className="text-gray-400 text-2xl font-semibold mb-3">No content available</p>
                <p className="text-gray-500 text-lg">Please check back soon for more titles</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ==================== FOOTER ==================== */}
      <Footer />
    </div>
  );
}
