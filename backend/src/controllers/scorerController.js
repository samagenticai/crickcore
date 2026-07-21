import Scorer, { SCORER_STATUSES, DEFAULT_SCORER_STATUS } from "../models/Scorer.js";
import { ApiError, asyncHandler } from "../utils/helpers.js";
import { resolveUpload } from "../middleware/upload.js";
import { toObjectIdOrNull } from "../utils/objectId.js";
import Match from "../models/Match.js";

function organizerFilter(userId) {
  return { organizerId: userId };
}

function normalizePhone(phone) {
  return String(phone || "").trim();
}

function normalizeScorerPayload(body, { isUpdate = false } = {}) {
  const payload = {};

  if (body.fullName != null) payload.fullName = String(body.fullName).trim();
  if (body.phone != null) payload.phone = normalizePhone(body.phone);
  if (body.email != null) payload.email = String(body.email).trim().toLowerCase();
  if (body.city != null) payload.city = String(body.city).trim();
  if (body.notes != null) payload.notes = String(body.notes).trim();
  if (body.status != null) payload.status = body.status;

  if (body.experience === "" || body.experience == null) {
    if (!isUpdate || body.experience === "" || body.experience === null) {
      payload.experience = null;
    }
  } else {
    payload.experience = Number(body.experience);
    if (Number.isNaN(payload.experience) || payload.experience < 0) {
      throw new ApiError(400, "Experience must be a non-negative number of years");
    }
  }

  if (payload.status && !SCORER_STATUSES.includes(payload.status)) {
    throw new ApiError(400, "Invalid status. Use Active or Inactive.");
  }

  return payload;
}

function handleDuplicateError(err) {
  if (err?.code === 11000) {
    if (err?.keyPattern?.phone) {
      throw new ApiError(409, "A scorer with this phone number already exists");
    }
    if (err?.keyPattern?.email) {
      throw new ApiError(409, "A scorer with this email already exists");
    }
  }
  throw err;
}

/**
 * Soft-unlink scorer from matches but keep scorerName snapshot for scorecards.
 */
async function unlinkScorerFromMatches(scorerId) {
  await Match.updateMany(
    { scorer: scorerId },
    { $unset: { scorer: 1 } }
  );
}

export const getScorers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search = "" } = req.query;
  const query = organizerFilter(req.user._id);

  if (req.query.status && req.query.status !== "all") {
    query.status = req.query.status;
  }

  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { city: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [scorers, total] = await Promise.all([
    Scorer.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Scorer.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: scorers,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)) || 1,
    },
  });
});

export const getScorer = asyncHandler(async (req, res) => {
  const id = toObjectIdOrNull(req.params.id);
  if (!id) throw new ApiError(400, "Invalid scorer id");

  const scorer = await Scorer.findOne({
    _id: id,
    ...organizerFilter(req.user._id),
  });

  if (!scorer) throw new ApiError(404, "Scorer not found");
  res.json({ success: true, data: scorer });
});

export const createScorer = asyncHandler(async (req, res) => {
  const payload = normalizeScorerPayload(req.body);

  if (!payload.fullName) {
    throw new ApiError(400, "Full name is required", [
      { field: "fullName", message: "Full name is required" },
    ]);
  }
  if (!payload.phone) {
    throw new ApiError(400, "Phone number is required", [
      { field: "phone", message: "Phone number is required" },
    ]);
  }

  if (req.file) {
    payload.profilePhoto = await resolveUpload(req.file, "scorers/photos");
  }

  try {
    const scorer = await Scorer.create({
      ...payload,
      status: payload.status || DEFAULT_SCORER_STATUS,
      organizerId: req.user._id,
    });

    res.status(201).json({ success: true, data: scorer, message: "Scorer created successfully." });
  } catch (err) {
    handleDuplicateError(err);
  }
});

export const updateScorer = asyncHandler(async (req, res) => {
  const id = toObjectIdOrNull(req.params.id);
  if (!id) throw new ApiError(400, "Invalid scorer id");

  const payload = normalizeScorerPayload(req.body, { isUpdate: true });
  if (req.file) {
    payload.profilePhoto = await resolveUpload(req.file, "scorers/photos");
  }

  try {
    const scorer = await Scorer.findOneAndUpdate(
      { _id: id, ...organizerFilter(req.user._id) },
      payload,
      { new: true, runValidators: true }
    );

    if (!scorer) throw new ApiError(404, "Scorer not found");

    // Keep historical scorecards in sync with renamed active scorers still linked
    if (payload.fullName) {
      await Match.updateMany({ scorer: scorer._id }, { $set: { scorerName: scorer.fullName } });
    }

    res.json({ success: true, data: scorer, message: "Scorer updated successfully." });
  } catch (err) {
    handleDuplicateError(err);
  }
});

export const deleteScorer = asyncHandler(async (req, res) => {
  const id = toObjectIdOrNull(req.params.id);
  if (!id) throw new ApiError(400, "Invalid scorer id");

  const scorer = await Scorer.findOne({
    _id: id,
    ...organizerFilter(req.user._id),
  });

  if (!scorer) throw new ApiError(404, "Scorer not found");

  await unlinkScorerFromMatches(scorer._id);
  await scorer.deleteOne();
  res.json({ success: true, message: "Scorer deleted successfully" });
});

export { unlinkScorerFromMatches };
