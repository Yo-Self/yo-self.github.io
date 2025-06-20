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
    </div>
  );
}
