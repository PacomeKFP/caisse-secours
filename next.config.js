/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  turbopack: {
    // Turbopack is now stable
  },
  typescript:{
    ignoreBuildErrors: true
  }
}

module.exports = nextConfig