const DEBUG = import.meta.env.DEV && import.meta.env.VITE_DEBUG_TOURNAMENTS !== "false";

export function logTournament(stage, detail = {}) {
  if (!DEBUG) return;
  console.info(`[tournaments:${stage}]`, detail);
}
