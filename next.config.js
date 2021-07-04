const withPWA = require('next-pwa')

module.exports = withPWA({
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  pwa: {
    dest: 'public'
  }
})