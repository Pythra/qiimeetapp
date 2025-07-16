import { StyleSheet } from 'react-native';
import { FONTS } from './font';

export const TEXT_STYLES = StyleSheet.create({
  header: {
    color: '#fff',
    fontSize: 32,
    fontFamily: FONTS.regular,
    fontWeight: '600',
    marginBottom: 16,
    lineHeight: 40,
    alignSelf: 'flex-start',
    letterSpacing: 0,
  },
  explanation: {
    color: 'white',
    opacity: 0.5,
    letterSpacing: 0,
    lineHeight: 20,
    fontSize: 12, 
    alignSelf: 'flex-start',
    fontFamily: FONTS.regular,
  },bigexplanation: {
    color: 'white',
    opacity: 0.5,
    letterSpacing: 0,
    lineHeight: 20,
    fontSize: 16,
    marginBottom: 24,
    alignSelf: 'flex-start',
    fontFamily: FONTS.regular,
  },
  dividerText: {
    color: '#fff',
    fontFamily: FONTS.regular,
    paddingHorizontal: 16,
    fontSize: 14, 
  }
});
