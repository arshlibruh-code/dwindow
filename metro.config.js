const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for CSS files
config.resolver.assetExts.push('css');

// Add support for mapbox-gl CSS
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
