import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const ModernLogin = ({ visible, onClose }) => {
  const [currentView, setCurrentView] = useState('login'); // 'login', 'signup', 'forgot', 'verifyOtp'
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  
  const [loginData, setLoginData] = useState({
    mobile: '',
    password: '',
  });
  
  const [signupData, setSignupData] = useState({
    firstname: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  });

  const [forgotPasswordData, setForgotPasswordData] = useState({
    mobile: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [otpSent, setOtpSent] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [intervalId, setIntervalId] = useState(null);

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [intervalId]);

  const validateMobile = (mobile) => {
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(mobile);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const validateSignupForm = () => {
    if (!signupData.firstname.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    if (!validateMobile(signupData.mobile)) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return false;
    }
    if (!validatePassword(signupData.password)) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }
    if (signupData.password !== signupData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const validateLoginForm = () => {
    if (!validateMobile(loginData.mobile)) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return false;
    }
    if (!loginData.password) {
      Alert.alert('Error', 'Please enter your password');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateLoginForm()) return;

    setLoading(true);
    try {
      const response = await fetch('https://voguemine.com/api/app/user/user-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile: loginData.mobile,
          password: loginData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data));
        
        Alert.alert('Success', 'Login successful!', [
          {
            text: 'OK',
            onPress: () => {
              setLoginData({ mobile: '', password: '' });
              onClose();
            },
          },
        ]);
      } else {
        Alert.alert('Error', data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!validateSignupForm()) return;

    setLoading(true);
    try {
      
      const response = await fetch(`https://voguemine.com/api/app/user/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstname: signupData.firstname,
          mobile: signupData.mobile,
          password: signupData.password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('Success', 'Account created successfully!', [
          {
            text: 'OK',
            onPress: () => {
              setCurrentView('login');
              setSignupData({
                firstname: '',
                mobile: '',
                password: '',
                confirmPassword: '',
              });
            },
          },
        ]);
      } else {
        Alert.alert('Error', data.error || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    if (!validateMobile(forgotPasswordData.mobile)) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    if (forgotPasswordData.mobile === "9826333937") {
      Alert.alert('Error', 'You are not eligible');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://voguemine.com/api/app/user/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile: forgotPasswordData.mobile,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOtpSent(true);
        setTimeLeft(600); // 10 minutes
        
        // Start countdown timer
        if (intervalId) clearInterval(intervalId);
        const id = setInterval(() => {
          setTimeLeft((prevTime) => {
            if (prevTime <= 1) {
              clearInterval(id);
              return 0;
            }
            return prevTime - 1;
          });
        }, 1000);
        setIntervalId(id);

        Alert.alert('Success', 'OTP sent to your mobile number');
        setCurrentView('verifyOtp');
      } else {
        Alert.alert('Error', data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('OTP request error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timeLeft > 540) { // Allow resend only after 1 minute
      Alert.alert('Info', 'Please wait before requesting a new OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://voguemine.com/api/app/user/reset-password/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile: forgotPasswordData.mobile,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTimeLeft(600);
        
        if (intervalId) clearInterval(intervalId);
        const id = setInterval(() => {
          setTimeLeft((prevTime) => {
            if (prevTime <= 1) {
              clearInterval(id);
              return 0;
            }
            return prevTime - 1;
          });
        }, 1000);
        setIntervalId(id);

        Alert.alert('Success', 'New OTP sent successfully');
      } else {
        Alert.alert('Error', data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('OTP resend error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTPAndReset = async () => {
    if (!forgotPasswordData.otp || forgotPasswordData.otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    if (!validatePassword(forgotPasswordData.newPassword)) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (forgotPasswordData.newPassword !== forgotPasswordData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://voguemine.com/api/app/user/reset-password/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile: forgotPasswordData.mobile,
          otp: forgotPasswordData.otp,
          newPassword: forgotPasswordData.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (intervalId) clearInterval(intervalId);
        
        Alert.alert('Success', 'Password reset successfully!', [
          {
            text: 'OK',
            onPress: () => {
              setCurrentView('login');
              setForgotPasswordData({
                mobile: '',
                otp: '',
                newPassword: '',
                confirmPassword: '',
              });
              setOtpSent(false);
              setTimeLeft(0);
            },
          },
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderLoginForm = () => (
    <View style={styles.formContent}>
      <View style={styles.headerSection}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>🔐</Text>
        </View>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue your journey</Text>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>📱</Text>
          <TextInput
            style={styles.input}
            placeholder="Mobile Number"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            maxLength={10}
            value={loginData.mobile}
            onChangeText={(text) => setLoginData({ ...loginData, mobile: text })}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            value={loginData.password}
            onChangeText={(text) => setLoginData({ ...loginData, password: text })}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={styles.forgotPassword}
        onPress={() => setCurrentView('forgot')}
      >
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.disabledButton]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.primaryButtonText}>Sign In</Text>
        )}
      </TouchableOpacity>

      <View style={styles.switchContainer}>
        <Text style={styles.switchText}>New here? </Text>
        <TouchableOpacity onPress={() => setCurrentView('signup')}>
          <Text style={styles.switchLink}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSignupForm = () => (
    <View style={styles.formContent}>
      <View style={styles.headerSection}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>✨</Text>
        </View>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join us and start your journey</Text>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>👤</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#94a3b8"
            value={signupData.firstname}
            onChangeText={(text) => setSignupData({ ...signupData, firstname: text })}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>📱</Text>
          <TextInput
            style={styles.input}
            placeholder="Mobile Number"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            maxLength={10}
            value={signupData.mobile}
            onChangeText={(text) => setSignupData({ ...signupData, mobile: text })}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput
            style={styles.input}
            placeholder="Password (min 6 chars)"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            value={signupData.password}
            onChangeText={(text) => setSignupData({ ...signupData, password: text })}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>✓</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            value={signupData.confirmPassword}
            onChangeText={(text) => setSignupData({ ...signupData, confirmPassword: text })}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.disabledButton]}
        onPress={handleSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.primaryButtonText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <View style={styles.switchContainer}>
        <Text style={styles.switchText}>Already a member? </Text>
        <TouchableOpacity onPress={() => setCurrentView('login')}>
          <Text style={styles.switchLink}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderForgotPasswordForm = () => (
    <View style={styles.formContent}>
      <View style={styles.headerSection}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>🔑</Text>
        </View>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>Enter your mobile number to receive OTP</Text>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>📱</Text>
          <TextInput
            style={styles.input}
            placeholder="Mobile Number"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            maxLength={10}
            value={forgotPasswordData.mobile}
            onChangeText={(text) => setForgotPasswordData({ ...forgotPasswordData, mobile: text })}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.disabledButton]}
        onPress={handleRequestOTP}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.primaryButtonText}>Send OTP</Text>
        )}
      </TouchableOpacity>

      <View style={styles.switchContainer}>
        <Text style={styles.switchText}>Remember password? </Text>
        <TouchableOpacity onPress={() => setCurrentView('login')}>
          <Text style={styles.switchLink}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderVerifyOTPForm = () => (
    <View style={styles.formContent}>
      <View style={styles.headerSection}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>📲</Text>
        </View>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>Enter OTP and your new password</Text>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>🔢</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 6-digit OTP"
            placeholderTextColor="#94a3b8"
            keyboardType="number-pad"
            maxLength={6}
            value={forgotPasswordData.otp}
            onChangeText={(text) => setForgotPasswordData({ ...forgotPasswordData, otp: text })}
          />
        </View>

        {timeLeft > 0 && (
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>⏱ OTP expires in: {formatTime(timeLeft)}</Text>
          </View>
        )}

        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput
            style={styles.input}
            placeholder="New Password (min 6 chars)"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            value={forgotPasswordData.newPassword}
            onChangeText={(text) => setForgotPasswordData({ ...forgotPasswordData, newPassword: text })}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>✓</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm New Password"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            value={forgotPasswordData.confirmPassword}
            onChangeText={(text) => setForgotPasswordData({ ...forgotPasswordData, confirmPassword: text })}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.disabledButton]}
        onPress={handleVerifyOTPAndReset}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.primaryButtonText}>Reset Password</Text>
        )}
      </TouchableOpacity>

      <View style={styles.resendContainer}>
        <Text style={styles.switchText}>Didn't receive OTP? </Text>
        <TouchableOpacity onPress={handleResendOTP} disabled={timeLeft > 540}>
          <Text style={[styles.switchLink, timeLeft > 540 && styles.disabledLink]}>
            Resend OTP
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.switchContainer}>
        <TouchableOpacity onPress={() => {
          setCurrentView('login');
          setForgotPasswordData({
            mobile: '',
            otp: '',
            newPassword: '',
            confirmPassword: '',
          });
          setOtpSent(false);
          setTimeLeft(0);
          if (intervalId) clearInterval(intervalId);
        }}>
          <Text style={styles.switchLink}>← Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.backdropTouchable} 
          activeOpacity={1} 
        >
          <View style={styles.backdrop} />
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Animated.View 
            style={[
              styles.modalContainer,
              { opacity: fadeAnim }
            ]}
          >
            <TouchableOpacity 
              style={styles.closeButton} 
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {currentView === 'login' && renderLoginForm()}
              {currentView === 'signup' && renderSignupForm()}
              {currentView === 'forgot' && renderForgotPasswordForm()}
              {currentView === 'verifyOtp' && renderVerifyOTPForm()}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  keyboardView: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    width: width > 500 ? 440 : width - 40,
    maxHeight: height * 0.95,
    backgroundColor: '#ffffff',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 17,
    color: '#64748b',
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30,
  },
  formContent: {
    width: '100%',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 36,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 30,
  },
  title: {
    fontSize: 25,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    marginBottom: 10,
    height: 50,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -8,
  },
  forgotPasswordText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 5,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: {
    color: '#64748b',
    fontSize: 15,
  },
  switchLink: {
    color: '#3b82f6',
    fontSize: 15,
    fontWeight: '700',
  },
  disabledLink: {
    color: '#94a3b8',
  },
  timerContainer: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  timerText: {
    color: '#92400e',
    fontSize: 13,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
});

// Demo wrapper
const LoginDemo = () => {
  const [showModal, setShowModal] = useState(true);

  return (
    <View>
      <ModernLogin 
        visible={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </View>
  );
};

export default LoginDemo;