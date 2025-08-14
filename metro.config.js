// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add better error handling for JSON parsing
config.resolver.platforms = ['ios', 'android', 'native', 'web'];
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Add error handling for symbolication and disable problematic features
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    return (req, res, next) => {
      // Skip symbolication requests that cause JSON parsing errors
      if (req.url && req.url.includes('symbolicate')) {
        console.log('Skipping symbolication request to avoid JSON parsing errors');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          result: { 
            stack: [{ 
              file: 'unknown', 
              lineNumber: 0, 
              column: 0, 
              methodName: 'unknown' 
            }] 
          } 
        }));
        return;
      }
      return middleware(req, res, next);
    };
  },
};

// Disable symbolication completely to avoid JSON parsing issues
config.symbolicator = {
  customizeFrame: () => null,
};

module.exports = config;
