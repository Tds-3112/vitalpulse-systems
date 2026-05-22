const Joi = require('joi');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const createRequest = Joi.object({
  bloodGroup: Joi.string().valid(...BLOOD_GROUPS).required(),
  units: Joi.number().integer().min(1).required(),
  priority: Joi.string().valid('Emergency', 'Normal').default('Normal'),
  reason: Joi.string().max(500).allow(''),
  patientName: Joi.string().max(100).allow(''),
  notes: Joi.string().max(500).allow(''),
});

const updateRequestStatus = Joi.object({
  status: Joi.string().valid('Approved', 'Dispatched', 'Fulfilled', 'Rejected').required(),
  notes: Joi.string().max(500).allow(''),
  rejectionReason: Joi.string().when('status', {
    is: 'Rejected',
    then: Joi.string().required(),
    otherwise: Joi.string().allow(''),
  }),
  eta: Joi.string().allow(''),
});

module.exports = { createRequest, updateRequestStatus };
