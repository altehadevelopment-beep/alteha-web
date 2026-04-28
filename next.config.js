/** @type {import('next').NextConfig} */
const nextConfig = {
    // Skip TypeScript type-checking during build (avoids hanging with face-api.js / TensorFlow)
    typescript: {
        ignoreBuildErrors: true,
    },
    // Skip ESLint during build
    eslint: {
        ignoreDuringBuilds: true,
    },
    webpack: (config, { isServer }) => {
        // Fix 'encoding' module warning from node-fetch / TensorFlow
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            encoding: false,
        };

        // Externalize heavy server-side native modules to avoid bundling issues
        if (isServer) {
            config.externals = [...(config.externals || []), 'encoding'];
        }

        return config;
    },
};

module.exports = nextConfig;
