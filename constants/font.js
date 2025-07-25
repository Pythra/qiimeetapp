export const FONTS = {
  regular: 'PlusJakartaSans-Regular',
  semiBold: 'PlusJakartaSans-SemiBold',
  bold: 'PlusJakartaSans-Bold',
  medium: 'PlusJakartaSans-SemiBold', // Added medium alias
};

export const fontPaths = {
  [FONTS.regular]: require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
  [FONTS.semiBold]: require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
  [FONTS.bold]: require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
};