/**
 * Ensures POST/PUT bodies use canonical umpire field names before validation.
 * Maps legacy aliases once, then strips them so only fullName/phoneNumber flow through.
 */
export function normalizeUmpireBody(req, _res, next) {
  if (!req.body || typeof req.body !== "object") {
    return next();
  }

  if (!req.body.fullName && req.body.name) {
    req.body.fullName = req.body.name;
  }
  if (!req.body.phoneNumber && req.body.phone) {
    req.body.phoneNumber = req.body.phone;
  }

  delete req.body.name;
  delete req.body.phone;
  delete req.body.umpireName;
  delete req.body.umpire_name;

  next();
}
