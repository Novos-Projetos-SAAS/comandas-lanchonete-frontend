/** @type {import('next').NextConfig} */
function obterBackendDestino() {
  const configurado = process.env.BACKEND_URL
    || (process.env.NEXT_PUBLIC_API_URL?.startsWith('http') ? process.env.NEXT_PUBLIC_API_URL : '')
    || process.env.DEV_BACKEND_PROXY
    || (process.env.NODE_ENV !== 'production' ? 'http://localhost:3001' : '');

  if (!configurado) {
    throw new Error('Configure BACKEND_URL no ambiente de produção.');
  }

  return configurado
    .replace(/\/api\/?$/, '')
    .replace(/\/$/, '');
}

const backend = obterBackendDestino();

const nextConfig = {
  async rewrites() {
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
