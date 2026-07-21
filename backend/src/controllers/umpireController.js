import Umpire from "../models/Umpire.js";
import { ApiError, asyncHandler } from "../utils/helpers.js";
import {
  UMPIRE_TYPES,
  UMPIRE_STATUSES,
  DEFAULT_UMPIRE_TYPE,
  DEFAULT_UMPIRE_STATUS,
} from "../constants/umpireTypes.js";

function organizerFilter(userId) {
  return { organizerId: userId };
}

function normalizePhone(phone) {
  return String(phone || "").trim();
}

function normalizeUmpirePayload(body) {
  const payload = {};

  if (body.fullName != null) payload.fullName = String(body.fullName).trim();
  if (body.phoneNumber != null) payload.phoneNumber = normalizePhone(body.phoneNumber);
  if (body.email != null) payload.email = String(body.email).trim();
  if (body.city != null) payload.city = String(body.city).trim();
  if (body.state != null) payload.state = String(body.state).trim();
  if (body.country != null) payload.country = String(body.country).trim();
  if (body.umpireType != null) payload.umpireType = body.umpireType;
  if (body.qualification != null) payload.qualification = String(body.qualification).trim();
  if (body.notes != null) payload.notes = String(body.notes).trim();
  if (body.status != null) payload.status = body.status;

  if (body.experience === "" || body.experience == null) {
    payload.experience = undefined;
  } else {
    payload.experience = Number(body.experience);
  }

  if (payload.umpireType && !UMPIRE_TYPES.includes(payload.umpireType)) {
    throw new ApiError(400, "Invalid umpire type");
  }

  if (payload.status && !UMPIRE_STATUSES.includes(payload.status)) {
    throw new ApiError(400, "Invalid status");
  }

  return payload;
}

function handleDuplicatePhoneError(err) {
  if (err?.code === 11000 && err?.keyPattern?.phoneNumber) {
    throw new ApiError(409, "An umpire with this phone number already exists");
  }
  throw err;
}

export const getUmpires = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search = "" } = req.query;
  const query = organizerFilter(req.user._id);

  if (req.query.status) {
    query.status = req.query.status;
  }

  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { phoneNumber: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { city: { $regex: search, $options: "i" } },
      { state: { $regex: search, $options: "i" } },
      { country: { $regex: search, $options: "i" } },
      { umpireType: { $regex: search, $options: "i" } },
      { qualification: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [umpires, total] = await Promise.all([
    Umpire.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Umpire.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: umpires,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)) || 1,
    },
  });
});

export const getUmpire = asyncHandler(async (req, res) => {
  const umpire = await Umpire.findOne({
    _id: req.params.id,
    ...organizerFilter(req.user._id),
  });

  if (!umpire) throw new ApiError(404, "Umpire not found");
  res.json({ success: true, data: umpire });
});

export const createUmpire = asyncHandler(async (req, res) => {
  const payload = normalizeUmpirePayload(req.body);

  if (!payload.fullName) {
    throw new ApiError(400, "Full name is required", [{ field: "fullName", message: "Full name is required" }]);
  }

  try {
    const umpire = await Umpire.create({
      ...payload,
      umpireType: payload.umpireType || DEFAULT_UMPIRE_TYPE,
      status: payload.status || DEFAULT_UMPIRE_STATUS,
      organizerId: req.user._id,
    });

    res.status(201).json({ success: true, data: umpire });
  } catch (err) {
    handleDuplicatePhoneError(err);
  }
});

export const updateUmpire = asyncHandler(async (req, res) => {
  const payload = normalizeUmpirePayload(req.body);

  try {
    const umpire = await Umpire.findOneAndUpdate(
      { _id: req.params.id, ...organizerFilter(req.user._id) },
      payload,
      { new: true, runValidators: true }
    );

    if (!umpire) throw new ApiError(404, "Umpire not found");
    res.json({ success: true, data: umpire });
  } catch (err) {
    handleDuplicatePhoneError(err);
  }
});

export const deleteUmpire = asyncHandler(async (req, res) => {
  const umpire = await Umpire.findOne({
    _id: req.params.id,
    ...organizerFilter(req.user._id),
  });

  if (!umpire) throw new ApiError(404, "Umpire not found");

  await umpire.deleteOne();
  res.json({ success: true, message: "Umpire deleted successfully" });
});
