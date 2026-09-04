/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    '192.168.0.225',
    '10.0.0.5',
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

export default nextConfig;
