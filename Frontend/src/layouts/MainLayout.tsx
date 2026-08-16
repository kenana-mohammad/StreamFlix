import { Outlet } from 'react-router-dom';
import { useProfile } from '@/lib/profileContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ContentModal from '@/components/ContentModal';
import Toast from '@/components/Toast';

interface MainLayoutProps {
  isAdmin?: boolean;
}

export function MainLayout({ isAdmin }: MainLayoutProps) {
  const { currentProfile, profileToken } = useProfile();

  // التحقق من أن المستخدم لديه Profile Token
  if (!profileToken || !currentProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-ink-950 flex flex-col">
      <Navbar />
      <main className="pt-16 flex-1">
        <Outlet />
      </main>
      <Footer />
      <ContentModal />
      <Toast />
    </div>
  );
}

export default MainLayout;
