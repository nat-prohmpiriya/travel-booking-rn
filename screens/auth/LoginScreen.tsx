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
} from '@gluestack-ui/nativewind-utils/components';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';

interface LoginScreenProps {
  onNavigateToRegister: () => void;
  onForgotPassword: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigateToRegister,
  onForgotPassword,
}) => {
  const { signIn, signInWithGoogle, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
  });

  const validateForm = (): boolean => {
    const errors = {
      email: '',
      password: '',
    };

    // Email validation
    if (!formData.email) {
      errors.email = 'กรุณากรอกอีเมล';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'กรุณากรอกรหัสผ่าน';
    } else if (formData.password.length < 6) {
      errors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    }

    setFormErrors(errors);
    return !errors.email && !errors.password;
  };

  const handleLogin = async (): Promise<void> => {
    if (!validateForm()) return;

    clearError();
    await signIn(formData.email, formData.password);
  };

  const handleInputChange = (field: keyof typeof formData, value: string): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

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
                เข้าสู่ระบบ
              </Text>
              <Text className="text-base text-gray-600 text-center">
                ยินดีต้อนรับกลับ! กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ
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
            <VStack className="space-y-4 mb-6">
              {/* Email Field */}
              <VStack className="space-y-2">
                <Text className="text-sm font-medium text-gray-700">
                  อีเมล
                </Text>
                <Input
                  variant="outline"
                  size="lg"
                  isInvalid={!!formErrors.email}
                  className="bg-white"
                >
                  <InputField
                    placeholder="example@domain.com"
                    value={formData.email}
                    onChangeText={(value: string) => handleInputChange('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </Input>
                {formErrors.email && (
                  <Text className="text-sm text-red-600">{formErrors.email}</Text>
                )}
              </VStack>

              {/* Password Field */}
              <VStack className="space-y-2">
                <Text className="text-sm font-medium text-gray-700">
                  รหัสผ่าน
                </Text>
                <Input
                  variant="outline"
                  size="lg"
                  isInvalid={!!formErrors.password}
                  className="bg-white"
                >
                  <InputField
                    placeholder="กรอกรหัสผ่าน"
                    value={formData.password}
                    onChangeText={(value: string) => handleInputChange('password', value)}
                    secureTextEntry
                    autoComplete="password"
                  />
                </Input>
                {formErrors.password && (
                  <Text className="text-sm text-red-600">{formErrors.password}</Text>
                )}
              </VStack>

              {/* Forgot Password */}
              <HStack className="justify-end">
                <Pressable onPress={onForgotPassword}>
                  <Text className="text-sm text-blue-600 font-medium">
                    ลืมรหัสผ่าน?
                  </Text>
                </Pressable>
              </HStack>
            </VStack>

            {/* Login Button */}
            <Button
              size="lg"
              variant="solid"
              action="primary"
              className="mb-6"
              onPress={handleLogin}
              isDisabled={isLoading}
            >
              {isLoading ? (
                <HStack className="items-center space-x-2">
                  <Spinner size="small" color="white" />
                  <ButtonText>กำลังเข้าสู่ระบบ...</ButtonText>
                </HStack>
              ) : (
                <ButtonText>เข้าสู่ระบบ</ButtonText>
              )}
            </Button>

            {/* Divider */}
            <HStack className="items-center mb-6">
              <Box className="flex-1 h-px bg-gray-300" />
              <Text className="mx-4 text-sm text-gray-500">หรือ</Text>
              <Box className="flex-1 h-px bg-gray-300" />
            </HStack>

            {/* Google Sign-in Button */}
            <Button
              size="lg"
              variant="outline"
              className="mb-8 border-gray-300"
              onPress={signInWithGoogle}
              isDisabled={isLoading}
            >
              <ButtonText className="text-gray-700">
                เข้าสู่ระบบด้วย Google
              </ButtonText>
            </Button>

            {/* Register Link */}
            <HStack className="justify-center">
              <Text className="text-sm text-gray-600">
                ยังไม่มีบัญชี?{' '}
              </Text>
              <Pressable onPress={onNavigateToRegister}>
                <Text className="text-sm text-blue-600 font-medium">
                  สมัครสมาชิก
                </Text>
              </Pressable>
            </HStack>
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};