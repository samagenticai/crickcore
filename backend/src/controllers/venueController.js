import Venue from "../models/Venue.js";
import Match from "../models/Match.js";
import { ApiError, asyncHandler } from "../utils/helpers.js";
import { PITCH_TYPES } from "../constants/pitchTypes.js";

function organizerFilter(userId) {
  return { organizerId: userId };
}

function normalizeVenuePayload(body) {
  const payload = {};

  if (body.venueName != null) payload.venueName = String(body.venueName).trim();
  if (body.groundAddress != null) payload.groundAddress = String(body.groundAddress).trim();
  if (body.city != null) payload.city = String(body.city).trim();
  if (body.state != null) payload.state = String(body.state).trim();
  if (body.country != null) payload.country = String(body.country).trim();
  if (body.pitchType != null) payload.pitchType = body.pitchType;
  if (body.contactPerson != null) payload.contactPerson = String(body.contactPerson).trim();
  if (body.contactNumber != null) payload.contactNumber = String(body.contactNumber).trim();
  if (body.notes != null) payload.notes = String(body.notes).trim();

  if (body.capacity === "" || body.capacity == null) {
    payload.capacity = undefined;
  } else {
    payload.capacity = Number(body.capacity);
  }

  if (payload.pitchType && !PITCH_TYPES.includes(payload.pitchType)) {
    throw new ApiError(400, "Invalid pitch type");
  }

  return payload;
}

export const getVenues = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search = "" } = req.query;
  const query = organizerFilter(req.user._id);

  if (search) {
    query.$or = [
      { venueName: { $regex: search, $options: "i" } },
      { groundAddress: { $regex: search, $options: "i" } },
      { city: { $regex: search, $options: "i" } },
      { state: { $regex: search, $options: "i" } },
      { country: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [venues, total] = await Promise.all([
    Venue.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Venue.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: venues,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)) || 1,
    },
  });
});

export const getVenue = asyncHandler(async (req, res) => {
  const venue = await Venue.findOne({
    _id: req.params.id,
    ...organizerFilter(req.user._id),
  });

  if (!venue) throw new ApiError(404, "Venue not found");
  res.json({ success: true, data: venue });
});

export const createVenue = asyncHandler(async (req, res) => {
  const payload = normalizeVenuePayload(req.body);
  const venue = await Venue.create({
    ...payload,
    pitchType: payload.pitchType || "Turf",
    organizerId: req.user._id,
  });

  res.status(201).json({ success: true, data: venue });
});

export const updateVenue = asyncHandler(async (req, res) => {
  const payload = normalizeVenuePayload(req.body);

  const venue = await Venue.findOneAndUpdate(
    { _id: req.params.id, ...organizerFilter(req.user._id) },
    payload,
    { new: true, runValidators: true }
  );

  if (!venue) throw new ApiError(404, "Venue not found");
  res.json({ success: true, data: venue });
});

export const deleteVenue = asyncHandler(async (req, res) => {
  const venue = await Venue.findOne({
    _id: req.params.id,
    ...organizerFilter(req.user._id),
  });

  if (!venue) throw new ApiError(404, "Venue not found");

  const linkedMatches = await Match.countDocuments({
    venue: venue._id,
    createdBy: req.user._id,
  });

  if (linkedMatches > 0) {
    throw new ApiError(400, "Cannot delete a venue that is assigned to existing matches");
  }

  await venue.deleteOne();
  res.json({ success: true, message: "Venue deleted successfully" });
});
