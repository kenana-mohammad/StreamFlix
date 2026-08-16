import { Routes, Route, Navigate } from 'react-router-dom';
import PublicRoute from './PublicRoute';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import { MainLayout } from '@/layouts/MainLayout';

// Public Pages (no auth needed)
import HomePage from '@/pages/HomePage';
import AllMoviesPage from '@/pages/AllMoviesPage';
import AllSeriesPage from '@/pages/AllSeriesPage';
import AllTopRatedPage from '@/pages/AllTopRatedPage';
import AllPlansPage from '@/pages/AllPlansPage';
import PlanDetailsPage from '@/pages/PlanDetailsPage';
import AuthPage from '@/pages/AuthPage';
import ContentRatingsPage from '@/pages/ContentRatingsPage';
import PublicContentDetailsPage from '@/pages/PublicContentDetailsPage';

// Auth Protected Pages (need auth cookie)
import ProfilesPage from '@/pages/ProfilesPage';

// Profile Protected Pages (need auth + profile token)
import BrowsePage from '@/pages/BrowsePage';
import ContentDetailsPage from '@/pages/ContentDetailsPage';
import WatchPage from '@/pages/WatchPage';
import CollectionPage from '@/pages/CollectionPage';
import SubscriptionPage from '@/pages/SubscriptionPage';
import RecommendationsPage from '@/pages/RecommendationsPage';
import AccountPage from '@/pages/AccountPage';
import DevicesPage from '@/pages/DevicesPage';
import CreateProfilePage from '@/pages/CreateProfilePage';

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminAnalytics from '@/pages/admin/AdminAnalytics';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminContent from '@/pages/admin/AdminContent';
import AdminPlans from '@/pages/admin/AdminPlans';
import AdminSubscriptions from '@/pages/admin/AdminSubscriptions';
import AdminRatings from '@/pages/admin/AdminRatings';

export function AppRoutes() {
  return (
    <Routes>
      {/* ==================== PUBLIC ROUTES ==================== */}
      <Route path="/" element={<HomePage />} />
      <Route path="/all-movies" element={<AllMoviesPage />} />
      <Route path="/all-series" element={<AllSeriesPage />} />
      <Route path="/all-toprated" element={<AllTopRatedPage />} />

      {/* Plans - No auth needed */}
      <Route path="/plans" element={<AllPlansPage />} />
      <Route path="/plan-details/:planId" element={<PlanDetailsPage />} />

      {/* Content Ratings - No auth needed */}
      <Route path="/ratings" element={<ContentRatingsPage />} />

      {/* Public Content Details - No auth needed */}
      <Route path="/content-details/:id" element={<PublicContentDetailsPage />} />

      {/* Auth Pages - No auth needed */}
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />

      {/* ==================== AUTH PROTECTED ROUTES ==================== */}
      {/* Profile Selection - requires auth cookie only */}
      <Route
        path="/profiles"
        element={
          <ProtectedRoute requireProfile={false}>
            <ProfilesPage />
          </ProtectedRoute>
        }
      />

      {/* Create Profile - requires auth cookie only (no profile token needed) */}
      <Route
        path="/create-profile"
        element={
          <ProtectedRoute requireProfile={false}>
            <CreateProfilePage />
          </ProtectedRoute>
        }
      />

      {/* ==================== PROFILE PROTECTED ROUTES ==================== */}
      {/* Protected Content Routes - require both auth cookie AND profile token */}
      <Route
        element={
          <ProtectedRoute requireProfile={true}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/content/:id" element={<ContentDetailsPage />} />
        <Route path="/watch/:id" element={<WatchPage />} />
        <Route path="/favorites" element={<CollectionPage mode="favorites" />} />
        <Route path="/watchlist" element={<CollectionPage mode="watchlist" />} />
        <Route path="/history" element={<CollectionPage mode="history" />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/devices" element={<DevicesPage />} />
      </Route>

      {/* ==================== ADMIN ROUTES ==================== */}
      <Route
        element={
          <ProtectedRoute requireProfile={true}>
            <MainLayout isAdmin />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/content" element={<AdminContent />} />
        <Route path="/admin/plans" element={<AdminPlans />} />
        <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
        <Route path="/admin/ratings" element={<AdminRatings />} />
      </Route>

      {/* ==================== CATCH ALL ==================== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
