/**
 * Global Test Teardown
 * Runs after all tests
 */

module.exports = async () => {
  console.log('🧹 Cleaning up test environment...');
  
  // Cleanup any test databases, files, or processes
  // This runs after all tests have completed
  
  console.log('✅ Test environment cleanup completed');
};