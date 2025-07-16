import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ScreenWrapper = ({ 
  children, 
  backgroundColor = '#0A0A0A',
  barStyle = 'light-content',
  statusBarColor = '#0A0A0A',
  translucent = false,
  paddingTop = 8 
}) => {
  // Set status bar style for Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle(barStyle, true);
      StatusBar.setBackgroundColor(statusBarColor, true);
    }
  }, [barStyle, statusBarColor]);

  return (
    <>
      <StatusBar 
        barStyle={barStyle}
        backgroundColor={statusBarColor}
        translucent={translucent}
      />
      <SafeAreaView 
        style={{ 
          flex: 1, 
          backgroundColor,
          paddingTop,
        }}
      >
        {children}
      </SafeAreaView>
    </>
  );
};

export default ScreenWrapper;