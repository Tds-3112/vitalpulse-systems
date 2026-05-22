const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor reference is required'],
    },
    bloodGroup: {
      type: String,
      required: [true, 'Blood group is required'],
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    units: {
      type: Number,
      required: true,
      min: [1, 'Minimum 1 unit'],
      max: [5, 'Maximum 5 units per donation'],
      default: 1,
    },
    volume: {
      type: Number,
      min: 200,
      max: 550,
      default: 450,
    },
    donationType: {
      type: String,
      enum: ['Whole Blood', 'Platelets', 'Plasma', 'Double Red Cells'],
      default: 'Whole Blood',
    },
    status: {
      type: String,
      enum: ['Completed', 'Processing', 'Cancelled', 'Scheduled'],
      default: 'Processing',
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    facility: {
      type: String,
      default: 'Central Blood Bank',
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    healthScreening: {
      hemoglobin: Number,
      bloodPressure: String,
      temperature: Number,
      pulse: Number,
      passed: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
donationSchema.index({ donor: 1, status: 1, createdAt: -1 });
donationSchema.index({ status: 1 });
donationSchema.index({ bloodGroup: 1 });
donationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Donation', donationSchema);
