const Joi = require('joi');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const createDonation = Joi.object({
  donor: Joi.string(),
  bloodGroup: Joi.string().valid(...BLOOD_GROUPS).required(),
  units: Joi.number().integer().min(1).max(5).default(1),
  volume: Joi.number().min(200).max(550).default(450),
  donationType: Joi.string().valid('Whole Blood', 'Platelets', 'Plasma', 'Double Red Cells').default('Whole Blood'),
  notes: Joi.string().max(500).allow(''),
  facility: Joi.string(),
  healthScreening: Joi.object({
    hemoglobin: Joi.number(),
    bloodPressure: Joi.string(),
    temperature: Joi.number(),
    pulse: Joi.number(),
    passed: Joi.boolean(),
  }),
});

const updateDonationStatus = Joi.object({
  status: Joi.string().valid('Completed', 'Processing', 'Cancelled', 'Scheduled').required(),
  notes: Joi.string().max(500).allow(''),
});

module.exports = { createDonation, updateDonationStatus };
