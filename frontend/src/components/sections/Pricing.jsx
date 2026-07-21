import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import Button from "../ui/Button";
import BackgroundDecor from "../ui/BackgroundDecor";
import PremiumCard from "../ui/PremiumCard";
import Section from "../ui/Section";
import SectionHeading from "../ui/SectionHeading";
import ScrollReveal from "../ui/ScrollReveal";
import { paymentsAPI } from "../../api/payments";
import { useAuth } from "../../context/AuthContext";
import { isProMember } from "../../utils/subscription";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "Free",
    period: "forever",
    description: "Perfect for small clubs and casual leagues.",
    features: [
      "Up to 2 tournaments",
      "8 teams per tournament",
      "Basic live scoring",
      "Public standings page",
      "Email support",
    ],
    cta: "Free",
    action: "free",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For growing leagues that need more power.",
    features: [
      "Unlimited tournaments",
      "Unlimited teams",
      "Advanced live scoring",
      "Custom branding",
      "Analytics dashboard",
      "Priority support",
      "API access",
    ],
    cta: "Pro Plan",
    action: "checkout",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For national boards and large organizations.",
    features: [
      "Everything in Pro",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
      "On-premise deployment",
      "Training & onboarding",
      "White-label solution",
    ],
    cta: "Contact Sales",
    action: "contact",
    popular: false,
  },
];

function PricingCard({ plan, index }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const checkoutStartedRef = useRef(false);
  const isPopular = plan.popular;
  const alreadyPro = isProMember(user) && plan.action === "checkout";

  const handleCta = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (plan.action === "free") {
      if (user) {
        navigate("/dashboard");
        return;
      }
      navigate("/register?plan=free");
      return;
    }

    if (plan.action === "contact") {
      window.location.href = "/#contact";
      return;
    }

    if (plan.action === "checkout") {
      if (alreadyPro) {
        toast.message("You're already on Pro", {
          description: "Your Stripe subscription is active.",
        });
        return;
      }
      if (checkoutStartedRef.current) return;
      checkoutStartedRef.current = true;

      setLoading(true);
      try {
        const res = await paymentsAPI.createCheckoutSession(plan.id);
        const url = res.data?.data?.url;
        if (!url) throw new Error("Checkout URL missing from server");
        window.location.assign(url);
      } catch (err) {
        checkoutStartedRef.current = false;
        toast.error(err.message || "Unable to start Stripe checkout");
        setLoading(false);
      }
    }
  };

  return (
    <ScrollReveal delay={index * 0.08} className="h-full">
      <PremiumCard
        interactive={false}
        padding="lg"
        className={`h-full flex flex-col ${
          isPopular
            ? "!bg-secondary !text-white border-secondary shadow-[0_12px_40px_rgba(15,23,42,0.2)] ring-2 ring-primary/30"
            : ""
        }`}
      >
        {isPopular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full bg-accent text-secondary text-[11px] font-bold shadow-md whitespace-nowrap z-10">
            <Star className="w-3 h-3 fill-current" />
            Most Popular
          </div>
        )}

        <div className="mb-5 sm:mb-6 pt-1">
          <h3 className={`text-lg font-bold mb-1 ${isPopular ? "text-white" : "text-secondary"}`}>
            {plan.name}
          </h3>
          <p className={`text-sm leading-relaxed ${isPopular ? "text-slate-400" : "text-text-muted"}`}>
            {plan.description}
          </p>
        </div>

        <div className="mb-6 sm:mb-8">
          <span
            className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
              isPopular ? "text-white" : "text-secondary"
            }`}
          >
            {plan.price}
          </span>
          {plan.period && (
            <span className={`text-sm ml-1 ${isPopular ? "text-slate-400" : "text-text-muted"}`}>
              {plan.period}
            </span>
          )}
        </div>

        <ul className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8 flex-1">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 sm:gap-3">
              <Check
                className={`w-4 h-4 mt-0.5 shrink-0 ${
                  isPopular ? "text-primary-light" : "text-primary"
                }`}
              />
              <span
                className={`text-sm leading-relaxed ${
                  isPopular ? "text-slate-300" : "text-text-muted"
                }`}
              >
                {feature}
              </span>
            </li>
          ))}
        </ul>

        <Button
          variant={isPopular ? "accent" : "primary"}
          fullWidth
          type="button"
          disabled={loading || alreadyPro}
          onClick={handleCta}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Redirecting to Stripe…
            </>
          ) : alreadyPro ? (
            "PRO MEMBER"
          ) : (
            plan.cta
          )}
        </Button>
      </PremiumCard>
    </ScrollReveal>
  );
}

export default function Pricing() {
  return (
    <Section id="pricing" className="overflow-x-clip">
      <BackgroundDecor />

      <div className="section-container relative">
        <SectionHeading
          badge="Pricing"
          title="Simple, Transparent Pricing"
          subtitle="Choose Free to register instantly, or Pro Plan to pay with Stripe first — then activate your account."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 items-stretch max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <PricingCard key={plan.id} plan={plan} index={i} />
          ))}
        </div>
      </div>
    </Section>
  );
}
