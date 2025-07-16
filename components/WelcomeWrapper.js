import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

const WelcomeWrapper = ({ children }) => (
  <SafeAreaView style={{ flex: 1, backgroundColor: '#121212',
    paddingTop: 8,  }}>
    {children}
  </SafeAreaView>
);

export default WelcomeWrapper;
  