const Joi = require('joi');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const addInventory = Joi.object({
  bloodGroup: Joi.string().valid(...BLOOD_GROUPS).required(),
  units: Joi.number().integer().min(0).required(),
  capacity: Joi.number().integer().min(1).default(500),
  source: Joi.string().valid('Donor Portal', 'Manual Audit', 'Hospital Transfer', 'Camp Collection').default('Manual Audit'),
  expiryDate: Joi.date().iso(),
  location: Joi.object({
    facility: Joi.string(),
    zone: Joi.string(),
    storageUnit: Joi.string(),
  }),
});

const updateInventory = Joi.object({
  units: Joi.number().integer().min(0),
  capacity: Joi.number().integer().min(1),
  source: Joi.string().valid('Donor Portal', 'Manual Audit', 'Hospital Transfer', 'Camp Collection'),
  expiryDate: Joi.date().iso(),
  location: Joi.object({
    facility: Joi.string(),
    zone: Joi.string(),
    storageUnit: Joi.string(),
  }),
}).min(1);

module.exports = { addInventory, updateInventory };
