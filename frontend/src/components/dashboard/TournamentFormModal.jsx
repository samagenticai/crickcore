import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Trophy, Users, Calendar, DollarSign, Settings, ChevronRight, ChevronLeft,
  Upload, Image, Phone, Mail, User, MapPin, FileText, Loader2, Check,
  Circle, Hash, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { venueAPI } from "../../api/venues";
import { sponsorAPI } from "../../api/sponsors";
import VenueSelect from "./VenueSelect";
import VenueFormModal from "./VenueFormModal";
import SponsorMultiSelect from "./SponsorMultiSelect";
import DashboardFormModal, { DASHBOARD_MODAL_MAX_HEIGHT } from "./DashboardFormModal";

const STEPS = [
  { id: 1, title: "Basic Info",        icon: Trophy   },
  { id: 2, title: "Branding",          icon: Image    },
  { id: 3, title: "Organizer & Venue", icon: MapPin   },
  { id: 4, title: "Schedule & Fees",   icon: Calendar },
  { id: 5, title: "Rules & Settings",  icon: Settings },
];

import {
  TOURNAMENT_TYPES,
  DEFAULT_TOURNAMENT_TYPE,
  resolveTournamentType,
} from "../../constants/tournamentTypes";
const BALL_TYPES       = ["Tape Ball", "Tennis Ball", "Hard Ball"];
const MATCH_FORMATS    = ["T10", "T20", "T50", "Custom"];
const STATUSES         = ["Draft", "Upcoming", "Live", "Completed", "Cancelled"];

// Auto-fill overs for standard formats
const FORMAT_OVERS = { T10: 10, T20: 20, T50: 50 };

const defaultForm = {
  tournamentName:       "",
  tournamentType:       DEFAULT_TOURNAMENT_TYPE,
  ballType:             "Tennis Ball",
  matchFormat:          "T20",
  overs:                20,
  numberOfTeams:        8,
  contactPerson:        "",
  contactPhone:         "",
  contactEmail:         "",
  venue:                "",
  sponsors:             [],
  startDate:            "",
  endDate:              "",
  registrationDeadline: "",
  entryFee:             0,
  prizePool:            0,
  prizeDetails:         "",
  description:          "",
  rules:                "",
  status:               "Draft",
  isPublic:             true,
  isPublished:          false,
};

const FORM_KEYS = Object.keys(defaultForm);

function pickFormFields(source = {}) {
  const picked = {};
  FORM_KEYS.forEach((key) => {
    if (source[key] !== undefined && source[key] !== null) picked[key] = source[key];
  });
  return picked;
}

const stepVariants = {
  enter:  { opacity: 0 },
  center: { opacity: 1 },
  exit:   { opacity: 0 },
};

// ─── Shared field components (defined OUTSIDE the modal so React never
//     re-creates their identity across re-renders) ─────────────────────────

