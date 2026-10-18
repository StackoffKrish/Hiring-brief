import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Pricing from "@/components/landing/Pricing";
import About from "@/components/landing/About";

export default function Home() {
  return (
    <main>
      <Hero id="home" />
      <Features id="features" />
      <Pricing id="pricing" />
      <About id="about" />
    </main>
  );
}
