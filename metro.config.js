const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add woff and woff2 to asset extensions
config.resolver.assetExts.push('woff', 'woff2');

module.exports = config;
