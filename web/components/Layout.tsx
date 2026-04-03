import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen text-white flex flex-col relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-indigo-950 -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(37,99,235,0.08),_transparent_50%)] -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(6,182,212,0.05),_transparent_50%)] -z-10" />

      <Navbar />
      <main className="flex-1 pt-16 relative">
        {children}
      </main>
      <Footer />
    </div>
  );
}
