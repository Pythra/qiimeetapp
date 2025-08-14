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
    logoWidth: 130, // Increased from 105
    logoHeight: 27, // Increased from 22 (maintaining aspect ratio)
    backgroundColor: '#EC066A',
    darkMode: {
      logoPath: './assets/splashy.png',
      backgroundColor: '#EC066A'
    }
  }
}; 