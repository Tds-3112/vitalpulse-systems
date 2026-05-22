const mongoose = require('mongoose');

const transactionLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'USER_REGISTERED',
        'USER_LOGIN',
        'USER_LOGOUT',
        'INVENTORY_ADDED',
        'INVENTORY_UPDATED',
        'DONATION_CREATED',
        'DONATION_STATUS_UPDATED',
        'REQUEST_CREATED',
        'REQUEST_STATUS_UPDATED',
        'USER_UPDATED',
        'USER_DELETED',
      ],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    targetModel: {
      type: String,
      enum: ['User', 'BloodInventory', 'Donation', 'Request'],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
transactionLogSchema.index({ action: 1 });
transactionLogSchema.index({ performedBy: 1 });
transactionLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

// Static method to create a log entry
transactionLogSchema.statics.log = async function (data) {
  return this.create(data);
};

module.exports = mongoose.model('TransactionLog', transactionLogSchema);
