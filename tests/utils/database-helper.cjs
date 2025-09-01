const { createClient } = require('@supabase/supabase-js');

class DatabaseHelper {
  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    this.supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    this.client = null;
    this.isConnected = false;
    this.connectionTimeout = 10000; // 10 seconds timeout
    this.queryTimeout = 5000; // 5 seconds timeout for queries
  }

  async initialize() {
    // Force fallback mode when API calls are disabled
    if (process.env.DISABLE_API_CALLS === 'true') {
      console.log('🧪 Test mode: Database connections disabled, using fallback data');
      this.isConnected = false;
      return false;
    }

    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      console.warn('⚠️  Supabase credentials not found. Database tests will be skipped.');
      return false;
    }

    try {
      this.client = createClient(this.supabaseUrl, this.supabaseAnonKey);
      
      // Test connection with timeout
      const connectionPromise = this.client
        .from('restaurants')
        .select('id')
        .limit(1);

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), this.connectionTimeout)
      );

      const { data, error } = await Promise.race([connectionPromise, timeoutPromise]);

      if (error) {
        console.warn('⚠️  Database connection failed:', error.message);
        return false;
      }

      this.isConnected = true;
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.warn('⚠️  Failed to initialize database:', error.message);
      return false;
    }
  }

  async checkRestaurantExists(slug) {
    if (!this.isConnected) return false;

    try {
      const queryPromise = this.client
        .from('restaurants')
        .select('id')
        .eq('slug', slug)
        .single();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), this.queryTimeout)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      return !error && data;
    } catch (error) {
      console.warn(`⚠️  Query timeout for slug ${slug}:`, error.message);
      return false;
    }
  }

  async getTestRestaurant() {
    if (!this.isConnected) {
      // Return fallback data when database is not available
      return {
        slug: 'auri-monteiro',
        name: 'Auri Monteiro',
        isTest: true
      };
    }

    try {
      const queryPromise = this.client
        .from('restaurants')
        .select('slug, name')
        .limit(1)
        .single();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), this.queryTimeout)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error || !data) {
        return {
          slug: 'auri-monteiro',
          name: 'Auri Monteiro',
          isTest: true
        };
      }

      return { ...data, isTest: false };
    } catch (error) {
      console.warn('⚠️  Failed to get test restaurant, using fallback:', error.message);
      return {
        slug: 'auri-monteiro',
        name: 'Auri Monteiro',
        isTest: true
      };
    }
  }

  async getTestDishes(restaurantId) {
    if (!this.isConnected) return [];

    try {
      const queryPromise = this.client
        .from('dishes')
        .select('id, name, price')
        .eq('restaurant_id', restaurantId)
        .limit(5);

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), this.queryTimeout)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      return error ? [] : data;
    } catch (error) {
      console.warn('⚠️  Failed to get test dishes, using empty array:', error.message);
      return [];
    }
  }

  isAvailable() {
    return this.isConnected;
  }

  skipIfDatabaseUnavailable(testInstance, message = 'Database not available') {
    if (!this.isConnected) {
      testInstance.skip();
      console.log(`⏭️  Skipping test: ${message}`);
    }
  }

  // Add method to force fallback mode for testing
  forceFallbackMode() {
    this.isConnected = false;
    console.log('🔄 Forcing fallback mode for tests');
  }
}

module.exports = { DatabaseHelper };
