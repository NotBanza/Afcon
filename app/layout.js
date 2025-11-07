import './fonts.css';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MuiRoot from '@/components/MuiRoot';

export const metadata = {
  title: 'African Nations League 2026',
  description: 'UCT INF4001N Entrance Project',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-anl-ink text-anl-ivory antialiased">
        <MuiRoot>
          <div className="relative min-h-screen bg-anl-radial">
            <div className="pointer-events-none absolute inset-0 bg-anl-stripe opacity-40 mix-blend-soft-light" />
            <div className="relative z-10 flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">
                <div className="container py-10 sm:py-14">
                  {children}
                </div>
              </main>
              <Footer />
            </div>
          </div>
        </MuiRoot>
      </body>
    </html>
  );
}