import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Settings, User, LayoutDashboard } from 'lucide-react';
import { useProfile } from '@/lib/profileContext';
import { useAuth } from '@/lib/authContext';
import { useToast } from '@/lib/useToast';
import { apiClient } from '@/lib/apiClient';
import { getInitials } from '@/lib/utils';

export default function Navbar() {
  const navigate = useNavigate();
  const toast = useToast();
  const { profileToken, currentProfile } = useProfile();
  const { isAuthenticated, userName, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isLoggedIn = !!profileToken && !!currentProfile;
  const displayName = currentProfile?.name || userName || 'User';
  const isAdmin = user?.role === 'super_admin';
  const isContentManager = user?.role === 'content_manager';
  const canUpload = isAdmin || isContentManager;

  // Detect scroll for navbar background change
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await apiClient.logout();
      toast.success('Logged out successfully');
      window.location.href = '/login';
    } catch (err) {
      toast.error('Error logging out');
    }
  };

  const handleProfileClick = () => {
    navigate('/profiles');
    setShowProfileMenu(false);
    setIsOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-ink-950/95 backdrop-blur-md border-b border-ink-800 shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="px-4 sm:px-6 lg:px-12 h-16 flex items-center justify-between max-w-full">
        {/* Logo */}
        <button onClick={() => navigate('/')} className="flex items-center gap-1 flex-shrink-0 hover:opacity-80 transition-opacity">
          <span className="text-brand-500 text-xl sm:text-2xl font-bold tracking-wider">STREAM</span>
          <span className="text-white text-xl sm:text-2xl font-bold tracking-wider">FLIX</span>
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <button 
            onClick={() => navigate('/')} 
            className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
          >
            Home
          </button>
          
          {isLoggedIn && (
            <>
              <button 
                onClick={() => navigate('/browse')} 
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                Browse
              </button>
              <button 
                onClick={() => navigate('/favorites')} 
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                Favorites
              </button>
              <button 
                onClick={() => navigate('/watchlist')} 
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                My List
              </button>
            </>
          )}

          <button 
            onClick={() => navigate('/plans')} 
            className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
          >
            Plans
          </button>

          <button 
            onClick={() => navigate('/ratings')} 
            className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
          >
            Ratings
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 sm:gap-4">
          {isLoggedIn ? (
            // User Menu (Logged In)
            <div className="relative hidden sm:block">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md"
                  style={{ backgroundColor: currentProfile?.avatar || '#ec4899' }}
                >
                  {getInitials(currentProfile?.name || 'U')}
                </div>
                <span className="text-xs sm:text-sm text-gray-300 truncate max-w-[100px]">
                  {displayName}
                </span>
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-ink-850/95 backdrop-blur-md rounded-lg border border-ink-600 shadow-2xl overflow-hidden animate-scaleIn">
                  <div className="p-4 border-b border-ink-600 bg-ink-900/50">
                    <p className="text-xs text-gray-500 mb-1">Signed in as</p>
                    <p className="text-sm text-white font-semibold">{displayName}</p>
                    {isAdmin && <p className="text-xs text-brand-400 mt-0.5">Super Admin</p>}
                    {isContentManager && <p className="text-xs text-purple-400 mt-0.5">Content Manager</p>}
                  </div>

                  <div className="space-y-1 p-2">
                    <button
                      onClick={handleProfileClick}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-ink-700/50 rounded transition-colors"
                    >
                      <User size={16} />
                      Switch Profile
                    </button>
                    <button
                      onClick={() => {
                        navigate('/account');
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-ink-700/50 rounded transition-colors"
                    >
                      <Settings size={16} />
                      Account Settings
                    </button>
                    <button
                      onClick={() => {
                        navigate('/subscription');
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-ink-700/50 rounded transition-colors"
                    >
                      <span>💳</span>
                      Subscription
                    </button>
                    {isAdmin && (
                      <>
                        <hr className="my-1 border-ink-600" />
                        <button
                          onClick={() => { navigate('/admin'); setShowProfileMenu(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-brand-400 hover:text-brand-300 hover:bg-brand-500/10 rounded transition-colors font-medium"
                        >
                          <LayoutDashboard size={16} />
                          Admin Dashboard
                        </button>
                      </>
                    )}
                    {canUpload && (
                      <>
                        {!isAdmin && <hr className="my-1 border-ink-600" />}
                        <button
                          onClick={() => { navigate('/admin/upload'); setShowProfileMenu(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded transition-colors font-medium"
                        >
                          <span>⬆️</span>
                          Upload Content
                        </button>
                      </>
                    )}
                    <hr className="my-2 border-ink-600" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-error-400 hover:text-error-300 hover:bg-error-500/10 rounded transition-colors"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Auth Buttons (Not Logged In)
            <div className="hidden sm:flex items-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                دخول
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors shadow-md"
              >
                إنشاء حساب
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="sm:hidden text-gray-300 hover:text-white transition-colors p-1"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="sm:hidden bg-ink-900/95 backdrop-blur-md border-t border-ink-800 animate-slideDown">
          <div className="px-4 py-4 space-y-2 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <button
              onClick={() => {
                navigate('/');
                setIsOpen(false);
              }}
              className="block w-full text-left px-4 py-2.5 text-gray-300 hover:text-white hover:bg-ink-700/50 rounded transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => {
                navigate('/plans');
                setIsOpen(false);
              }}
              className="block w-full text-left px-4 py-2.5 text-gray-300 hover:text-white hover:bg-ink-700/50 rounded transition-colors"
            >
              Plans
            </button>
            <button
              onClick={() => {
                navigate('/ratings');
                setIsOpen(false);
              }}
              className="block w-full text-left px-4 py-2.5 text-gray-300 hover:text-white hover:bg-ink-700/50 rounded transition-colors"
            >
              Ratings
            </button>

            {isLoggedIn && (
              <>
                <hr className="my-2 border-ink-600" />
                <button
                  onClick={() => { navigate('/browse'); setIsOpen(false); }}
                  className="block w-full text-left px-4 py-2.5 text-gray-300 hover:text-white hover:bg-ink-700/50 rounded transition-colors"
                >
                  Browse
                </button>
                <button
                  onClick={() => { navigate('/favorites'); setIsOpen(false); }}
                  className="block w-full text-left px-4 py-2.5 text-gray-300 hover:text-white hover:bg-ink-700/50 rounded transition-colors"
                >
                  Favorites
                </button>
                <button
                  onClick={() => { navigate('/watchlist'); setIsOpen(false); }}
                  className="block w-full text-left px-4 py-2.5 text-gray-300 hover:text-white hover:bg-ink-700/50 rounded transition-colors"
                >
                  My List
                </button>
                <hr className="my-2 border-ink-600" />
                <button
                  onClick={handleProfileClick}
                  className="block w-full text-left px-4 py-2.5 text-gray-300 hover:text-white hover:bg-ink-700/50 rounded transition-colors"
                >
                  Switch Profile
                </button>
                <button
                  onClick={() => { navigate('/account'); setIsOpen(false); }}
                  className="block w-full text-left px-4 py-2.5 text-gray-300 hover:text-white hover:bg-ink-700/50 rounded transition-colors"
                >
                  Account Settings
                </button>
                <button
                  onClick={() => { navigate('/subscription'); setIsOpen(false); }}
                  className="block w-full text-left px-4 py-2.5 text-gray-300 hover:text-white hover:bg-ink-700/50 rounded transition-colors"
                >
                  Subscription
                </button>
                {isAdmin && (
                  <button
                    onClick={() => { navigate('/admin'); setIsOpen(false); }}
                    className="block w-full text-left px-4 py-2.5 text-brand-400 hover:text-brand-300 hover:bg-brand-500/10 rounded transition-colors font-medium"
                  >
                    Admin Dashboard
                  </button>
                )}
                <hr className="my-2 border-ink-600" />
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2.5 text-error-400 hover:text-error-300 hover:bg-error-500/10 rounded transition-colors font-medium"
                >
                  Logout
                </button>
              </>
            )}

            {!isLoggedIn && (
              <>
                <hr className="my-2 border-ink-600" />
                <button
                  onClick={() => { navigate('/login'); setIsOpen(false); }}
                  className="block w-full text-left px-4 py-2.5 text-gray-300 hover:text-white hover:bg-ink-700/50 rounded transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { navigate('/register'); setIsOpen(false); }}
                  className="block w-full text-left px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded transition-colors font-medium"
                >
                  Create Account
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
