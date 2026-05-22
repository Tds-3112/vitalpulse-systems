const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const inventoryValidator = require('../validators/inventory.validator');

/**
 * @swagger
 * /inventory:
 *   get:
 *     tags: [Inventory]
 *     summary: Get all inventory items
 *     parameters:
 *       - in: query
 *         name: bloodGroup
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Critical, Low Stock, Available] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: Inventory list }
 */
router.get('/', authenticate, authorize('admin', 'hospital'), inventoryController.getAll);

/**
 * @swagger
 * /inventory/{id}:
 *   get:
 *     tags: [Inventory]
 *     summary: Get inventory item by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Inventory item }
 */
router.get('/:id', authenticate, authorize('admin', 'hospital'), inventoryController.getById);

/**
 * @swagger
 * /inventory:
 *   post:
 *     tags: [Inventory]
 *     summary: Add blood units (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bloodGroup, units]
 *             properties:
 *               bloodGroup: { type: string, enum: ["A+","A-","B+","B-","AB+","AB-","O+","O-"] }
 *               units: { type: integer, example: 100 }
 *               capacity: { type: integer, example: 500 }
 *               source: { type: string }
 *     responses:
 *       201: { description: Inventory added }
 */
router.post('/', authenticate, authorize('admin', 'hospital'), validate(inventoryValidator.addInventory), inventoryController.add);

/**
 * @swagger
 * /inventory/{id}:
 *   patch:
 *     tags: [Inventory]
 *     summary: Update inventory (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Inventory updated }
 */
router.patch('/:id', authenticate, authorize('admin', 'hospital'), validate(inventoryValidator.updateInventory), inventoryController.update);

/**
 * @swagger
 * /inventory/availability/{bloodGroup}:
 *   get:
 *     tags: [Inventory]
 *     summary: Check blood availability
 *     parameters:
 *       - in: path
 *         name: bloodGroup
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Availability info }
 */
router.get('/availability/:bloodGroup', authenticate, inventoryController.checkAvailability);

module.exports = router;
