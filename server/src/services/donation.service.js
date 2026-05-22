const Donation = require('../models/Donation');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { buildPaginationQuery, buildPaginationResponse } = require('../utils/pagination');

const getAllDonations = async (query) => {
  const { page, limit, skip, sort } = buildPaginationQuery(query);

  const filter = {};
  if (query.bloodGroup) filter.bloodGroup = query.bloodGroup;
  if (query.status) filter.status = query.status;

  const [data, total] = await Promise.all([
    Donation.find(filter)
      .populate('donor', 'name email bloodGroup')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Donation.countDocuments(filter),
  ]);

  return { data, pagination: buildPaginationResponse(total, page, limit) };
};

const getDonorDonations = async (donorId, query) => {
  const { page, limit, skip, sort } = buildPaginationQuery(query);

  const filter = { donor: donorId };
  if (query.status) filter.status = query.status;

  const [data, total] = await Promise.all([
    Donation.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Donation.countDocuments(filter),
  ]);

  return { data, pagination: buildPaginationResponse(total, page, limit) };
};

const createDonation = async (data, userId) => {
  // If donor not specified, use the current user
  if (!data.donor) data.donor = userId;

  const donation = await Donation.create(data);

  // Increment donor's donation count
  await User.findByIdAndUpdate(data.donor, { $inc: { donationCount: 1 } });

  return donation;
};

const updateDonationStatus = async (id, statusData) => {
  const donation = await Donation.findById(id);
  if (!donation) throw ApiError.notFound('Donation not found');

  donation.status = statusData.status;
  if (statusData.notes) donation.notes = statusData.notes;
  await donation.save();

  return donation;
};

module.exports = { getAllDonations, getDonorDonations, createDonation, updateDonationStatus };
