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
  Checkbox,
  CheckboxIndicator,
  CheckboxIcon,
  CheckboxLabel,
  CheckIcon,
} from '@gluestack-ui/nativewind-utils/components';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { CreateUserData } from '../../types/user';

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onNavigateToLogin,
}) => {
  const { signUp, signInWithGoogle, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [formErrors, setFormErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);

  const validateForm = (): boolean => {
    const errors = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
    };

    // First name validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'กรุณากรอกชื่อ';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      errors.lastName = 'กรุณากรอกนามสกุล';
    }

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

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'กรุณายืนยันรหัสผ่าน';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    }

    // Phone validation (optional)
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
      errors.phone = 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก';
    }

    setFormErrors(errors);
    return !Object.values(errors).some(error => error !== '');
  };

  const handleRegister = async (): Promise<void> => {
    if (!validateForm()) return;

    if (!agreedToTerms) {
      // Handle terms agreement error
      return;
    }

    clearError();
    
    const userData: CreateUserData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phone: formData.phone || undefined,
    };

    await signUp(formData.email, formData.password, userData);
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
                สมัครสมาชิก
              </Text>
              <Text className="text-base text-gray-600 text-center">
                สร้างบัญชีใหม่เพื่อเริ่มใช้งาน
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
              {/* Name Fields */}
              <HStack className="space-x-3">
                <VStack className="flex-1 space-y-2">
                  <Text className="text-sm font-medium text-gray-700">
                    ชื่อ *
                  </Text>
                  <Input
                    variant="outline"
                    size="lg"
                    isInvalid={!!formErrors.firstName}
                    className="bg-white"
                  >
                    <InputField
                      placeholder="ชื่อ"
                      value={formData.firstName}
                      onChangeText={(value: string) => handleInputChange('firstName', value)}
                      autoCapitalize="words"
                    />
                  </Input>
                  {formErrors.firstName && (
                    <Text className="text-sm text-red-600">{formErrors.firstName}</Text>
                  )}
                </VStack>

                <VStack className="flex-1 space-y-2">
                  <Text className="text-sm font-medium text-gray-700">
                    นามสกุล *
                  </Text>
                  <Input
                    variant="outline"
                    size="lg"
                    isInvalid={!!formErrors.lastName}
                    className="bg-white"
                  >
                    <InputField
                      placeholder="นามสกุล"
                      value={formData.lastName}
                      onChangeText={(value: string) => handleInputChange('lastName', value)}
                      autoCapitalize="words"
                    />
                  </Input>
                  {formErrors.lastName && (
                    <Text className="text-sm text-red-600">{formErrors.lastName}</Text>
                  )}
                </VStack>
              </HStack>

              {/* Email Field */}
              <VStack className="space-y-2">
                <Text className="text-sm font-medium text-gray-700">
                  อีเมล *
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

              {/* Phone Field */}
              <VStack className="space-y-2">
                <Text className="text-sm font-medium text-gray-700">
                  เบอร์โทรศัพท์
                </Text>
                <Input
                  variant="outline"
                  size="lg"
                  isInvalid={!!formErrors.phone}
                  className="bg-white"
                >
                  <InputField
                    placeholder="0812345678"
                    value={formData.phone}
                    onChangeText={(value: string) => handleInputChange('phone', value)}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </Input>
                {formErrors.phone && (
                  <Text className="text-sm text-red-600">{formErrors.phone}</Text>
                )}
              </VStack>

              {/* Password Field */}
              <VStack className="space-y-2">
                <Text className="text-sm font-medium text-gray-700">
                  รหัสผ่าน *
                </Text>
                <Input
                  variant="outline"
                  size="lg"
                  isInvalid={!!formErrors.password}
                  className="bg-white"
                >
                  <InputField
                    placeholder="กรอกรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                    value={formData.password}
                    onChangeText={(value: string) => handleInputChange('password', value)}
                    secureTextEntry
                  />
                </Input>
                {formErrors.password && (
                  <Text className="text-sm text-red-600">{formErrors.password}</Text>
                )}
              </VStack>

              {/* Confirm Password Field */}
              <VStack className="space-y-2">
                <Text className="text-sm font-medium text-gray-700">
                  ยืนยันรหัสผ่าน *
                </Text>
                <Input
                  variant="outline"
                  size="lg"
                  isInvalid={!!formErrors.confirmPassword}
                  className="bg-white"
                >
                  <InputField
                    placeholder="ยืนยันรหัสผ่าน"
                    value={formData.confirmPassword}
                    onChangeText={(value: string) => handleInputChange('confirmPassword', value)}
                    secureTextEntry
                  />
                </Input>
                {formErrors.confirmPassword && (
                  <Text className="text-sm text-red-600">{formErrors.confirmPassword}</Text>
                )}
              </VStack>

              {/* Terms Checkbox */}
              <HStack className="items-start space-x-3 mt-4">
                <Checkbox
                  size="sm"
                  isChecked={agreedToTerms}
                  onChange={setAgreedToTerms}
                  value="terms"
                >
                  <CheckboxIndicator>
                    <CheckboxIcon>
                      <CheckIcon />
                    </CheckboxIcon>
                  </CheckboxIndicator>
                </Checkbox>
                <VStack className="flex-1">
                  <Text className="text-sm text-gray-700 leading-5">
                    ฉันยอมรับ{' '}
                    <Text className="text-blue-600 font-medium">เงื่อนไขการใช้งาน</Text>
                    {' '}และ{' '}
                    <Text className="text-blue-600 font-medium">นโยบายความเป็นส่วนตัว</Text>
                  </Text>
                </VStack>
              </HStack>
            </VStack>

            {/* Register Button */}
            <Button
              size="lg"
              variant="solid"
              action="primary"
              className="mb-6"
              onPress={handleRegister}
              isDisabled={isLoading || !agreedToTerms}
            >
              {isLoading ? (
                <HStack className="items-center space-x-2">
                  <Spinner size="small" color="white" />
                  <ButtonText>กำลังสมัครสมาชิก...</ButtonText>
                </HStack>
              ) : (
                <ButtonText>สมัครสมาชิก</ButtonText>
              )}
            </Button>

            {/* Divider */}
            <HStack className="items-center mb-6">
              <Box className="flex-1 h-px bg-gray-300" />
              <Text className="mx-4 text-sm text-gray-500">หรือ</Text>
              <Box className="flex-1 h-px bg-gray-300" />
            </HStack>

            {/* Google Sign-up Button */}
            <Button
              size="lg"
              variant="outline"
              className="mb-8 border-gray-300"
              onPress={signInWithGoogle}
              isDisabled={isLoading}
            >
              <ButtonText className="text-gray-700">
                สมัครด้วย Google
              </ButtonText>
            </Button>

            {/* Login Link */}
            <HStack className="justify-center">
              <Text className="text-sm text-gray-600">
                มีบัญชีอยู่แล้ว?{' '}
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