const User = require('../models/User');
const TransactionLog = require('../models/TransactionLog');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { buildPaginationQuery, buildPaginationResponse } = require('../utils/pagination');

const getAll = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPaginationQuery(req.query);

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.bloodGroup) filter.bloodGroup = req.query.bloodGroup;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    ApiResponse.paginated(res, 'Users retrieved', data, buildPaginationResponse(total, page, limit));
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw ApiError.notFound('User not found');
    ApiResponse.success(res, 'User retrieved', user);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    // Prevent updating password through this route
    delete req.body.password;
    delete req.body.refreshToken;

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) throw ApiError.notFound('User not found');

    await TransactionLog.log({
      action: 'USER_UPDATED',
      performedBy: req.user._id,
      targetModel: 'User',
      targetId: user._id,
      details: req.body,
      ipAddress: req.ip,
    });

    ApiResponse.success(res, 'User updated', user);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) throw ApiError.notFound('User not found');

    await TransactionLog.log({
      action: 'USER_DELETED',
      performedBy: req.user._id,
      targetModel: 'User',
      targetId: user._id,
      ipAddress: req.ip,
    });

    ApiResponse.success(res, 'User deactivated', user);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, update, remove };
