import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let userConfig = undefined;
try {
  const userConfigPath = './v0-user-next.config.js';
  if (fs.existsSync(userConfigPath)) {
    userConfig = (await import(userConfigPath)).default;
  }
} catch (e) {
  console.error("Failed to load user config", e);
}

/** @type {import('next').NextConfig} */
let nextConfig = {
  env: {
    // pdf-parseのデバッグモードを無効化
    PDF_PARSE_DEBUG: 'false',
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
};

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return;
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      };
    } else {
      nextConfig[key] = userConfig[key];
    }
  }
}

if (userConfig) {
  mergeConfig(nextConfig, userConfig);
}

export default nextConfig;
