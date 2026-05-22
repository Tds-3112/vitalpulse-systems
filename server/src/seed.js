const User = require('./models/User');
const BloodInventory = require('./models/BloodInventory');
const Donation = require('./models/Donation');
const Request = require('./models/Request');
const logger = require('./utils/logger');

const seed = async () => {
  try {
    // Check if data already exists
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      logger.info('Database already seeded, skipping...');
      return;
    }

    logger.info('Seeding database with sample data...');

    // ========================
    // Create Users
    // ========================
    const admin = await User.create({
      name: 'Dr. Sarah Chen',
      email: 'admin@vitalpulse.com',
      password: 'admin123',
      role: 'admin',
      bloodGroup: 'O+',
      phone: '555-0100',
      organizationName: 'Central Blood Bank',
      isActive: true,
    });

    const donors = await User.create([
      {
        name: 'Julianne Smith',
        email: 'julianne@example.com',
        password: 'donor123',
        role: 'donor',
        bloodGroup: 'O+',
        phone: '555-0101',
        isActive: true,
        donationCount: 3,
      },
      {
        name: 'Marcus Rodriguez',
        email: 'marcus@example.com',
        password: 'donor123',
        role: 'donor',
        bloodGroup: 'AB-',
        phone: '555-0102',
        isActive: true,
        donationCount: 5,
      },
      {
        name: 'Elena Lund',
        email: 'elena@example.com',
        password: 'donor123',
        role: 'donor',
        bloodGroup: 'O-',
        phone: '555-0103',
        isActive: true,
        donationCount: 2,
      },
      {
        name: "James D'Angelo",
        email: 'james@example.com',
        password: 'donor123',
        role: 'donor',
        bloodGroup: 'A+',
        phone: '555-0104',
        isActive: true,
        donationCount: 1,
      },
      {
        name: 'Linda Wu',
        email: 'linda@example.com',
        password: 'donor123',
        role: 'donor',
        bloodGroup: 'B-',
        phone: '555-0105',
        isActive: true,
        donationCount: 4,
      },
    ]);

    const hospitals = await User.create([
      {
        name: 'St. Jude General Hospital',
        email: 'stjude@hospital.com',
        password: 'hospital123',
        role: 'hospital',
        phone: '555-0200',
        organizationName: 'St. Jude General Hospital',
        isActive: true,
      },
      {
        name: 'City Trauma Center',
        email: 'citytrauma@hospital.com',
        password: 'hospital123',
        role: 'hospital',
        phone: '555-0201',
        organizationName: 'City Trauma Center',
        isActive: true,
      },
      {
        name: 'North Hills Pediatrics',
        email: 'northhills@hospital.com',
        password: 'hospital123',
        role: 'hospital',
        phone: '555-0202',
        organizationName: 'North Hills Pediatrics',
        isActive: true,
      },
    ]);

    // ========================
    // Create Blood Inventory
    // ========================
    await BloodInventory.create([
      { bloodGroup: 'O-', units: 42, capacity: 500, source: 'Donor Portal', lastUpdatedBy: admin._id },
      { bloodGroup: 'A+', units: 842, capacity: 1000, source: 'Manual Audit', lastUpdatedBy: admin._id },
      { bloodGroup: 'B-', units: 112, capacity: 400, source: 'Hospital Transfer', lastUpdatedBy: admin._id },
      { bloodGroup: 'A-', units: 14, capacity: 100, source: 'Manual Audit', lastUpdatedBy: admin._id },
      { bloodGroup: 'B+', units: 65, capacity: 200, source: 'Manual Audit', lastUpdatedBy: admin._id },
      { bloodGroup: 'AB+', units: 22, capacity: 100, source: 'Manual Audit', lastUpdatedBy: admin._id },
      { bloodGroup: 'AB-', units: 8, capacity: 50, source: 'Manual Audit', lastUpdatedBy: admin._id },
      { bloodGroup: 'O+', units: 120, capacity: 200, source: 'Manual Audit', lastUpdatedBy: admin._id },
    ]);

    // ========================
    // Create Donations
    // ========================
    await Donation.create([
      {
        donor: donors[2]._id,
        bloodGroup: 'O+',
        units: 1,
        volume: 450,
        donationType: 'Whole Blood',
        status: 'Completed',
        facility: 'Central Blood Bank',
        collectedBy: admin._id,
      },
      {
        donor: donors[0]._id,
        bloodGroup: 'A-',
        units: 1,
        volume: 500,
        donationType: 'Platelets',
        status: 'Processing',
        facility: 'Central Blood Bank',
        collectedBy: admin._id,
      },
      {
        donor: donors[3]._id,
        bloodGroup: 'B+',
        units: 1,
        volume: 450,
        donationType: 'Whole Blood',
        status: 'Cancelled',
        facility: 'Central Blood Bank',
        notes: 'Donor felt dizzy during screening',
      },
      {
        donor: donors[1]._id,
        bloodGroup: 'O-',
        units: 1,
        volume: 500,
        donationType: 'Whole Blood',
        status: 'Completed',
        facility: 'Central Blood Bank',
        collectedBy: admin._id,
      },
    ]);

    // ========================
    // Create Blood Requests
    // ========================
    await Request.create([
      {
        hospital: hospitals[0]._id,
        bloodGroup: 'O-',
        units: 5,
        priority: 'Emergency',
        status: 'Pending',
        reason: 'Emergency surgery - multiple trauma patient',
        patientName: 'John Doe',
      },
      {
        hospital: hospitals[1]._id,
        bloodGroup: 'A+',
        units: 12,
        priority: 'Normal',
        status: 'Approved',
        eta: '20m',
        reason: 'Scheduled surgeries for the week',
        processedBy: admin._id,
        processedAt: new Date(),
      },
      {
        hospital: hospitals[2]._id,
        bloodGroup: 'B+',
        units: 2,
        priority: 'Normal',
        status: 'Fulfilled',
        reason: 'Pediatric transfusion',
        patientName: 'Emily Carter',
        processedBy: admin._id,
        processedAt: new Date(Date.now() - 3600000),
      },
    ]);

    logger.info('Database seeded successfully!');
    logger.info('===========================================');
    logger.info('  Admin Login:  admin@vitalpulse.com / admin123');
    logger.info('  Donor Login:  julianne@example.com / donor123');
    logger.info('  Hospital Login: stjude@hospital.com / hospital123');
    logger.info('===========================================');
  } catch (error) {
    logger.error('Seed error:', error);
  }
};

module.exports = seed;
