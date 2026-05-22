const donationService = require('../services/donation.service');
const TransactionLog = require('../models/TransactionLog');
const ApiResponse = require('../utils/ApiResponse');

const getAll = async (req, res, next) => {
  try {
    const { data, pagination } = await donationService.getAllDonations(req.query);
    ApiResponse.paginated(res, 'Donations retrieved', data, pagination);
  } catch (error) {
    next(error);
  }
};

const getMyDonations = async (req, res, next) => {
  try {
    const { data, pagination } = await donationService.getDonorDonations(
      req.user._id,
      req.query
    );
    ApiResponse.paginated(res, 'Your donations retrieved', data, pagination);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const donation = await donationService.createDonation(req.body, req.user._id);

    await TransactionLog.log({
      action: 'DONATION_CREATED',
      performedBy: req.user._id,
      targetModel: 'Donation',
      targetId: donation._id,
      details: { bloodGroup: donation.bloodGroup, units: donation.units },
      ipAddress: req.ip,
    });

    ApiResponse.created(res, 'Donation recorded', donation);
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const donation = await donationService.updateDonationStatus(req.params.id, req.body);

    await TransactionLog.log({
      action: 'DONATION_STATUS_UPDATED',
      performedBy: req.user._id,
      targetModel: 'Donation',
      targetId: donation._id,
      details: { newStatus: donation.status },
      ipAddress: req.ip,
    });

    ApiResponse.success(res, 'Donation status updated', donation);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getMyDonations, create, updateStatus };
