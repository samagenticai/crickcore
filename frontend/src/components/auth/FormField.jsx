import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

const inputBase =
  "w-full rounded-xl border bg-white text-sm text-secondary placeholder:text-slate-400 outline-none transition-all duration-200 touch-target " +
  "shadow-[0_1px_2px_rgba(15,23,42,0.04)] " +
  "focus:ring-2 focus:ring-primary/25 focus:border-primary focus:shadow-[0_0_0_4px_rgba(22,163,74,0.08)] " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

export default function FormField({
  label,
  name,
  type = "text",
  error,
  required,
  children,
  icon: Icon,
  hint,
  className = "",
  inputClassName = "",
  showPasswordToggle = false,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password" || showPasswordToggle;
  const resolvedType = isPassword && showPasswordToggle ? (showPassword ? "text" : "password") : type;

  const paddingLeft = Icon ? "pl-10 sm:pl-11" : "pl-3.5 sm:pl-4";
  const paddingRight = showPasswordToggle ? "pr-11" : "pr-3.5 sm:pr-4";

  return (
    <div className={`space-y-1.5 min-w-0 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-[13px] font-semibold text-secondary">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {children || (
        <div className="relative min-w-0">
          {Icon && (
            <span className="pointer-events-none absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon className="w-4 h-4" strokeWidth={2} />
            </span>
          )}
          <input
            id={name}
            name={name}
            type={resolvedType}
            className={`${inputBase} py-2.5 sm:py-3 ${paddingLeft} ${paddingRight} ${
              error ? "border-red-400 focus:ring-red-200/60 focus:border-red-400" : "border-slate-200/90"
            } ${inputClassName}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${name}-error` : undefined}
            {...props}
          />
          {showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-secondary hover:bg-slate-50 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        {error ? (
          <motion.p
            key="error"
            id={`${name}-error`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            className="text-xs font-medium text-red-500 leading-snug"
            role="alert"
          >
            {error}
          </motion.p>
        ) : hint ? (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-text-muted"
          >
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function AuthSelect({ name, error, icon: Icon, children, ...props }) {
  return (
    <div className="relative min-w-0">
      {Icon && (
        <span className="pointer-events-none absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-[1]">
          <Icon className="w-4 h-4" />
        </span>
      )}
      <select
        id={name}
        name={name}
        className={`${inputBase} py-2.5 sm:py-3 appearance-none ${
          Icon ? "pl-10 sm:pl-11" : "pl-3.5 sm:pl-4"
        } pr-10 ${error ? "border-red-400" : "border-slate-200/90"}`}
        {...props}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
        ▾
      </span>
    </div>
  );
}

export { inputBase };
