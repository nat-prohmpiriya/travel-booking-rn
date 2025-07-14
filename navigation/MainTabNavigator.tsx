import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { Box, VStack, Text, Button, ButtonText } from '@gluestack-ui/nativewind-utils/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '../components/ui/IconSymbol';
import { HapticTab } from '../components/HapticTab';
import TabBarBackground from '../components/ui/TabBarBackground';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { useAuth } from '../hooks/useAuth';

// Import existing screens from the app directory
import HomeScreen from '../app/(tabs)/index';
import ExploreScreen from '../app/(tabs)/explore';

export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

// Simple Profile screen for now
const ProfileScreen: React.FC = () => {
  const { signOut, user } = useAuth();
  
  return (
    <SafeAreaView className="flex-1 bg-white">
      <Box className="flex-1 justify-center items-center px-6">
        <VStack className="items-center space-y-6">
          <Text className="text-2xl font-bold text-gray-900">โปรไฟล์</Text>
          {user && (
            <VStack className="items-center space-y-2">
              <Text className="text-lg text-gray-700">{user.displayName}</Text>
              <Text className="text-base text-gray-500">{user.email}</Text>
            </VStack>
          )}
          <Button
            size="lg"
            variant="outline"
            action="secondary"
            onPress={signOut}
          >
            <ButtonText>ออกจากระบบ</ButtonText>
          </Button>
        </VStack>
      </Box>
    </SafeAreaView>
  );
};

export const MainTabNavigator: React.FC = () => {
  const colorScheme = useColorScheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'หน้าแรก',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          title: 'สำรวจ',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="paperplane.fill" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'โปรไฟล์',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};