import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LikeScreen from '../screens/Likes/Likes';
import ConnectionSent from '../screens/Likes/ConnectionSent';
import ConnectionRequests from '../screens/Likes/ConnectionRequests';
import AcceptedConnection from '../screens/Likes/AcceptedConnection';
import PastConnections from '../screens/Likes/PastConnections';
import ExpiredRequest from '../screens/Likes/ExpiredRequest';

const Stack = createStackNavigator();

const LikeStack = () => {
  return (
    <Stack. Navigator screenOptions={{ headerShown: false,
        animationEnabled: false, }}>
      <Stack.Screen name="LikesMain" component={LikeScreen} />
      <Stack.Screen name="ConnectionSent" component={ConnectionSent} />
      <Stack.Screen name="ConnectionRequests" component={ConnectionRequests} />
      <Stack.Screen name="AcceptedConnection" component={AcceptedConnection} />
      <Stack.Screen name="PastConnections" component={PastConnections} />
      <Stack.Screen name="ExpiredRequest" component={ExpiredRequest} />
    </Stack.Navigator>
  );
};

export default LikeStack;
