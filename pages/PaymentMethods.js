import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from "../components/Header";

const PaymentMethods = ({ navigation }) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [user, setUser] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [selectedType, setSelectedType] = useState('UPI');

  const [formData, setFormData] = useState({
    type: 'UPI', // UPI, Card, Net Banking
    name: '',
    upiId: '',
    cardNumber: '',
    cardHolderName: '',
    expiryDate: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    isDefault: false,
  });

  const paymentTypes = ['UPI', 'Card', 'Net Banking'];

  const loadUserData = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');

      if (!userToken || !userData) {
        navigation?.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return null;
      }

      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setPaymentMethods(parsedUser.paymentMethods || []);
      return parsedUser;
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data');
      return null;
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadUserData();
  };

  const resetForm = () => {
    setFormData({
      type: 'UPI',
      name: '',
      upiId: '',
      cardNumber: '',
      cardHolderName: '',
      expiryDate: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      isDefault: false,
    });
    setSelectedType('UPI');
    setEditingIndex(null);
  };

  const handleAddPaymentMethod = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditPaymentMethod = (item, index) => {
    setFormData(item);
    setSelectedType(item.type);
    setEditingIndex(index);
    setShowAddModal(true);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a name for this payment method');
      return false;
    }

    if (selectedType === 'UPI') {
      if (!formData.upiId.trim()) {
        Alert.alert('Error', 'Please enter UPI ID');
        return false;
      }
      const upiRegex = /^[\w.-]+@[\w.-]+$/;
      if (!upiRegex.test(formData.upiId)) {
        Alert.alert('Error', 'Please enter valid UPI ID');
        return false;
      }
    } else if (selectedType === 'Card') {
      if (!formData.cardNumber.trim() || formData.cardNumber.replace(/\s/g, '').length !== 16) {
        Alert.alert('Error', 'Please enter valid 16-digit card number');
        return false;
      }
      if (!formData.cardHolderName.trim()) {
        Alert.alert('Error', 'Please enter card holder name');
        return false;
      }
      if (!formData.expiryDate.trim()) {
        Alert.alert('Error', 'Please enter expiry date');
        return false;
      }
      const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
      if (!expiryRegex.test(formData.expiryDate)) {
        Alert.alert('Error', 'Please enter valid expiry date (MM/YY)');
        return false;
      }
    } else if (selectedType === 'Net Banking') {
      if (!formData.bankName.trim()) {
        Alert.alert('Error', 'Please enter bank name');
        return false;
      }
      if (!formData.accountNumber.trim()) {
        Alert.alert('Error', 'Please enter account number');
        return false;
      }
      if (!formData.ifscCode.trim()) {
        Alert.alert('Error', 'Please enter IFSC code');
        return false;
      }
    }

    return true;
  };

  const handleSavePaymentMethod = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      
      if (!userToken) {
        Alert.alert('Error', 'User token not found. Please login again.');
        return;
      }

      let updatedPaymentMethods = [...paymentMethods];
      const paymentData = { ...formData, type: selectedType };

      // If setting as default, remove default from others
      if (paymentData.isDefault) {
        updatedPaymentMethods = updatedPaymentMethods.map(pm => ({
          ...pm,
          isDefault: false
        }));
      }
      
      if (editingIndex !== null) {
        updatedPaymentMethods[editingIndex] = paymentData;
      } else {
        updatedPaymentMethods.push(paymentData);
      }

      // Update backend
      const response = await fetch(
        `https://voguemine.com/api/app/cart/update-payment?mobile=${user.mobile}&token=${userToken}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify(updatedPaymentMethods)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update payment method');
      }

      // Update local storage
      const updatedUserData = { ...user, paymentMethods: updatedPaymentMethods };
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
      
      setUser(updatedUserData);
      setPaymentMethods(updatedPaymentMethods);
      setShowAddModal(false);
      resetForm();
      
      Alert.alert(
        'Success',
        editingIndex !== null ? 'Payment method updated successfully' : 'Payment method added successfully'
      );
    } catch (error) {
      console.error('Error saving payment method:', error);
      Alert.alert('Error', 'Failed to save payment method. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePaymentMethod = async (index) => {
    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to delete this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const userToken = await AsyncStorage.getItem('userToken');
              
              if (!userToken) {
                Alert.alert('Error', 'User token not found. Please login again.');
                return;
              }

              const updatedPaymentMethods = paymentMethods.filter((_, i) => i !== index);

              const response = await fetch(
                `https://voguemine.com/api/app/cart/update-payment?mobile=${user.mobile}&token=${userToken}`,
                {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                  },
                  body: JSON.stringify(updatedPaymentMethods)
                }
              );

              if (!response.ok) {
                throw new Error('Failed to delete payment method');
              }

              const updatedUserData = { ...user, paymentMethods: updatedPaymentMethods };
              await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
              
              setUser(updatedUserData);
              setPaymentMethods(updatedPaymentMethods);
              Alert.alert('Success', 'Payment method deleted successfully');
            } catch (error) {
              console.error('Error deleting payment method:', error);
              Alert.alert('Error', 'Failed to delete payment method');
            }
          }
        }
      ]
    );
  };

  const formatCardNumber = (number) => {
    if (!number) return '';
    return '**** **** **** ' + number.slice(-4);
  };

  const formatExpiryDate = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const getPaymentIcon = (type) => {
    switch (type) {
      case 'UPI':
        return '📱';
      case 'Card':
        return '💳';
      case 'Net Banking':
        return '🏦';
      default:
        return '💰';
    }
  };

  const renderPaymentMethod = ({ item, index }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.typeContainer}>
          <Text style={styles.icon}>{getPaymentIcon(item.type)}</Text>
          <View>
            <Text style={styles.methodName}>{item.name}</Text>
            <Text style={styles.methodType}>{item.type}</Text>
          </View>
        </View>
        <View style={styles.actionButtons}>
          {item.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
          <TouchableOpacity 
            onPress={() => handleEditPaymentMethod(item, index)}
            style={styles.iconButton}
          >
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleDeletePaymentMethod(index)}
            style={styles.iconButton}
          >
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsContainer}>
        {item.type === 'UPI' && (
          <Text style={styles.detail}>UPI ID: {item.upiId}</Text>
        )}
        {item.type === 'Card' && (
          <>
            <Text style={styles.detail}>{formatCardNumber(item.cardNumber)}</Text>
            <Text style={styles.detail}>{item.cardHolderName}</Text>
            <Text style={styles.detail}>Expires: {item.expiryDate}</Text>
          </>
        )}
        {item.type === 'Net Banking' && (
          <>
            <Text style={styles.detail}>Bank: {item.bankName}</Text>
            <Text style={styles.detail}>Account: ****{item.accountNumber.slice(-4)}</Text>
            <Text style={styles.detail}>IFSC: {item.ifscCode}</Text>
          </>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading payment methods...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header navigation={navigation} currentPage="Payment Methods"/>
      <FlatList
        data={paymentMethods}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderPaymentMethod}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#000']}
            tintColor="#000"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyText}>No payment methods saved</Text>
            <Text style={styles.emptySubtext}>
              Add your payment methods for faster checkout
            </Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={styles.addButton}
        onPress={handleAddPaymentMethod}
      >
        <Text style={styles.addButtonText}>+ Add Payment Method</Text>
      </TouchableOpacity>

      {/* Add/Edit Payment Method Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingIndex !== null ? 'Edit Payment Method' : 'Add Payment Method'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              {/* Payment Type Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Payment Type *</Text>
                <View style={styles.typeSelector}>
                  {paymentTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        selectedType === type && styles.typeButtonActive
                      ]}
                      onPress={() => setSelectedType(type)}
                    >
                      <Text style={[
                        styles.typeButtonText,
                        selectedType === type && styles.typeButtonTextActive
                      ]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Common Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name (for your reference) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="e.g., My UPI, Work Card, Personal Account"
                />
              </View>

              {/* UPI Fields */}
              {selectedType === 'UPI' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>UPI ID *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.upiId}
                    onChangeText={(text) => setFormData({ ...formData, upiId: text })}
                    placeholder="yourname@upi"
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              )}

              {/* Card Fields */}
              {selectedType === 'Card' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Card Number *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.cardNumber}
                      onChangeText={(text) => {
                        const formatted = text.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
                        setFormData({ ...formData, cardNumber: text.replace(/\s/g, '') });
                      }}
                      placeholder="1234 5678 9012 3456"
                      keyboardType="number-pad"
                      maxLength={19}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Card Holder Name *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.cardHolderName}
                      onChangeText={(text) => setFormData({ ...formData, cardHolderName: text })}
                      placeholder="Name on card"
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Expiry Date (MM/YY) *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.expiryDate}
                      onChangeText={(text) => {
                        const formatted = formatExpiryDate(text);
                        setFormData({ ...formData, expiryDate: formatted });
                      }}
                      placeholder="MM/YY"
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                  </View>
                </>
              )}

              {/* Net Banking Fields */}
              {selectedType === 'Net Banking' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Bank Name *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.bankName}
                      onChangeText={(text) => setFormData({ ...formData, bankName: text })}
                      placeholder="Enter bank name"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Account Number *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.accountNumber}
                      onChangeText={(text) => setFormData({ ...formData, accountNumber: text })}
                      placeholder="Enter account number"
                      keyboardType="number-pad"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>IFSC Code *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.ifscCode}
                      onChangeText={(text) => setFormData({ ...formData, ifscCode: text.toUpperCase() })}
                      placeholder="Enter IFSC code"
                      autoCapitalize="characters"
                      maxLength={11}
                    />
                  </View>
                </>
              )}

              {/* Set as Default */}
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
              >
                <View style={[styles.checkbox, formData.isDefault && styles.checkboxChecked]}>
                  {formData.isDefault && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Set as default payment method</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSavePaymentMethod}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingIndex !== null ? 'Update Payment Method' : 'Save Payment Method'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  icon: {
    fontSize: 32,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  methodType: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  defaultBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  iconButton: {
    padding: 5,
  },
  editText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  detailsContainer: {
    gap: 6,
  },
  detail: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#000',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#000',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PaymentMethods;