/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
    serverComponentsExternalPackages: ['sharp', 'adm-zip', 'exceljs', 'nodemailer'],
  },
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        ...(Array.isArray(config.watchOptions?.ignored) ? config.watchOptions.ignored : []),
        '**/System Volume Information/**',
      ],
    }
    return config
  },
}
export default nextConfig
