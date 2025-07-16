import { useFonts } from 'expo-font';
import { fontPaths } from '../constants/font';

export const useFontsLoaded = () => {
  const [fontsLoaded] = useFonts(fontPaths);
  return fontsLoaded;
};
