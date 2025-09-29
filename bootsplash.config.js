module.exports = {
  projectRoot: __dirname,
  watchFolders: [__dirname],
  resolver: {
    platforms: ['ios', 'android'],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  // Bootsplash configuration
  bootsplash: {
    logoPath: './assets/splashy.png',
    logoWidth: 100, // Reduced from 130
    logoHeight: 21, // Reduced from 27 (maintaining aspect ratio)
    backgroundColor: '#EC066A',
    darkMode: {
      logoPath: './assets/splashy.png',
      backgroundColor: '#EC066A'
    }
  }
}; 