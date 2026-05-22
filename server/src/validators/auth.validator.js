const Joi = require('joi');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const register = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid('admin', 'donor', 'hospital').default('donor'),
  phone: Joi.string().allow(''),
  bloodGroup: Joi.string().valid(...BLOOD_GROUPS),
  organizationName: Joi.string().when('role', {
    is: 'hospital',
    then: Joi.string().required(),
    otherwise: Joi.string().allow(''),
  }),
  address: Joi.object({
    street: Joi.string().allow(''),
    city: Joi.string().allow(''),
    state: Joi.string().allow(''),
    zipCode: Joi.string().allow(''),
    country: Joi.string().default('US'),
  }),
});

const login = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const refreshToken = Joi.object({
  refreshToken: Joi.string().required(),
});

module.exports = { register, login, refreshToken };
