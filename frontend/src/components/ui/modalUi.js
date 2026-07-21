/** Shared light-theme modal shell used across organizer, admin, and auth dialogs */

export const MODAL_BACKDROP =
  "absolute inset-0 bg-slate-100/55 backdrop-blur-[6px]";

export const MODAL_SHELL =
  "fixed inset-0 flex items-center justify-center p-4 sm:p-5 overflow-hidden";

export const MODAL_PANEL =
  "relative z-[1] w-full flex flex-col min-h-0 bg-white rounded-2xl sm:rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.10)] border border-slate-200/70 overflow-hidden";

export const MODAL_MAX_HEIGHT = "max-h-[min(90vh,calc(100dvh-2rem))]";

export const MOBILE_DRAWER_SHELL =
  "fixed inset-0 z-[75] flex items-end sm:items-center justify-center p-0 sm:p-4 sm:p-5 overflow-hidden";
