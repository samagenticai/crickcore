import { motion } from "framer-motion";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Hero from "../components/sections/Hero";
import TrustedBy from "../components/sections/TrustedBy";
import Features from "../components/sections/Features";
import LiveScoring from "../components/sections/LiveScoring";
import TournamentManagement from "../components/sections/TournamentManagement";
import Statistics from "../components/sections/Statistics";
import Screenshots from "../components/sections/Screenshots";
import Pricing from "../components/sections/Pricing";
import FAQ from "../components/sections/FAQ";
import Testimonials from "../components/sections/Testimonials";
import CallToAction from "../components/sections/CallToAction";
import { pageReveal } from "../utils/animations";

export default function LandingPage() {
  return (
    <motion.div initial="hidden" animate="visible" variants={pageReveal} className="min-h-screen min-w-0 overflow-x-clip">
      <Navbar />
      <main className="min-w-0 overflow-x-clip">
        <Hero />
        <TrustedBy />
        <Features />
        <LiveScoring />
        <TournamentManagement />
        <Statistics />
        <Screenshots />
        <Pricing />
        <FAQ />
        <Testimonials />
        <CallToAction />
      </main>
      <Footer />
    </motion.div>
  );
}
