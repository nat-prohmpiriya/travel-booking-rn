import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  InputField,
  Button,
  ButtonText,
  Pressable,
  Alert,
  AlertIcon,
  AlertText,
  InfoIcon,
  Spinner,
  CheckCircleIcon,
} from '@gluestack-ui/nativewind-utils/components';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';

interface ForgotPasswordScreenProps {
  onNavigateToLogin: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onNavigateToLogin,
}) => {
  const { resetPassword, error, clearError } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const validateEmail = (): boolean => {
    if (!email) {
      setEmailError('กรุณากรอกอีเมล');
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('รูปแบบอีเมลไม่ถูกต้อง');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleResetPassword = async (): Promise<void> => {
    if (!validateEmail()) return;

    try {
      setIsLoading(true);
      clearError();
      
      await resetPassword(email);
      setIsSuccess(true);
    } catch (error: any) {
      // Error is handled by the useAuth hook
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (value: string): void => {
    setEmail(value);
    if (emailError) {
      setEmailError('');
    }
    if (error) {
      clearError();
    }
  };

  if (isSuccess) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <Box className="flex-1 px-6 py-8 justify-center">
          <VStack className="items-center space-y-6">
            <CheckCircleIcon size="xl" className="text-green-600" />
            
            <VStack className="items-center space-y-4">
              <Text className="text-2xl font-bold text-gray-900 text-center">
                ส่งอีเมลสำเร็จ!
              </Text>
              <Text className="text-base text-gray-600 text-center leading-6">
                เราได้ส่งลิงค์สำหรับรีเซ็ตรหัสผ่านไปยัง{'\n'}
                <Text className="font-medium">{email}</Text>{'\n\n'}
                กรุณาตรวจสอบอีเมลของคุณและทำตามขั้นตอนที่ระบุ
              </Text>
            </VStack>

            <VStack className="w-full space-y-3 mt-8">
              <Button
                size="lg"
                variant="solid"
                action="primary"
                onPress={onNavigateToLogin}
              >
                <ButtonText>กลับไปหน้าเข้าสู่ระบบ</ButtonText>
              </Button>

              <Button
                size="lg"
                variant="outline"
                onPress={() => {
                  setIsSuccess(false);
                  setEmail('');
                }}
              >
                <ButtonText>ส่งอีเมลอีกครั้ง</ButtonText>
              </Button>
            </VStack>
          </VStack>
        </Box>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <Box className="flex-1 px-6 py-8">
            {/* Header */}
            <VStack className="items-center mb-8">
              <Text className="text-3xl font-bold text-gray-900 mb-2">
                ลืมรหัสผ่าน?
              </Text>
              <Text className="text-base text-gray-600 text-center leading-6">
                กรอกอีเมลของคุณ เราจะส่งลิงค์สำหรับ{'\n'}
                รีเซ็ตรหัสผ่านให้คุณ
              </Text>
            </VStack>

            {/* Error Alert */}
            {error && (
              <Alert action="error" variant="outline" className="mb-6">
                <AlertIcon>
                  <InfoIcon />
                </AlertIcon>
                <AlertText className="text-sm">{error}</AlertText>
              </Alert>
            )}

            {/* Form */}
            <VStack className="space-y-6 mb-8">
              {/* Email Field */}
              <VStack className="space-y-2">
                <Text className="text-sm font-medium text-gray-700">
                  อีเมล
                </Text>
                <Input
                  variant="outline"
                  size="lg"
                  isInvalid={!!emailError}
                  className="bg-white"
                >
                  <InputField
                    placeholder="example@domain.com"
                    value={email}
                    onChangeText={handleEmailChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </Input>
                {emailError && (
                  <Text className="text-sm text-red-600">{emailError}</Text>
                )}
              </VStack>

              {/* Reset Button */}
              <Button
                size="lg"
                variant="solid"
                action="primary"
                onPress={handleResetPassword}
                isDisabled={isLoading}
              >
                {isLoading ? (
                  <HStack className="items-center space-x-2">
                    <Spinner size="small" color="white" />
                    <ButtonText>กำลังส่งอีเมล...</ButtonText>
                  </HStack>
                ) : (
                  <ButtonText>ส่งลิงค์รีเซ็ตรหัสผ่าน</ButtonText>
                )}
              </Button>
            </VStack>

            {/* Back to Login */}
            <HStack className="justify-center">
              <Text className="text-sm text-gray-600">
                จำรหัสผ่านได้แล้ว?{' '}
              </Text>
              <Pressable onPress={onNavigateToLogin}>
                <Text className="text-sm text-blue-600 font-medium">
                  เข้าสู่ระบบ
                </Text>
              </Pressable>
            </HStack>
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};