import { Outlet } from 'react-router-dom';
import ParticleBackground from '@/components/ParticleBackground';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <ParticleBackground />
      <Navbar />
      <main className="flex-1 relative z-10 pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
