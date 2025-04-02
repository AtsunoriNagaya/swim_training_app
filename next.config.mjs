let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ignoreDuringBuilds: true, // 削除
  },
  typescript: {
    // ignoreBuildErrors: true,  // 削除
  },
  images: {
    unoptimized: false, // false に変更
  },
  experimental: {
    // webpackBuildWorker: true, // 削除
    // parallelServerBuildTraces: true, // 削除
    // parallelServerCompiles: true,  // 削除
  },
}

mergeConfig(nextConfig, userConfig)

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      }
    } else {
      nextConfig[key] = userConfig[key]
    }
  }
}

export default nextConfig
