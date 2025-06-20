import Header from "@/components/Header";
import Carousel from "@/components/Carousel";
import MenuSection from "@/components/MenuSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-text">
      <Header />
      <Carousel />
      <MenuSection />
      {/* Modal will be added here */}
      {/* Modern Floating Search Button */}
      <button
        className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom)+1.5rem)] right-[max(1.5rem,env(safe-area-inset-right)+1.5rem)] z-50 w-16 h-16 rounded-full bg-white/80 dark:bg-gray-900/80 border-2 border-white dark:border-gray-800 shadow-2xl backdrop-blur-md flex items-center justify-center transition-transform duration-150 hover:scale-110 active:scale-95 hover:shadow-3xl focus:outline-none"
        style={{ WebkitBackdropFilter: 'blur(12px)' }}
        aria-label="Search"
      >
        <svg width="34" height="34" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" className="text-gray-900 dark:text-white">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
    </div>
  );
}
