const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donation.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const donationValidator = require('../validators/donation.validator');

/**
 * @swagger
 * /donations:
 *   get:
 *     tags: [Donations]
 *     summary: Get all donations (Admin only)
 *     parameters:
 *       - in: query
 *         name: bloodGroup
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Completed, Processing, Cancelled, Scheduled] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: Donations list }
 */
router.get('/', authenticate, authorize('admin'), donationController.getAll);

/**
 * @swagger
 * /donations/my:
 *   get:
 *     tags: [Donations]
 *     summary: Get my donations (Donor only)
 *     responses:
 *       200: { description: Your donations }
 */
router.get('/my', authenticate, authorize('donor'), donationController.getMyDonations);

/**
 * @swagger
 * /donations:
 *   post:
 *     tags: [Donations]
 *     summary: Create donation record
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bloodGroup]
 *             properties:
 *               bloodGroup: { type: string, enum: ["A+","A-","B+","B-","AB+","AB-","O+","O-"] }
 *               units: { type: integer, default: 1 }
 *               volume: { type: integer, default: 450 }
 *               donationType: { type: string, enum: [Whole Blood, Platelets, Plasma, Double Red Cells] }
 *               notes: { type: string }
 *     responses:
 *       201: { description: Donation created }
 */
router.post('/', authenticate, authorize('admin', 'donor'), validate(donationValidator.createDonation), donationController.create);

/**
 * @swagger
 * /donations/{id}/status:
 *   patch:
 *     tags: [Donations]
 *     summary: Update donation status (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Status updated }
 */
router.patch('/:id/status', authenticate, authorize('admin'), validate(donationValidator.updateDonationStatus), donationController.updateStatus);

module.exports = router;
