/** @type {import('next').NextConfig} */
<<<<<<< Updated upstream
const nextConfig = {};
=======
const nextConfig = {
  allowedDevOrigins: [
    '*.trycloudflare.com'
  ],

  async rewrites() {
    if (process.env.NODE_ENV === 'production') return [];

    const backend = process.env.DEV_BACKEND_PROXY || 'http://127.0.0.1:3001';

    return [
      {
        source: '/api/:path*',
        destination: `${backend}/api/:path*`
      },
      {
        source: '/socket.io/:path*',
        destination: `${backend}/socket.io/:path*`
      }
    ];
  }
};
>>>>>>> Stashed changes

export default nextConfig;
