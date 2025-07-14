import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GluestackUIProvider } from './components/ui/gluestack-ui-provider';
import { AuthProvider } from './hooks/useAuth';
import { AppNavigator } from './navigation/AppNavigator';
import './global.css';

export default function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GluestackUIProvider mode="light">
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </GluestackUIProvider>
    </GestureHandlerRootView>
  );
}