function FloatingInput({ label, name, value, onChange, type = "text", icon: Icon, error, required, min, disabled, ...rest }) {
  const [focused, setFocused] = useState(false);
  const active = focused || (value !== "" && value !== undefined && value !== null);

  return (
    <div className="relative">
      <div className={`relative flex items-center rounded-xl border transition-all duration-200 bg-white/90 ${
        error    ? "border-red-400 ring-2 ring-red-100"
        : focused ? "border-primary ring-2 ring-primary/20"
        : disabled ? "border-slate-200 bg-slate-50 opacity-70"
        : "border-slate-200 hover:border-slate-300"
      }`}>
        {Icon && (
          <div className={`pl-3 flex-shrink-0 transition-colors ${focused ? "text-primary" : "text-slate-400"}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div className="flex-1 relative pt-5 pb-2 px-3">
          <label className={`absolute left-0 transition-all duration-200 pointer-events-none ${
            active ? "top-1.5 text-[10px] font-semibold" : "top-3.5 text-sm"
          } ${error ? "text-red-500" : focused ? "text-primary" : "text-slate-400"}`}>
            {label}{required && " *"}
          </label>
          <input
            name={name}
            type={type}
            value={value ?? ""}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            min={min}
            disabled={disabled}
            className="w-full bg-transparent text-sm text-secondary outline-none disabled:cursor-not-allowed"
            {...rest}
          />
        </div>
      </div>
      {error && (
        <p className="flex items-center gap-1 mt-1 text-xs text-red-500">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

function FloatingSelect({ label, name, value, onChange, options, icon: Icon, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <div className={`relative flex items-center rounded-xl border transition-all duration-200 bg-white/90 ${
        error    ? "border-red-400 ring-2 ring-red-100"
        : focused ? "border-primary ring-2 ring-primary/20"
        : "border-slate-200 hover:border-slate-300"
      }`}>
        {Icon && (
          <div className={`pl-3 flex-shrink-0 transition-colors ${focused ? "text-primary" : "text-slate-400"}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div className="flex-1 relative pt-5 pb-2 px-3">
          <label className={`absolute left-0 top-1.5 text-[10px] font-semibold pointer-events-none ${
            error ? "text-red-500" : focused ? "text-primary" : "text-slate-400"
          }`}>
            {label}
          </label>
          <select
            name={name}
            value={value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="w-full bg-transparent text-sm text-secondary outline-none appearance-none"
          >
            {options.map((o) => (
              <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>
                {typeof o === "string" ? o : o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && (
        <p className="flex items-center gap-1 mt-1 text-xs text-red-500">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

function FloatingTextarea({ label, name, value, onChange, rows = 3, icon: Icon, error }) {
  const [focused, setFocused] = useState(false);
  const active = focused || Boolean(value);
  return (
    <div className="relative">
      <div className={`relative flex rounded-xl border transition-all duration-200 bg-white/90 ${
        error    ? "border-red-400 ring-2 ring-red-100"
        : focused ? "border-primary ring-2 ring-primary/20"
        : "border-slate-200 hover:border-slate-300"
      }`}>
        {Icon && (
          <div className={`pt-5 pl-3 flex-shrink-0 transition-colors ${focused ? "text-primary" : "text-slate-400"}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div className="flex-1 relative pt-5 pb-2 px-3">
          <label className={`absolute left-0 transition-all duration-200 pointer-events-none ${
            active ? "top-1.5 text-[10px] font-semibold" : "top-3.5 text-sm"
          } ${error ? "text-red-500" : focused ? "text-primary" : "text-slate-400"}`}>
            {label}
          </label>
          <textarea
            name={name}
            value={value ?? ""}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            rows={rows}
            className="w-full bg-transparent text-sm text-secondary outline-none resize-none"
          />
        </div>
      </div>
      {error && (
        <p className="flex items-center gap-1 mt-1 text-xs text-red-500">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

function ImageDropZone({ label, hint, accept = "image/*", onFile, preview, shape = "rect" }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) onFile(file);
  }, [onFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative cursor-pointer transition-all duration-300 flex flex-col items-center justify-center border-2 border-dashed gap-2 ${
        dragging
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-slate-300 hover:border-primary/60 bg-slate-50/50 hover:bg-primary/5"
      } ${shape === "circle" ? "rounded-full aspect-square w-32 mx-auto" : "rounded-xl p-5 min-h-[120px]"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
      />
      {preview ? (
        shape === "circle"
          ? <img src={preview} alt="preview" className="w-full h-full rounded-full object-cover" />
          : <img src={preview} alt="preview" className="max-h-24 rounded-lg object-contain" />
      ) : (
        <>
          <div className={`p-2.5 rounded-full ${dragging ? "bg-primary/20 text-primary" : "bg-slate-200 text-slate-400"}`}>
            <Upload className="w-5 h-5" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-secondary">{label}</p>
            {hint && <p className="text-xs text-text-muted mt-0.5">{hint}</p>}
          </div>
        </>
      )}
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${checked ? "bg-primary" : "bg-slate-300"}`}
      >
        <motion.div
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
        />
      </div>
      <span className="text-sm font-medium text-secondary">{label}</span>
    </label>
  );
}

function StepProgress({ current, total }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => {
        const s = i + 1;
        const done   = s < current;
        const active = s === current;
        return (
          <div key={s} className="flex items-center gap-1.5">
            <motion.div
              animate={{
                backgroundColor: done || active ? "#16a34a" : "#e2e8f0",
                scale: active ? 1.15 : 1,
              }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ color: done || active ? "#fff" : "#94a3b8" }}
            >
              {done ? <Check className="w-3.5 h-3.5" /> : s}
            </motion.div>
            {i < total - 1 && (
              <motion.div
                animate={{ backgroundColor: done ? "#16a34a" : "#e2e8f0" }}
                className="h-0.5 w-6 rounded"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export default function TournamentFormModal({ open, onClose, onSubmit, initial, loading }) {
  const [step, setStep]               = useState(1);
  const [dir, setDir]                 = useState(1);
  const [form, setForm]               = useState(defaultForm);
  const [errors, setErrors]           = useState({});
  const [logo, setLogo]               = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [banner, setBanner]           = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [venues, setVenues] = useState([]);
  const [venuesLoading, setVenuesLoading] = useState(false);
  const [venueModalOpen, setVenueModalOpen] = useState(false);
  const [venueSubmitting, setVenueSubmitting] = useState(false);
  const [sponsors, setSponsors] = useState([]);
  const [sponsorsLoading, setSponsorsLoading] = useState(false);

  const fetchVenues = useCallback(async () => {
    setVenuesLoading(true);
    try {
      const { data } = await venueAPI.getAll({ limit: 200 });
      setVenues(data.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load venues");
    } finally {
      setVenuesLoading(false);
    }
  }, []);

  const fetchSponsors = useCallback(async () => {
    setSponsorsLoading(true);
    try {
      const { data } = await sponsorAPI.getAll({ status: "Active", limit: 200 });
      setSponsors(data.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load sponsors");
    } finally {
      setSponsorsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchVenues();
    fetchSponsors();
  }, [open, fetchVenues, fetchSponsors]);

  // Reset form when opening
  useEffect(() => {
    if (!open) return;
    if (initial) {
      const venueId =
        initial.venue && typeof initial.venue === "object"
          ? initial.venue._id
          : initial.venue || "";
      const sponsorIds = Array.isArray(initial.sponsors)
        ? initial.sponsors.map((s) => (typeof s === "object" ? s._id : s)).filter(Boolean)
        : [];
      setForm({
        ...defaultForm,
        ...pickFormFields(initial),
        venue: venueId,
        sponsors: sponsorIds,
        tournamentType: resolveTournamentType(initial.tournamentType) || DEFAULT_TOURNAMENT_TYPE,
        startDate:            initial.startDate?.slice(0, 10)            || "",
        endDate:              initial.endDate?.slice(0, 10)              || "",
        registrationDeadline: initial.registrationDeadline?.slice(0, 10) || "",
        isPublic:    initial.isPublic    !== undefined ? initial.isPublic    : true,
        isPublished: initial.isPublished !== undefined ? initial.isPublished : false,
      });
      setLogoPreview(initial.tournamentLogo || null);
      setBannerPreview(initial.bannerImage  || null);
    } else {
      setForm(defaultForm);
      setLogoPreview(null);
      setBannerPreview(null);
    }
    setLogo(null);
    setBanner(null);
    setErrors({});
    setStep(1);
    setDir(1);
  }, [initial, open]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      // Auto-fill overs when a standard format is chosen
      if (name === "matchFormat" && FORMAT_OVERS[value] !== undefined) {
        next.overs = FORMAT_OVERS[value];
      }
      return next;
    });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleLogoFile   = (file) => { setLogo(file);   setLogoPreview(URL.createObjectURL(file));   };
  const handleBannerFile = (file) => { setBanner(file); setBannerPreview(URL.createObjectURL(file)); };

  // ── Validation ────────────────────────────────────────────────────────────

  const validateStep = () => {
    const e = {};
    if (step === 1) {
      if (!form.tournamentName.trim()) e.tournamentName = "Tournament name is required";
      if (!form.tournamentType)        e.tournamentType = "Please select a type";
      if (!form.ballType)              e.ballType       = "Please select ball type";
      if (!form.overs || form.overs < 1)               e.overs        = "Overs must be at least 1";
      if (!form.numberOfTeams || form.numberOfTeams < 2) e.numberOfTeams = "At least 2 teams required";
    }
    if (step === 3) {
      if (!form.venue) e.venue = "Please select a venue";
    }
    if (step === 4) {
      if (!form.startDate) e.startDate = "Start date is required";
      if (!form.endDate)   e.endDate   = "End date is required";
      if (form.startDate && form.endDate && form.startDate > form.endDate)
        e.endDate = "End date must be after start date";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => { if (!validateStep()) return; setDir(1);  setStep((s) => Math.min(s + 1, STEPS.length)); };
  const goBack = () => {                                setDir(-1); setStep((s) => Math.max(s - 1, 1)); };

  const handleVenueCreate = async (payload) => {
    setVenueSubmitting(true);
    try {
      const { data } = await venueAPI.create(payload);
      const created = data.data;
      await fetchVenues();
      setForm((prev) => ({ ...prev, venue: created._id }));
      if (errors.venue) setErrors((prev) => ({ ...prev, venue: "" }));
      setVenueModalOpen(false);
      toast.success("Venue added and selected");
    } catch (err) {
      if (err.errors?.length) err.errors.forEach((e) => toast.error(e.message));
      else toast.error(err.message || "Failed to create venue");
    } finally {
      setVenueSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (!validateStep()) return;
    const data = new FormData();
    FORM_KEYS.forEach((key) => {
      const val = form[key];
      if (key === "sponsors") {
        data.append("sponsors", JSON.stringify(Array.isArray(val) ? val : []));
        return;
      }
      if (val !== "" && val !== null && val !== undefined) data.append(key, val);
    });
    if (logo)   data.append("tournamentLogo", logo);
    if (banner) data.append("bannerImage",   banner);
    onSubmit(data);
  };

  // ── Step content — called as a plain function (NOT as <StepContent />)
  //    so React never re-mounts it on re-renders, preserving input focus. ───

  const renderStepContent = () => {
    const isCustomFormat = form.matchFormat === "Custom";

    if (step === 1) return (
      <div className="space-y-4">
        <FloatingInput
          label="Tournament Name" name="tournamentName" value={form.tournamentName}
          onChange={handleChange} icon={Trophy} error={errors.tournamentName} required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FloatingSelect
            label="Tournament Type" name="tournamentType" value={form.tournamentType}
            onChange={handleChange} options={TOURNAMENT_TYPES} icon={Trophy} error={errors.tournamentType}
          />
          <FloatingSelect
            label="Ball Type" name="ballType" value={form.ballType}
            onChange={handleChange} options={BALL_TYPES} icon={Circle} error={errors.ballType}
          />
        </div>

        {/* Match Format + Overs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FloatingSelect
            label="Match Format" name="matchFormat" value={form.matchFormat}
            onChange={handleChange} options={MATCH_FORMATS} icon={FileText}
          />
          <FloatingInput
            label={isCustomFormat ? "Custom Overs *" : `Overs (${form.matchFormat})`}
            name="overs"
            value={form.overs}
            onChange={handleChange}
            type="number"
            min="1"
            icon={Hash}
            error={errors.overs}
            disabled={!isCustomFormat}
          />
        </div>

        {/* Show hint when a preset format is selected */}
        {!isCustomFormat && (
          <p className="text-xs text-text-muted -mt-1 pl-1">
            Overs are auto-filled for {form.matchFormat}. Select <span className="font-semibold text-secondary">Custom</span> to enter a different value.
          </p>
        )}

        {/* Number of Teams */}
        <FloatingInput
          label="Number of Teams *" name="numberOfTeams" value={form.numberOfTeams}
          onChange={handleChange} type="number" min="2" icon={Users} error={errors.numberOfTeams}
        />
      </div>
    );

    if (step === 2) return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-secondary mb-2">Tournament Logo</p>
          <ImageDropZone
            label="Drop logo here or click to upload"
            hint="PNG, JPG, SVG — Recommended: 200×200"
            onFile={handleLogoFile}
            preview={logoPreview}
            shape="circle"
          />
          {logoPreview && (
            <button
              type="button"
              onClick={() => { setLogo(null); setLogoPreview(null); }}
              className="mt-2 mx-auto block text-xs text-red-500 hover:underline"
            >
              Remove logo
            </button>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-secondary mb-2">Tournament Banner</p>
          <ImageDropZone
            label="Drop banner here or click to upload"
            hint="PNG, JPG — Recommended: 1200×400"
            onFile={handleBannerFile}
            preview={bannerPreview}
          />
          {bannerPreview && (
            <button
              type="button"
              onClick={() => { setBanner(null); setBannerPreview(null); }}
              className="mt-2 text-xs text-red-500 hover:underline"
            >
              Remove banner
            </button>
          )}
        </div>
      </div>
    );

    if (step === 3) return (
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Organizer Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FloatingInput label="Organizer Name"   name="contactPerson" value={form.contactPerson} onChange={handleChange} icon={User} />
          <FloatingInput label="Contact Number"   name="contactPhone"  value={form.contactPhone}  onChange={handleChange} type="tel"   icon={Phone} />
          <FloatingInput label="Organizer Email"  name="contactEmail"  value={form.contactEmail}  onChange={handleChange} type="email" icon={Mail} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mt-2">Venue</p>
        <VenueSelect
          value={form.venue}
          onChange={(venueId) => {
            setForm((prev) => ({ ...prev, venue: venueId }));
            if (errors.venue) setErrors((prev) => ({ ...prev, venue: "" }));
          }}
          venues={venues}
          loading={venuesLoading}
          error={errors.venue}
          onAddNew={() => setVenueModalOpen(true)}
        />
        <SponsorMultiSelect
          sponsors={sponsors}
          selectedIds={form.sponsors || []}
          onChange={(ids) => setForm((prev) => ({ ...prev, sponsors: ids }))}
          loading={sponsorsLoading}
        />
      </div>
    );

    if (step === 4) return (
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Tournament Dates</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FloatingInput label="Start Date *"            name="startDate"            value={form.startDate}            onChange={handleChange} type="date" icon={Calendar} error={errors.startDate} required />
          <FloatingInput label="End Date *"              name="endDate"              value={form.endDate}              onChange={handleChange} type="date" icon={Calendar} error={errors.endDate}   required />
          <FloatingInput label="Registration Deadline"   name="registrationDeadline" value={form.registrationDeadline} onChange={handleChange} type="date" icon={Calendar} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mt-2">Fees & Prizes</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FloatingInput label="Entry Fee (PKR)" name="entryFee"  value={form.entryFee}  onChange={handleChange} type="number" min="0" icon={DollarSign} />
          <FloatingInput label="Prize Pool (PKR)" name="prizePool" value={form.prizePool} onChange={handleChange} type="number" min="0" icon={DollarSign} />
        </div>
        <FloatingTextarea label="Prize Details" name="prizeDetails" value={form.prizeDetails} onChange={handleChange} rows={3} icon={FileText} />
      </div>
    );

    if (step === 5) return (
      <div className="space-y-4">
        <FloatingTextarea label="Tournament Description" name="description" value={form.description} onChange={handleChange} rows={3} icon={FileText} />
        <FloatingTextarea label="Rules & Regulations"    name="rules"       value={form.rules}       onChange={handleChange} rows={4} icon={FileText} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FloatingSelect label="Status" name="status" value={form.status} onChange={handleChange} options={STATUSES} icon={Settings} />
        </div>
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4">
          <Toggle
            checked={form.isPublic}
            onChange={() => setForm((p) => ({ ...p, isPublic: !p.isPublic }))}
            label={form.isPublic ? "Public Tournament (Visible to all)" : "Private Tournament (Invite only)"}
          />
          <Toggle
            checked={form.isPublished}
            onChange={() => setForm((p) => ({ ...p, isPublished: !p.isPublished }))}
            label={form.isPublished ? "Published" : "Draft (Not published yet)"}
          />
        </div>
      </div>
    );

    return null;
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <DashboardFormModal
        open={open}
        onClose={onClose}
        loading={loading}
        zIndex={50}
        maxWidthClass="max-w-2xl"
        maxHeightClass={DASHBOARD_MODAL_MAX_HEIGHT}
        header={
          <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-slate-100">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-secondary">
                {initial ? "Edit Tournament" : "Create Tournament"}
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Step {step} of {STEPS.length} — {STEPS[step - 1].title}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <StepProgress current={step} total={STEPS.length} />
              <button
                type="button"
                onClick={!loading ? onClose : undefined}
                disabled={loading}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>
        }
        toolbar={
          <div className="flex border-b border-slate-100 overflow-x-auto">
            {STEPS.map((s) => {
              const Icon   = s.icon;
              const done   = s.id < step;
              const active = s.id === step;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { if (s.id < step) { setDir(-1); setStep(s.id); } }}
                  disabled={s.id > step}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors flex-1 justify-center min-w-0 ${
                    active ? "border-primary text-primary bg-primary/5"
                    : done  ? "border-primary/40 text-primary/70 hover:bg-primary/5 cursor-pointer"
                    : "border-transparent text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {done ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Icon className="w-3.5 h-3.5 shrink-0" />}
                  <span className="hidden sm:inline truncate">{s.title}</span>
                </button>
              );
            })}
          </div>
        }
        footer={
          <div className="px-4 sm:px-5 py-3 sm:py-4 bg-slate-50/60 flex items-center justify-between gap-2 sm:gap-3">
            <button
              type="button"
              onClick={step === 1 ? onClose : goBack}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-secondary hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
              {step === 1 ? "Cancel" : "Back"}
            </button>

            <span className="text-xs text-text-muted shrink-0">{step} / {STEPS.length}</span>

            {step < STEPS.length ? (
              <button
                type="button"
                onClick={goNext}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 shadow-lg shadow-primary/25"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Check className="w-4 h-4" /> {initial ? "Update Tournament" : "Create Tournament"}</>
                )}
              </button>
            )}
          </div>
        }
      >
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </DashboardFormModal>

      <VenueFormModal
        open={venueModalOpen}
        onClose={() => setVenueModalOpen(false)}
        onSubmit={handleVenueCreate}
        loading={venueSubmitting}
      />
    </>
  );
}
