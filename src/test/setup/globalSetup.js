/**
 * Global Test Setup
 * Runs before all tests
 */

module.exports = async () => {
  console.log('🧪 Starting test environment setup...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.NEXT_PUBLIC_API_PATH = 'http://localhost:5000/api';
  process.env.MONGODB_URI = 'mongodb://localhost:27017/tskulis-test';
  
  console.log('✅ Test environment setup completed');
};