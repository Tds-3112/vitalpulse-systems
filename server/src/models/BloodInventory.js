const mongoose = require('mongoose');

const bloodInventorySchema = new mongoose.Schema(
  {
    bloodGroup: {
      type: String,
      required: [true, 'Blood group is required'],
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    units: {
      type: Number,
      required: true,
      min: [0, 'Units cannot be negative'],
      default: 0,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      default: 500,
    },
    status: {
      type: String,
      enum: ['Critical', 'Low Stock', 'Available'],
      default: 'Available',
    },
    source: {
      type: String,
      enum: ['Donor Portal', 'Manual Audit', 'Hospital Transfer', 'Camp Collection'],
      default: 'Manual Audit',
    },
    expiryDate: {
      type: Date,
    },
    location: {
      facility: { type: String, default: 'Central Blood Bank' },
      zone: String,
      storageUnit: String,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Indexes
bloodInventorySchema.index({ bloodGroup: 1 }, { unique: true });
bloodInventorySchema.index({ status: 1 });
bloodInventorySchema.index({ expiryDate: 1 });

// Auto-calculate status before save
bloodInventorySchema.pre('save', function (next) {
  const ratio = this.units / this.capacity;
  if (ratio <= 0.1) {
    this.status = 'Critical';
  } else if (ratio <= 0.3) {
    this.status = 'Low Stock';
  } else {
    this.status = 'Available';
  }
  next();
});

// Virtual: utilization percentage
bloodInventorySchema.virtual('utilization').get(function () {
  return Math.round((this.units / this.capacity) * 100);
});

module.exports = mongoose.model('BloodInventory', bloodInventorySchema);
