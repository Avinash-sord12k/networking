import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0', // Allow external connections
    port: 5173,
    strictPort: true,
    // Allow any host header (important for tunneling)
    allowedHosts: 'all',
    // Disable host checking
    disableHostCheck: true,
    headers: {
      // Add CORS headers for cross-origin requests
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    }
  }
})