import React from 'react';
import { Box, VStack, Text, Spinner } from '@gluestack-ui/nativewind-utils/components';
import { SafeAreaView } from 'react-native-safe-area-context';

export const LoadingScreen: React.FC = () => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <Box className="flex-1 justify-center items-center">
        <VStack className="items-center space-y-4">
          <Spinner size="large" color="blue" />
          <Text className="text-lg text-gray-600">กำลังโหลด...</Text>
        </VStack>
      </Box>
    </SafeAreaView>
  );
};