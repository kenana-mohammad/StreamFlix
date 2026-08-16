import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { useToast } from '@/lib/useToast';
import { apiClient } from '@/lib/apiClient';
import AllPlansPage from '@/pages/AllPlansPage';

/**
 * PlansPage is now replaced with AllPlansPage which works without authentication
 * This component redirects to AllPlansPage for consistency
 */
export default function PlansPage() {
  return <AllPlansPage />;
}
