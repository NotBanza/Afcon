import HeroSection from '@/components/HeroSection';
import LiveStats from '@/components/LiveStats';
import FlagsShowcase from '@/components/FlagsShowcase';

export default function HomePage() {
  return (
    <div className="space-y-16 pb-20">
      <HeroSection />
      <LiveStats />
      <FlagsShowcase />
    </div>
  );
}