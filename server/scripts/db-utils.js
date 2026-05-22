const mongoose = require('mongoose');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
require('dotenv').config({ path: envPath });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/vitalpulse',
  isDev: process.env.NODE_ENV === 'development',
};

const logger = require('../src/utils/logger');
const User = require('../src/models/User');
const BloodInventory = require('../src/models/BloodInventory');
const Donation = require('../src/models/Donation');
const Request = require('../src/models/Request');
const TransactionLog = require('../src/models/TransactionLog');

const MODELS = [
  { name: 'User', model: User },
  { name: 'BloodInventory', model: BloodInventory },
  { name: 'Donation', model: Donation },
  { name: 'Request', model: Request },
  { name: 'TransactionLog', model: TransactionLog },
];

const rebuildIndexes = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vitalpulse';
    
    console.log('\n🔧 Connecting to MongoDB...');
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected\n');

    console.log('🔨 Rebuilding indexes...\n');

    for (const { name, model } of MODELS) {
      try {
        console.log(`  📊 ${name}...`);
        
        await model.collection.dropIndexes();
        console.log(`     ✓ Dropped old indexes`);
        
        await model.ensureIndexes();
        console.log(`     ✓ Rebuilt indexes`);
        
      } catch (err) {
        if (err.code === 86) {
          console.log(`     ⚠ Duplicate key error - ${err.message}`);
        } else {
          console.log(`     ✗ Error: ${err.message}`);
        }
      }
    }

    console.log('\n✅ Index rebuild complete!');
    console.log('\n📋 Current indexes:\n');

    for (const { name, model } of MODELS) {
      const indexes = await model.collection.indexes();
      console.log(`  ${name}:`);
      for (const idx of indexes) {
        console.log(`    - ${idx.name}: ${JSON.stringify(idx.key)}`);
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected\n');
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}\n`);
    process.exit(1);
  }
};

const cleanExpiredLogs = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vitalpulse';
    
    console.log('\n🧹 Connecting to MongoDB...');
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected\n');

    console.log('🗑️  Cleaning expired transaction logs...');
    
    const result = await TransactionLog.collection.deleteMany({
      createdAt: { $lt: new Date(Date.now() - 7776000000) }
    });
    
    console.log(`  ✅ Deleted ${result.deletedCount} expired logs\n`);

    await mongoose.disconnect();
    console.log('✅ Disconnected\n');
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}\n`);
    process.exit(1);
  }
};

const fixDuplicateBloodGroups = async () => {
  try {
    console.log('\n🔧 Starting in-memory MongoDB with test data...');
    
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    
    await mongoose.connect(uri, { maxPoolSize: 10 });
    console.log('✅ Connected\n');

    // Seed test data with duplicates
    console.log('📦 Creating test data with duplicate bloodGroups...');
    
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'test123',
      role: 'admin',
      isActive: true,
    });

    // Create multiple records for same bloodGroup (duplicates)
    for (let i = 0; i < 3; i++) {
      await BloodInventory.create({
        bloodGroup: 'O+',
        units: 10 + i * 5,
        capacity: 100,
        lastUpdatedBy: admin._id,
      });
    }
    
    await BloodInventory.create([
      { bloodGroup: 'A+', units: 20, capacity: 100 },
      { bloodGroup: 'B+', units: 30, capacity: 100 },
    ]);
    
    const dupCount = await BloodInventory.countDocuments({ bloodGroup: 'O+' });
    console.log(`  Created ${dupCount} O+ records (duplicates)\n`);

    console.log('🔧 Running fixDuplicateBloodGroups...');
    
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    let fixed = 0;

    for (const bg of bloodGroups) {
      const records = await BloodInventory.find({ bloodGroup: bg }).sort({ units: -1 });
      
      if (records.length > 1) {
        console.log(`  📦 ${bg}: ${records.length} records found`);
        
        const keep = records[0];
        const toDelete = records.slice(1);
        
        for (const doc of toDelete) {
          await BloodInventory.findByIdAndDelete(doc._id);
          console.log(`    - Deleted duplicate (${doc.units} units)`);
        }
        
        console.log(`    - Kept (${keep.units} units)`);
        fixed++;
      }
    }

    if (fixed > 0) {
      console.log(`\n✅ Fixed ${fixed} duplicate(s)!`);
      console.log('🔨 Rebuilding indexes...\n');
      await BloodInventory.collection.dropIndexes();
      await BloodInventory.ensureIndexes();
      console.log('✅ Indexes rebuilt\n');
    } else {
      console.log('✅ No duplicates found\n');
    }

    const finalCount = await BloodInventory.countDocuments();
    console.log(`📊 Final BloodInventory count: ${finalCount}`);
    
    const invList = await BloodInventory.find().sort({ bloodGroup: 1 });
    console.log('\n📦 Remaining inventory:');
    for (const inv of invList) {
      console.log(`  ${inv.bloodGroup}: ${inv.units} units`);
    }

    await mongoose.disconnect();
    await mongod.stop();
    console.log('\n✅ Disconnected and stopped\n');
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}\n`);
    process.exit(1);
  }
};

const testInMemory = async () => {
  try {
    console.log('\n🔧 Starting in-memory MongoDB...');
    
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to in-memory MongoDB\n');

    console.log('🔨 Testing index rebuild...\n');

    for (const { name, model } of MODELS) {
      try {
        console.log(`  📊 ${name}...`);
        await model.ensureIndexes();
        console.log(`     ✓ Indexes created`);
      } catch (err) {
        console.log(`     ✗ Error: ${err.message}`);
      }
    }

    console.log('\n✅ Index rebuild test complete!');
    
    const userCount = await User.countDocuments();
    const invCount = await BloodInventory.countDocuments();
    const donCount = await Donation.countDocuments();
    const reqCount = await Request.countDocuments();
    const logCount = await TransactionLog.countDocuments();
    
    console.log(`\n📊 Database Stats:`);
    console.log(`  Users: ${userCount}`);
    console.log(`  BloodInventory: ${invCount}`);
    console.log(`  Donations: ${donCount}`);
    console.log(`  Requests: ${reqCount}`);
    console.log(`  TransactionLogs: ${logCount}`);

    await mongoose.disconnect();
    await mongod.stop();
    console.log('\n✅ Disconnected and stopped\n');
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}\n`);
    process.exit(1);
  }
};

const COMMAND = process.argv[2];

if (COMMAND === 'rebuild') {
  rebuildIndexes();
} else if (COMMAND === 'clean') {
  cleanExpiredLogs();
} else if (COMMAND === 'fix') {
  fixDuplicateBloodGroups();
} else if (COMMAND === 'test') {
  testInMemory();
} else {
  console.log(`
🔧 VitalPulse Database Utilities

Usage: node scripts/db-utils.js <command>

Commands:
  rebuild   - Rebuild all indexes on all models
  clean     - Clean expired transaction logs (90+ days)
  fix       - Fix duplicate bloodGroup records in BloodInventory

Examples:
  node scripts/db-utils.js rebuild
  node scripts/db-utils.js clean
  node scripts/db-utils.js fix
  `);
  process.exit(0);
}