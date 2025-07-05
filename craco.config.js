module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          http: false,
          https: false,
          stream: false,
          zlib: false,
          util: false,
          url: false,
          crypto: false,
          assert: false
        }
      }
    }
  }
}; 