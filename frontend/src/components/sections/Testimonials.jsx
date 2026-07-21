import { Quote, Star } from "lucide-react";
import PremiumCard from "../ui/PremiumCard";
import Section from "../ui/Section";
import SectionHeading from "../ui/SectionHeading";
import ScrollReveal from "../ui/ScrollReveal";

const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "Tournament Director, Mumbai Premier League",
    content:
      "Cricket Tournament transformed how we run our league. Live scoring alone saved us countless hours, and our fans love the real-time updates.",
    rating: 5,
    initials: "RK",
  },
  {
    name: "Sarah Mitchell",
    role: "Operations Manager, County Cricket Board",
    content:
      "We migrated 12 tournaments in a single weekend. The fixture engine is incredibly smart, and the analytics give us insights we never had before.",
    rating: 5,
    initials: "SM",
  },
  {
    name: "James O'Brien",
    role: "Club Secretary, Dublin Strikers CC",
    content:
      "As a volunteer-run club, we needed something simple yet powerful. The free tier got us started, and we've since upgraded to Pro — worth every penny.",
    rating: 5,
    initials: "JO",
  },
];

function TestimonialCard({ testimonial, index }) {
  return (
    <ScrollReveal delay={index * 0.08} className="h-full">
      <PremiumCard padding="lg" className="h-full flex flex-col">
        <Quote className="w-7 h-7 sm:w-8 sm:h-8 text-primary/15 mb-3 sm:mb-4" />

        <div className="flex gap-0.5 mb-3 sm:mb-4">
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent fill-accent" />
          ))}
        </div>

        <p className="text-sm sm:text-base text-secondary leading-relaxed flex-1 mb-5 sm:mb-6">
          &ldquo;{testimonial.content}&rdquo;
        </p>

        <div className="flex items-center gap-3 pt-5 sm:pt-6 border-t border-slate-100">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/8 border border-primary/10 flex items-center justify-center text-xs sm:text-sm font-bold text-primary shrink-0">
            {testimonial.initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-secondary truncate">{testimonial.name}</p>
            <p className="text-xs text-text-muted leading-snug line-clamp-2">{testimonial.role}</p>
          </div>
        </div>
      </PremiumCard>
    </ScrollReveal>
  );
}

export default function Testimonials() {
  return (
    <Section id="reviews">
      <div className="section-container">
        <SectionHeading
          badge="Reviews"
          title="Loved by Organizers Worldwide"
          subtitle="See why cricket leagues of all sizes trust us to power their tournaments."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 items-stretch">
          {testimonials.map((testimonial, i) => (
            <TestimonialCard key={testimonial.name} testimonial={testimonial} index={i} />
          ))}
        </div>
      </div>
    </Section>
  );
}
