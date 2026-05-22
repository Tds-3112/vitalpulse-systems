const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Hospital reference is required'],
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
    },
    priority: {
      type: String,
      enum: ['Emergency', 'Normal'],
      default: 'Normal',
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Dispatched', 'Fulfilled', 'Rejected'],
      default: 'Pending',
    },
    reason: {
      type: String,
      maxlength: 500,
    },
    patientName: {
      type: String,
      trim: true,
    },
    eta: {
      type: String,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    processedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
requestSchema.index({ hospital: 1, status: 1, priority: 1, createdAt: -1 });
requestSchema.index({ status: 1 });
requestSchema.index({ priority: 1 });
requestSchema.index({ bloodGroup: 1 });
requestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Request', requestSchema);
