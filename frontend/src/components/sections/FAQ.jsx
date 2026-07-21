import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import Section from "../ui/Section";
import SectionHeading from "../ui/SectionHeading";
import ScrollReveal from "../ui/ScrollReveal";

const faqs = [
  {
    question: "How does live scoring work?",
    answer:
      "Our live scoring module lets designated scorers update ball-by-ball data from any device. Changes sync instantly across all connected viewers — public pages, mobile apps, and embedded widgets update in real-time with sub-second latency.",
  },
  {
    question: "Can I customize the public tournament page?",
    answer:
      "Yes! Pro and Enterprise plans include full custom branding — your logo, colors, domain, and layout. You can embed schedules, standings, and live scores directly on your own website.",
  },
  {
    question: "What tournament formats are supported?",
    answer:
      "We support knockout (single/double elimination), round-robin, group stage + knockout, league, and fully custom hybrid formats. Our fixture engine handles scheduling, venue allocation, and rest day management automatically.",
  },
  {
    question: "Is there a mobile app for scorers?",
    answer:
      "Our platform is fully responsive and works beautifully on mobile browsers. Dedicated iOS and Android scorer apps are available on Pro and Enterprise plans for offline scoring with automatic sync.",
  },
  {
    question: "How do I migrate from my current system?",
    answer:
      "We offer free migration assistance for Pro and Enterprise customers. Import teams, players, and historical data via CSV or our API. Our support team will guide you through the entire process.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards, PayPal, and bank transfers for annual Enterprise plans. All payments are processed securely through Stripe with automatic invoicing.",
  },
];

function FAQItem({ faq, isOpen, onToggle }) {
  return (
    <div className="border-b border-slate-100 last:border-0">
      <motion.button
        type="button"
        onClick={onToggle}
        whileTap={{ scale: 0.995 }}
        className="w-full flex items-center justify-between gap-3 sm:gap-4 py-4 sm:py-5 text-left group touch-target"
        aria-expanded={isOpen}
      >
        <span className="text-sm sm:text-base font-semibold text-secondary group-hover:text-primary transition-colors leading-snug pr-2">
          {faq.question}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="shrink-0 w-8 h-8 rounded-lg bg-surface flex items-center justify-center"
        >
          <ChevronDown className="w-4 h-4 text-text-muted" />
        </motion.span>
      </motion.button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-4 sm:pb-5 text-sm sm:text-base text-text-muted leading-relaxed pr-2 sm:pr-10">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <Section id="faq" variant="surface">
      <div className="section-container max-w-3xl">
        <SectionHeading
          badge="FAQ"
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about Cricket Tournament. Can't find an answer? Contact our support team."
        />

        <ScrollReveal>
          <div className="card-premium px-4 sm:px-6 lg:px-8 safe-overflow">
            {faqs.map((faq, i) => (
              <FAQItem
                key={faq.question}
                faq={faq}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
              />
            ))}
          </div>
        </ScrollReveal>
      </div>
    </Section>
  );
}
