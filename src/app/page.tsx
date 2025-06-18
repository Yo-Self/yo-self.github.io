import Header from "@/components/Header";
import WelcomeSection from "@/components/WelcomeSection";
import Carousel from "@/components/Carousel";
import MenuSection from "@/components/MenuSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-text">
      <Header />
      <WelcomeSection />
      <Carousel />
      <MenuSection />
      {/* Menu, Modal, etc. will be added here */}
    </div>
  );
}
