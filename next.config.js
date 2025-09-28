module.exports = {
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  // Optimize build performance
  experimental: {
    workerThreads: false,
    cpus: 1
  },
  // Configure timeouts
  staticPageGenerationTimeout: 60,
  // Better error handling
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 2,
  },
  // Reduce build memory usage
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    return config
  }
}