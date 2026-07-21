import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Button from "../ui/Button";
import BackgroundDecor from "../ui/BackgroundDecor";
import Section from "../ui/Section";
import ScrollReveal from "../ui/ScrollReveal";

export default function CallToAction() {
  return (
    <Section size="sm" className="overflow-hidden">
      <div className="section-container">
        <ScrollReveal>
          <motion.div
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.998 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative rounded-2xl sm:rounded-[1.75rem] bg-secondary overflow-hidden px-5 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20 text-center min-w-0"
          >
            <BackgroundDecor variant="dark" />
            <div className="absolute inset-0 bg-linear-to-br from-primary/15 via-transparent to-accent/10 pointer-events-none" />

            <motion.div
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 opacity-25 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, transparent, rgba(22,163,74,0.25), transparent, rgba(245,158,11,0.15), transparent)",
                backgroundSize: "200% 100%",
              }}
            />

            <div className="relative max-w-2xl mx-auto">
              <h2 className="heading-xl text-white mb-4 sm:mb-6">
                Ready to Elevate Your Cricket Tournaments?
              </h2>
              <p className="body-lg text-slate-400 mb-8 sm:mb-10">
                Join thousands of organizers who trust Cricket Tournament to
                deliver professional-grade tournament experiences. Create an
                account and upgrade to Pro when you&apos;re ready.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
                <Button variant="primary" href="/register?plan=free" size="lg" fullWidth className="sm:w-auto">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" href="/#pricing" size="lg" fullWidth className="sm:w-auto">
                  View Pricing
                </Button>
              </div>
            </div>
          </motion.div>
        </ScrollReveal>
      </div>
    </Section>
  );
}
