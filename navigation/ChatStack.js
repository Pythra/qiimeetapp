import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ChatScreen from '../screens/Chat/Chat';  
import ChatInterface from '../screens/Chat/ChatInterface'; // Add this import
import VoiceCall from '../screens/Chat/VoiceCall';
import VideoCall from '../screens/Chat/VideoCall'; // Add this import
import Notification from '../screens/Chat/Notification';
import IncomingCall from '../screens/Chat/IncomingCall';

const Stack = createStackNavigator();

const ChatStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: false,
        // Add this to eliminate all transition animations
        animationTypeForReplace: 'none',
        gestureEnabled: false,
        cardStyleInterpolator: () => ({
          cardStyle: { opacity: 1 },
        }),
      }}
    >
      <Stack.Screen name="ChatScreen" component={ChatScreen} />  
      <Stack.Screen name="ChatInterface" component={ChatInterface} /> 
      <Stack.Screen name="VoiceCall" component={VoiceCall} />  
      <Stack.Screen name="VideoCall" component={VideoCall} /> 
      <Stack.Screen name="Notification" component={Notification} />
      <Stack.Screen name="IncomingCall" component={IncomingCall} />
    </Stack.Navigator>
  );
};

export default ChatStack;
