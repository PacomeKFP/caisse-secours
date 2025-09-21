/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  output: 'standalone', // Nécessaire pour le build Electron
  turbopack: {
    // Turbopack is now stable
  },
  typescript:{
    ignoreBuildErrors: true
  }
}

module.exports = nextConfig