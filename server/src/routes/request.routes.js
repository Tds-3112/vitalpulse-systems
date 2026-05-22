const express = require('express');
const router = express.Router();
const requestController = require('../controllers/request.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const requestValidator = require('../validators/request.validator');

/**
 * @swagger
 * /requests:
 *   get:
 *     tags: [Requests]
 *     summary: Get all blood requests (Admin only)
 *     parameters:
 *       - in: query
 *         name: bloodGroup
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Pending, Approved, Dispatched, Fulfilled, Rejected] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [Emergency, Normal] }
 *     responses:
 *       200: { description: Requests list }
 */
router.get('/', authenticate, authorize('admin', 'hospital'), requestController.getAll);

/**
 * @swagger
 * /requests/my:
 *   get:
 *     tags: [Requests]
 *     summary: Get my requests (Hospital only)
 *     responses:
 *       200: { description: Your requests }
 */
router.get('/my', authenticate, authorize('hospital'), requestController.getMyRequests);

/**
 * @swagger
 * /requests:
 *   post:
 *     tags: [Requests]
 *     summary: Create blood request (Hospital only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bloodGroup, units]
 *             properties:
 *               bloodGroup: { type: string, enum: ["A+","A-","B+","B-","AB+","AB-","O+","O-"] }
 *               units: { type: integer, example: 5 }
 *               priority: { type: string, enum: [Emergency, Normal], default: Normal }
 *               reason: { type: string }
 *               patientName: { type: string }
 *     responses:
 *       201: { description: Request created }
 */
router.post('/', authenticate, authorize('hospital'), validate(requestValidator.createRequest), requestController.create);

/**
 * @swagger
 * /requests/{id}/status:
 *   patch:
 *     tags: [Requests]
 *     summary: Update request status (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Status updated }
 */
router.patch('/:id/status', authenticate, authorize('admin', 'hospital'), validate(requestValidator.updateRequestStatus), requestController.updateStatus);

/**
 * @swagger
 * /requests/{id}/cancel:
 *   patch:
 *     tags: [Requests]
 *     summary: Cancel own request (Hospital only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Request cancelled }
 */
router.patch('/:id/cancel', authenticate, authorize('admin', 'hospital'), requestController.cancelMyRequest);

module.exports = router;
