const requestService = require('../services/request.service');
const TransactionLog = require('../models/TransactionLog');
const ApiResponse = require('../utils/ApiResponse');

const getAll = async (req, res, next) => {
  try {
    const { data, pagination } = await requestService.getAllRequests(req.query);
    ApiResponse.paginated(res, 'Requests retrieved', data, pagination);
  } catch (error) {
    next(error);
  }
};

const getMyRequests = async (req, res, next) => {
  try {
    const { data, pagination } = await requestService.getHospitalRequests(
      req.user._id,
      req.query
    );
    ApiResponse.paginated(res, 'Your requests retrieved', data, pagination);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const request = await requestService.createRequest(req.body, req.user._id);

    await TransactionLog.log({
      action: 'REQUEST_CREATED',
      performedBy: req.user._id,
      targetModel: 'Request',
      targetId: request._id,
      details: {
        bloodGroup: request.bloodGroup,
        units: request.units,
        priority: request.priority,
      },
      ipAddress: req.ip,
    });

    ApiResponse.created(res, 'Blood request created', request);
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const request = await requestService.updateRequestStatus(
      req.params.id,
      req.body,
      req.user._id
    );

    await TransactionLog.log({
      action: 'REQUEST_STATUS_UPDATED',
      performedBy: req.user._id,
      targetModel: 'Request',
      targetId: request._id,
      details: { newStatus: request.status },
      ipAddress: req.ip,
    });

    ApiResponse.success(res, 'Request status updated', request);
  } catch (error) {
    next(error);
  }
};

const cancelMyRequest = async (req, res, next) => {
  try {
    const request = await requestService.updateHospitalRequestStatus(
      req.params.id,
      req.user._id,
      req.user.role
    );

    await TransactionLog.log({
      action: 'REQUEST_STATUS_UPDATED',
      performedBy: req.user._id,
      targetModel: 'Request',
      targetId: request._id,
      details: { newStatus: 'Cancelled', reason: 'Cancelled by ' + req.user.role },
      ipAddress: req.ip,
    });

    ApiResponse.success(res, 'Request cancelled', request);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getMyRequests, create, updateStatus, cancelMyRequest };
