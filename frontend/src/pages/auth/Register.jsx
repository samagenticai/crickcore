import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  UserPlus,
  Upload,
  User,
  AtSign,
  Mail,
  Phone,
  Lock,
  MapPin,
  Building2,
  Shield,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import AuthLayout from "../../components/auth/AuthLayout";
import FormField, { AuthSelect } from "../../components/auth/FormField";
import { authAPI } from "../../api/auth";
import { EASE } from "../../utils/animations";
import { AUTH_PLAN_COPY, resolveAuthPlan } from "../../utils/authPlanCopy";

const fieldFade = {
  hidden: { opacity: 0, y: 10 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.05 + i * 0.04, duration: 0.35, ease: EASE },
  }),
};

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { plan, isPro, sessionId: stripeSessionId } = resolveAuthPlan(searchParams);
  const copy = AUTH_PLAN_COPY[plan].register;
  const initialEmail = searchParams.get("email") || "";

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [profilePreview, setProfilePreview] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: initialEmail,
    phone: "",
    password: "",
    confirmPassword: "",
    role: "organizer",
    country: "",
    city: "",
    termsAccepted: false,
    profilePicture: null,
  });

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "file") {
      const file = files[0];
      setForm((prev) => ({ ...prev, profilePicture: file }));
      if (file) setProfilePreview(URL.createObjectURL(file));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Invalid email format";
    if (!form.phone.trim()) errs.phone = "Phone number is required";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 8) errs.password = "Password must be at least 8 characters";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    if (!form.termsAccepted) errs.termsAccepted = "You must accept the Terms & Conditions";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const data = new FormData();
      data.append("fullName", form.fullName);
      if (form.username) data.append("username", form.username);
      data.append("email", form.email);
      data.append("phone", form.phone);
      data.append("password", form.password);
      data.append("confirmPassword", form.confirmPassword);
      data.append("role", form.role);
      if (form.country) data.append("country", form.country);
      if (form.city) data.append("city", form.city);
      data.append("termsAccepted", "true");
      if (form.profilePicture) data.append("profilePicture", form.profilePicture);
      if (stripeSessionId) data.append("stripeSessionId", stripeSessionId);

      const res = await authAPI.register(data);
      const assignedPro =
        res.data?.data?.subscriptionPlan === "pro" ||
        res.data?.data?.subscription?.plan === "Pro";
      toast.success(
        assignedPro
          ? "Account created — Pro plan activated! Please login."
          : "Registration successful! Please login."
      );
      navigate(assignedPro || isPro ? "/login?plan=pro" : "/login?plan=free", { replace: true });
    } catch (err) {
      toast.error(err.message || "Registration failed");
      if (err.errors?.length) {
        const fieldErrors = {};
        err.errors.forEach((e) => {
          fieldErrors[e.field] = e.message;
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={copy.title}
      subtitle={copy.subtitle}
      plan={plan}
      brand={copy}
      wide
      registerMode
      footer={
        <p className="text-center text-sm text-text-muted">
          Already have an account?{" "}
          <Link
            to={`/login?plan=${plan}${stripeSessionId ? `&session_id=${encodeURIComponent(stripeSessionId)}` : ""}`}
            className="font-semibold text-primary hover:text-primary-dark transition-colors"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-[1.125rem]" noValidate>
        <div
          className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm ${
            isPro
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          {isPro ? (
            <Star className="mt-0.5 h-4 w-4 shrink-0 fill-current" />
          ) : (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
          )}
          <p>
            <strong>{copy.bannerTitle}</strong>
            <span className="block mt-0.5 opacity-90">
              {copy.bannerBody}
              {isPro && form.email ? ` (${form.email})` : ""}
            </span>
          </p>
        </div>

        <motion.div custom={0} variants={fieldFade} initial="hidden" animate="visible">
          <FormField
            label="Full Name"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            error={errors.fullName}
            required
            icon={User}
            placeholder="Your full name"
            autoComplete="name"
          />
        </motion.div>

        <motion.div custom={1} variants={fieldFade} initial="hidden" animate="visible">
          <FormField
            label="Username"
            name="username"
            value={form.username}
            onChange={handleChange}
            error={errors.username}
            icon={AtSign}
            placeholder="Optional but recommended"
            autoComplete="username"
            hint="Used for your public profile handle"
          />
        </motion.div>

        <motion.div
          custom={2}
          variants={fieldFade}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4"
        >
          <FormField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            required
            icon={Mail}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <FormField
            label="Phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            error={errors.phone}
            required
            icon={Phone}
            placeholder="+1 234 567 890"
            autoComplete="tel"
          />
        </motion.div>

        <motion.div
          custom={3}
          variants={fieldFade}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4"
        >
          <FormField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            required
            icon={Lock}
            showPasswordToggle
            placeholder="Min. 8 characters"
            autoComplete="new-password"
          />
          <FormField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            required
            icon={Lock}
            showPasswordToggle
            placeholder="Re-enter password"
            autoComplete="new-password"
          />
        </motion.div>

        <motion.div
          custom={4}
          variants={fieldFade}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4"
        >
          <FormField
            label="Country"
            name="country"
            value={form.country}
            onChange={handleChange}
            icon={MapPin}
            placeholder="Optional"
            autoComplete="country-name"
          />
          <FormField
            label="City"
            name="city"
            value={form.city}
            onChange={handleChange}
            icon={Building2}
            placeholder="Optional"
            autoComplete="address-level2"
          />
        </motion.div>

        <motion.div custom={5} variants={fieldFade} initial="hidden" animate="visible">
          <FormField label="Role" name="role" error={errors.role}>
            <AuthSelect name="role" value={form.role} onChange={handleChange} icon={Shield}>
              <option value="organizer">Organizer</option>
              <option value="scorer">Scorer</option>
              <option value="viewer">Viewer</option>
            </AuthSelect>
          </FormField>
        </motion.div>

        <motion.div custom={6} variants={fieldFade} initial="hidden" animate="visible">
          <FormField label="Profile Picture" name="profilePicture">
            <div className="flex items-center gap-3 min-w-0">
              <label className="group flex flex-1 items-center justify-center gap-2 min-h-[48px] px-4 py-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-200 text-sm text-text-muted min-w-0">
                <Upload className="w-4 h-4 shrink-0 text-primary group-hover:scale-105 transition-transform" />
                <span className="truncate font-medium">Upload photo</span>
                <input
                  type="file"
                  name="profilePicture"
                  accept="image/*"
                  onChange={handleChange}
                  className="hidden"
                />
              </label>
              <AnimatePresence>
                {profilePreview && (
                  <motion.img
                    key="preview"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    src={profilePreview}
                    alt="Preview"
                    className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 shadow-sm shrink-0"
                  />
                )}
              </AnimatePresence>
            </div>
          </FormField>
        </motion.div>

        <motion.div custom={7} variants={fieldFade} initial="hidden" animate="visible" className="space-y-1.5">
          <label className="flex items-start gap-2.5 cursor-pointer select-none rounded-xl p-2 -mx-2 hover:bg-slate-50/80 transition-colors">
            <input
              type="checkbox"
              name="termsAccepted"
              checked={form.termsAccepted}
              onChange={handleChange}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/40 shrink-0"
            />
            <span className="text-sm text-text-muted leading-snug">
              I agree to the{" "}
              <a
                href="#"
                className="text-primary font-semibold hover:underline"
                onClick={(e) => e.preventDefault()}
              >
                Terms & Conditions
              </a>
            </span>
          </label>
          <AnimatePresence>
            {errors.termsAccepted && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs font-medium text-red-500 px-2"
                role="alert"
              >
                {errors.termsAccepted}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div custom={8} variants={fieldFade} initial="hidden" animate="visible" className="pt-1">
          <button
            type="submit"
            disabled={loading}
            className="relative w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 sm:py-3.5 text-sm font-semibold text-white
              bg-gradient-to-r from-primary to-primary-dark
              shadow-[0_4px_16px_rgba(22,163,74,0.35)]
              hover:shadow-[0_8px_24px_rgba(22,163,74,0.42)] hover:brightness-[1.03]
              active:scale-[0.985] transition-all duration-200
              disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
              touch-target"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isPro ? "Activating Pro…" : "Creating account…"}
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                {copy.submit}
              </>
            )}
          </button>
        </motion.div>
      </form>
    </AuthLayout>
  );
}
