import * as React from 'react';

export const navigationRef = React.createRef();

// Navigate to a tab (e.g., 'Chat', 'Likes', 'Premium', etc)
export function navigateToTab(tabName) {
  navigationRef.current?.navigate('MainTabs', {
    screen: tabName,
  });
}

// Navigate to a screen in the ChatStack (e.g., 'IncomingCall', 'ChatInterface')
export function navigateToChatStack(screen, params) {
  navigationRef.current?.navigate('MainTabs', {
    screen: 'Chat',
    params: {
      screen,
      params,
    }
  });
}

export const showAcceptedConnection = (targetUserId, acceptedBy) => {
  if (navigationRef.current) {
    // Save current route for returning after
    const currentRoute = navigationRef.current.getCurrentRoute();
    
    // Navigate to AcceptedConnection modal
    navigationRef.current.navigate('AcceptedConnection', {
      targetUserId,
      acceptedBy,
      returnRoute: currentRoute
    });
  }
};