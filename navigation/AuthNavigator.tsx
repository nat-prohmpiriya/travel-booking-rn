import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

const AuthStack = createStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      <AuthStack.Screen 
        name="Login" 
        component={LoginScreenWrapper}
      />
      <AuthStack.Screen 
        name="Register" 
        component={RegisterScreenWrapper}
      />
      <AuthStack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreenWrapper}
      />
    </AuthStack.Navigator>
  );
};

// Screen wrappers to handle navigation
const LoginScreenWrapper: React.FC<any> = ({ navigation }) => {
  return (
    <LoginScreen
      onNavigateToRegister={() => navigation.navigate('Register')}
      onForgotPassword={() => navigation.navigate('ForgotPassword')}
    />
  );
};

const RegisterScreenWrapper: React.FC<any> = ({ navigation }) => {
  return (
    <RegisterScreen
      onNavigateToLogin={() => navigation.navigate('Login')}
    />
  );
};

const ForgotPasswordScreenWrapper: React.FC<any> = ({ navigation }) => {
  return (
    <ForgotPasswordScreen
      onNavigateToLogin={() => navigation.navigate('Login')}
    />
  );
};