const Request = require('../models/Request');
const ApiError = require('../utils/ApiError');
const { buildPaginationQuery, buildPaginationResponse } = require('../utils/pagination');

const getAllRequests = async (query) => {
  const { page, limit, skip, sort } = buildPaginationQuery(query);

  const filter = {};
  if (query.bloodGroup) filter.bloodGroup = query.bloodGroup;
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;

  const [data, total] = await Promise.all([
    Request.find(filter)
      .populate('hospital', 'name organizationName email')
      .populate('processedBy', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Request.countDocuments(filter),
  ]);

  return { data, pagination: buildPaginationResponse(total, page, limit) };
};

const getHospitalRequests = async (hospitalId, query) => {
  const { page, limit, skip, sort } = buildPaginationQuery(query);

  const filter = { hospital: hospitalId };
  if (query.status) filter.status = query.status;

  const [data, total] = await Promise.all([
    Request.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Request.countDocuments(filter),
  ]);

  return { data, pagination: buildPaginationResponse(total, page, limit) };
};

const createRequest = async (data, hospitalId) => {
  data.hospital = hospitalId;
  const request = await Request.create(data);
  return request;
};

const updateRequestStatus = async (id, statusData, adminId) => {
  const request = await Request.findById(id);
  if (!request) throw ApiError.notFound('Request not found');

  // Validate status transitions
  const validTransitions = {
    Pending: ['Approved', 'Rejected'],
    Approved: ['Dispatched', 'Rejected'],
    Dispatched: ['Fulfilled'],
  };

  const allowed = validTransitions[request.status];
  if (!allowed || !allowed.includes(statusData.status)) {
    throw ApiError.badRequest(
      `Cannot transition from '${request.status}' to '${statusData.status}'`
    );
  }

  request.status = statusData.status;
  request.processedBy = adminId;
  request.processedAt = new Date();

  if (statusData.notes) request.notes = statusData.notes;
  if (statusData.eta) request.eta = statusData.eta;
  if (statusData.rejectionReason) request.rejectionReason = statusData.rejectionReason;

  await request.save();
  return request;
};

const updateHospitalRequestStatus = async (id, userId, userRole) => {
  const request = await Request.findById(id);
  if (!request) throw ApiError.notFound('Request not found');

  // Admin can cancel ANY request (any hospital, any status)
  if (userRole === 'admin') {
    if (!['Pending', 'Approved', 'Dispatched'].includes(request.status)) {
      throw ApiError.badRequest('Cannot cancel fulfilled/rejected/cancelled request');
    }
  } else {
    // Hospital can only cancel their own Pending requests
    if (request.hospital.toString() !== userId) {
      throw ApiError.forbidden('You can only cancel your own requests');
    }
    if (request.status !== 'Pending') {
      throw ApiError.badRequest('You can only cancel pending requests');
    }
  }

  request.status = 'Cancelled';
  request.processedAt = new Date();

  await request.save();
  return request;
};

module.exports = { getAllRequests, getHospitalRequests, createRequest, updateRequestStatus, updateHospitalRequestStatus };
