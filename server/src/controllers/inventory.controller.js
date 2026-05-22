const inventoryService = require('../services/inventory.service');
const TransactionLog = require('../models/TransactionLog');
const ApiResponse = require('../utils/ApiResponse');

const getAll = async (req, res, next) => {
  try {
    const { data, pagination } = await inventoryService.getAllInventory(req.query);
    ApiResponse.paginated(res, 'Inventory retrieved', data, pagination);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const item = await inventoryService.getInventoryById(req.params.id);
    ApiResponse.success(res, 'Inventory item retrieved', item);
  } catch (error) {
    next(error);
  }
};

const add = async (req, res, next) => {
  try {
    const item = await inventoryService.addInventory(req.body, req.user._id);

    await TransactionLog.log({
      action: 'INVENTORY_ADDED',
      performedBy: req.user._id,
      targetModel: 'BloodInventory',
      targetId: item._id,
      details: { bloodGroup: item.bloodGroup, units: item.units },
      ipAddress: req.ip,
    });

    ApiResponse.created(res, 'Blood inventory added', item);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const item = await inventoryService.updateInventory(req.params.id, req.body, req.user._id);

    await TransactionLog.log({
      action: 'INVENTORY_UPDATED',
      performedBy: req.user._id,
      targetModel: 'BloodInventory',
      targetId: item._id,
      details: req.body,
      ipAddress: req.ip,
    });

    ApiResponse.success(res, 'Inventory updated', item);
  } catch (error) {
    next(error);
  }
};

const checkAvailability = async (req, res, next) => {
  try {
    const result = await inventoryService.checkAvailability(req.params.bloodGroup);
    ApiResponse.success(res, 'Availability check', result);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, add, update, checkAvailability };
