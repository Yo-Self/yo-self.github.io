const { createClient } = require('@supabase/supabase-js');

class DatabaseHelper {
  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    this.supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    this.client = null;
    this.isConnected = false;
  }

  async initialize() {
    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      console.warn('⚠️  Supabase credentials not found. Database tests will be skipped.');
      return false;
    }

    try {
      this.client = createClient(this.supabaseUrl, this.supabaseAnonKey);
      
      // Test connection with a simple query
      const { data, error } = await this.client
        .from('restaurants')
        .select('id')
        .limit(1);

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
      const { data, error } = await this.client
        .from('restaurants')
        .select('id')
        .eq('slug', slug)
        .single();

      return !error && data;
    } catch {
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
      const { data, error } = await this.client
        .from('restaurants')
        .select('slug, name')
        .limit(1)
        .single();

      if (error || !data) {
        return {
          slug: 'auri-monteiro',
          name: 'Auri Monteiro',
          isTest: true
        };
      }

      return { ...data, isTest: false };
    } catch {
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
      const { data, error } = await this.client
        .from('dishes')
        .select('id, name, price')
        .eq('restaurant_id', restaurantId)
        .limit(5);

      return error ? [] : data;
    } catch {
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
}

module.exports = { DatabaseHelper };
