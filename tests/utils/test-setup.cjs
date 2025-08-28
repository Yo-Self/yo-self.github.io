const { DatabaseHelper } = require('./database-helper.cjs');

class TestSetup {
  constructor() {
    this.dbHelper = null;
    this.testData = null;
  }

  async initialize() {
    this.dbHelper = new DatabaseHelper();
    const isConnected = await this.dbHelper.initialize();
    
    if (isConnected) {
      console.log('✅ Test setup: Database connection established');
      this.testData = {
        restaurant: await this.dbHelper.getTestRestaurant(),
        hasDatabase: true
      };
    } else {
      console.log('⚠️  Test setup: Using fallback data (no database)');
      this.testData = {
        restaurant: {
          slug: 'auri-monteiro',
          name: 'Auri Monteiro',
          isTest: true
        },
        hasDatabase: false
      };
    }

    return this.testData;
  }

  skipDatabaseTests(test) {
    if (!this.testData?.hasDatabase) {
      test.skip();
      console.log('⏭️  Skipping database-dependent test');
    }
  }

  getTestRestaurant() {
    return this.testData?.restaurant || {
      slug: 'auri-monteiro', 
      name: 'Auri Monteiro',
      isTest: true
    };
  }

  isDatabaseAvailable() {
    return this.testData?.hasDatabase || false;
  }
}

module.exports = { TestSetup };
