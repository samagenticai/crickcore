import Sponsor, {
  SPONSOR_STATUSES,
  SPONSOR_TYPES,
  DEFAULT_SPONSOR_STATUS,
  DEFAULT_SPONSOR_TYPE,
} from "../models/Sponsor.js";
import Tournament from "../models/Tournament.js";
import { ApiError, asyncHandler } from "../utils/helpers.js";
import { resolveUpload } from "../middleware/upload.js";
import { toObjectIdOrNull } from "../utils/objectId.js";

function organizerFilter(userId) {
  return { organizerId: userId };
}

function normalizeWebsite(website) {
  const v = String(website || "").trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}

function normalizeSponsorPayload(body, { isUpdate = false } = {}) {
  const payload = {};

  if (body.sponsorName != null) payload.sponsorName = String(body.sponsorName).trim();
  if (body.companyName != null) payload.companyName = String(body.companyName).trim();
  if (body.sponsorType != null) payload.sponsorType = body.sponsorType;
  if (body.contactPerson != null) payload.contactPerson = String(body.contactPerson).trim();
  if (body.phone != null) payload.phone = String(body.phone).trim();
  if (body.email != null) payload.email = String(body.email).trim().toLowerCase();
  if (body.website != null) payload.website = normalizeWebsite(body.website);
  if (body.address != null) payload.address = String(body.address).trim();
  if (body.notes != null) payload.notes = String(body.notes).trim();
  if (body.status != null) payload.status = body.status;

  if (body.sponsorshipAmount === "" || body.sponsorshipAmount == null) {
    if (!isUpdate || body.sponsorshipAmount === "" || body.sponsorshipAmount === null) {
      payload.sponsorshipAmount = null;
    }
  } else {
    payload.sponsorshipAmount = Number(body.sponsorshipAmount);
    if (Number.isNaN(payload.sponsorshipAmount) || payload.sponsorshipAmount < 0) {
      throw new ApiError(400, "Sponsorship amount must be a non-negative number");
    }
  }

  if (payload.sponsorType && !SPONSOR_TYPES.includes(payload.sponsorType)) {
    throw new ApiError(400, "Invalid sponsor type");
  }
  if (payload.status && !SPONSOR_STATUSES.includes(payload.status)) {
    throw new ApiError(400, "Invalid status. Use Active or Inactive.");
  }

  return payload;
}

async function unlinkSponsorFromTournaments(sponsorId) {
  await Tournament.updateMany({ sponsors: sponsorId }, { $pull: { sponsors: sponsorId } });
}

export const getSponsors = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search = "" } = req.query;
  const query = organizerFilter(req.user._id);

  if (req.query.status && req.query.status !== "all") {
    query.status = req.query.status;
  }
  if (req.query.sponsorType && req.query.sponsorType !== "all") {
    query.sponsorType = req.query.sponsorType;
  }

  if (search) {
    query.$or = [
      { sponsorName: { $regex: search, $options: "i" } },
      { companyName: { $regex: search, $options: "i" } },
      { contactPerson: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [sponsors, total] = await Promise.all([
    Sponsor.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Sponsor.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: sponsors,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)) || 1,
    },
  });
});

export const getSponsor = asyncHandler(async (req, res) => {
  const id = toObjectIdOrNull(req.params.id);
  if (!id) throw new ApiError(400, "Invalid sponsor id");

  const sponsor = await Sponsor.findOne({
    _id: id,
    ...organizerFilter(req.user._id),
  });

  if (!sponsor) throw new ApiError(404, "Sponsor not found");
  res.json({ success: true, data: sponsor });
});

export const createSponsor = asyncHandler(async (req, res) => {
  const payload = normalizeSponsorPayload(req.body);

  if (!payload.sponsorName) {
    throw new ApiError(400, "Sponsor name is required", [
      { field: "sponsorName", message: "Sponsor name is required" },
    ]);
  }

  if (req.file) {
    payload.logo = await resolveUpload(req.file, "sponsors/logos");
  }

  const sponsor = await Sponsor.create({
    ...payload,
    sponsorType: payload.sponsorType || DEFAULT_SPONSOR_TYPE,
    status: payload.status || DEFAULT_SPONSOR_STATUS,
    organizerId: req.user._id,
  });

  res.status(201).json({ success: true, data: sponsor, message: "Sponsor created successfully." });
});

export const updateSponsor = asyncHandler(async (req, res) => {
  const id = toObjectIdOrNull(req.params.id);
  if (!id) throw new ApiError(400, "Invalid sponsor id");

  const payload = normalizeSponsorPayload(req.body, { isUpdate: true });
  if (req.file) {
    payload.logo = await resolveUpload(req.file, "sponsors/logos");
  }

  const sponsor = await Sponsor.findOneAndUpdate(
    { _id: id, ...organizerFilter(req.user._id) },
    payload,
    { new: true, runValidators: true }
  );

  if (!sponsor) throw new ApiError(404, "Sponsor not found");
  res.json({ success: true, data: sponsor, message: "Sponsor updated successfully." });
});

export const deleteSponsor = asyncHandler(async (req, res) => {
  const id = toObjectIdOrNull(req.params.id);
  if (!id) throw new ApiError(400, "Invalid sponsor id");

  const sponsor = await Sponsor.findOne({
    _id: id,
    ...organizerFilter(req.user._id),
  });

  if (!sponsor) throw new ApiError(404, "Sponsor not found");

  await unlinkSponsorFromTournaments(sponsor._id);
  await sponsor.deleteOne();
  res.json({ success: true, message: "Sponsor deleted successfully" });
});

export { unlinkSponsorFromTournaments };
