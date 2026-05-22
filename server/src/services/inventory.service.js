const BloodInventory = require('../models/BloodInventory');
const ApiError = require('../utils/ApiError');
const cache = require('./cache.service');
const { buildPaginationQuery, buildPaginationResponse } = require('../utils/pagination');

const CACHE_PREFIX = 'inventory:';

const getAllInventory = async (query) => {
  const { page, limit, skip, sort } = buildPaginationQuery(query);

  const filter = {};
  if (query.bloodGroup) filter.bloodGroup = query.bloodGroup;
  if (query.status) filter.status = query.status;

  const [data, total] = await Promise.all([
    BloodInventory.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    BloodInventory.countDocuments(filter),
  ]);

  return { data, pagination: buildPaginationResponse(total, page, limit) };
};

const getInventoryById = async (id) => {
  const cached = cache.get(`${CACHE_PREFIX}${id}`);
  if (cached) return cached;

  const item = await BloodInventory.findById(id);
  if (!item) throw ApiError.notFound('Inventory item not found');

  cache.set(`${CACHE_PREFIX}${id}`, item);
  return item;
};

const addInventory = async (data, userId) => {
  data.lastUpdatedBy = userId;
  const item = await BloodInventory.create(data);
  cache.deletePattern(CACHE_PREFIX);
  return item;
};

const updateInventory = async (id, data, userId) => {
  data.lastUpdatedBy = userId;
  const item = await BloodInventory.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!item) throw ApiError.notFound('Inventory item not found');

  // Recalculate status
  const ratio = item.units / item.capacity;
  if (ratio <= 0.1) item.status = 'Critical';
  else if (ratio <= 0.3) item.status = 'Low Stock';
  else item.status = 'Available';
  await item.save();

  cache.deletePattern(CACHE_PREFIX);
  return item;
};

const checkAvailability = async (bloodGroup) => {
  const cacheKey = `${CACHE_PREFIX}avail:${bloodGroup}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const items = await BloodInventory.find({ bloodGroup }).lean();
  const totalUnits = items.reduce((sum, i) => sum + i.units, 0);
  const result = {
    bloodGroup,
    totalUnits,
    items,
    isAvailable: totalUnits > 0,
  };

  cache.set(cacheKey, result, 60000); // 1 minute cache
  return result;
};

module.exports = { getAllInventory, getInventoryById, addInventory, updateInventory, checkAvailability };
