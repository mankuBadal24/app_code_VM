import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Image,
  TextInput,
  Modal,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../components/Header';

const { width, height } = Dimensions.get('window');

const Checkout = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState('payu');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  
  const [promoCode, setPromoCode] = useState('');
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  const [couponAmount, setCouponAmount] = useState(0);
  
  const [otp, setOtp] = useState('');
  const [sentOtp, setSentOtp] = useState('');
  const [verified, setVerified] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Form data for new address
  const [newAddress, setNewAddress] = useState({
    firstname: '',
    lastname: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
  });

  // Load initial data
  useEffect(() => {
    loadCheckoutData();
  }, []);

  const loadCheckoutData = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');

      if (!userToken || !userData) {
        Alert.alert('Login Required', 'Please login to continue');
        navigation.navigate('Login');
        return;
      }

      const parsedUser = JSON.parse(userData);
      const parsedCart = parsedUser ? parsedUser?.cart : [];

      setUser(parsedUser);
      setCartItems(parsedCart);
      setAddresses(parsedUser.address || []);
      setPaymentMethods(parsedUser.paymentMethods || []);
      
      // Set default address
      const defaultAddr = parsedUser.address?.find(addr => addr.isDefault);
      setSelectedAddress(defaultAddr || parsedUser.address?.[0] || null);

      // Set default payment
      const defaultPay = parsedUser.paymentMethods?.find(pm => pm.isDefault);
      if (defaultPay) {
        setSelectedPayment(defaultPay.id || 'payu');
      }

    } catch (error) {
      console.error('Error loading checkout data:', error);
      Alert.alert('Error', 'Failed to load checkout data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.prdt.price * item.quantity), 0);
  const shipping = selectedPayment === 'cod' ? 200 : 0;
  const discount = couponAmount;
  const total = subtotal + shipping - discount;

  // Timer for OTP
  useEffect(() => {
    let interval;
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  };

  // Send OTP
  const sendOtp = async (phone) => {
    if (!phone || phone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    try {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setSentOtp(generatedOtp);

      const response = await fetch('https://voguemine.com/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: generatedOtp })
      });

      const data = await response.json();
      if (data.status === 100) {
        setTimeLeft(60);
        setShowOtpModal(true);
        Alert.alert('Success', 'OTP sent to your phone');
      } else {
        Alert.alert('Error', 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      Alert.alert('Error', 'Failed to send OTP');
    }
  };

  // Verify OTP
  const verifyOtp = () => {
    if (otp === sentOtp) {
      setVerified(true);
      setShowOtpModal(false);
      Alert.alert('Success', 'Phone number verified');
    } else {
      Alert.alert('Error', 'Invalid OTP. Please try again.');
    }
  };

  // Apply coupon
  const applyCoupon = async () => {
    if (!promoCode.trim()) {
      Alert.alert('Error', 'Please enter a promo code');
      return;
    }

    try {
      const response = await fetch('https://voguemine.com/api/coupon/apply-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: promoCode,
          totalAmount: subtotal,
          customerType: 'all',
          cartItemCount: cartItems.length,
          customerEmail: user?.email,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setCouponAmount(parseInt(data.discountAmount));
        setIsPromoApplied(true);
        Alert.alert('Success', 'Coupon applied successfully');
      } else {
        Alert.alert('Error', 'Invalid coupon code');
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      Alert.alert('Error', 'Failed to apply coupon');
    }
  };

  // Place order
  const placeOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    if (!verified && selectedPayment !== 'cod') {
      Alert.alert('Error', 'Please verify your phone number');
      return;
    }

    setProcessing(true);

    try {
      const userToken = await AsyncStorage.getItem('userToken');
      
      const orderData = {
        shippingInfo: selectedAddress,
        orderItems: cartItems.map(item => ({
          product: item.prdt._id,
          price: item.prdt.price,
          quantity: item.quantity,
          color: item.color,
          size: item.size,
          sku: item.prdt.sku
        })),
        paymentInfo: {
          method: selectedPayment,
          status: selectedPayment === 'cod' ? 'pending' : 'completed'
        },
        totalPrice: subtotal,
        shippingCost: shipping,
        discount,
        finalAmount: total,
        app:'true',
        tag:'Voguemine',
        orderType: selectedPayment === 'cod' ? 'COD' : 'Prepaid'
      };

      const response = await fetch(
        `https://voguemine.com/api/order/create-order?mobile=${user.mobile}&token=${userToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify(orderData)
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        // Clear cart
        await AsyncStorage.removeItem('cart');
        
        // Show success
        setShowOrderSuccess(true);
        
        // Update user data to remove cart
        const updatedUser = { ...user, cart: [] };
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        
      } else {
        throw new Error(data.error || 'Order creation failed');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', error.message || 'Failed to place order');
    } finally {
      setProcessing(false);
    }
  };

  const OrderItem = ({ item }) => (
    <View style={styles.orderItem}>
      <View style={styles.itemImageContainer}>
        <Image 
          source={{ uri: item.prdt.images?.[0]?.url || 'https://via.placeholder.com/150' }} 
          style={styles.itemImage} 
        />
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemName} numberOfLines={2}>{item.prdt.title}</Text>
        <View style={styles.itemSpecs}>
          {item.size && <Text style={styles.itemSpec}>Size: {item.size}</Text>}
          {item.color && <Text style={styles.itemSpec}>Color: {item.color}</Text>}
        </View>
        <View style={styles.itemPricing}>
          <Text style={styles.itemPrice}>₹{item.prdt.price.toFixed(2)}</Text>
          <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
        </View>
      </View>
    </View>
  );

  const AddressCard = ({ address, isSelected, onSelect }) => (
    <TouchableOpacity
      style={[styles.addressCard, isSelected && styles.selectedCard]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <View style={styles.addressHeader}>
        <View style={styles.addressTypeContainer}>
          <Text style={styles.addressName}>{address.firstname} {address.lastname}</Text>
          {address.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>
        <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
          {isSelected && <View style={styles.radioButtonInner} />}
        </View>
      </View>
      <Text style={styles.addressText}>{address.address}</Text>
      <Text style={styles.addressText}>{address.city}, {address.state} - {address.pincode}</Text>
      <Text style={styles.addressPhone}>📞 {address.phone}</Text>
    </TouchableOpacity>
  );

  const PaymentCard = ({ payment, isSelected, onSelect }) => {
    const getPaymentIcon = () => {
      if (payment === 'cod') return '💵';
      if (payment === 'payu') return '💳';
      if (payment === 'phonepe') return '📱';
      return payment?.icon || '💰';
    };

    const getPaymentTitle = () => {
      if (payment === 'cod') return 'Cash on Delivery';
      if (payment === 'payu') return 'Online Payment (PayU)';
      if (payment === 'phonepe') return 'PhonePe';
      return payment?.type || 'Payment Method';
    };

    const getPaymentDetails = () => {
      if (payment === 'cod') return 'Pay when you receive';
      if (payment === 'payu') return 'UPI, Cards, Net Banking';
      if (payment === 'phonepe') return 'UPI Payment';
      return payment?.details || '';
    };

    return (
      <TouchableOpacity
        style={[styles.paymentCard, isSelected && styles.selectedCard]}
        onPress={onSelect}
        activeOpacity={0.8}
      >
        <View style={styles.paymentHeader}>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentIcon}>{getPaymentIcon()}</Text>
            <View>
              <Text style={styles.paymentType}>{getPaymentTitle()}</Text>
              <Text style={styles.paymentDetails}>{getPaymentDetails()}</Text>
              {payment === 'cod' && (
                <Text style={styles.codWarning}>+ ₹200 Shipping Charges</Text>
              )}
            </View>
          </View>
          <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
            {isSelected && <View style={styles.radioButtonInner} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading checkout...</Text>
      </View>
    );
  }

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header navigation={navigation} currentPage="Checkout" />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Header navigation={navigation} currentPage="Checkout" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <Text style={styles.itemCount}>{cartItems.length} items</Text>
          </View>
          {cartItems.map(item => (
            <OrderItem key={`${item._id}-${item.color}-${item.size}`} item={item} />
          ))}
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity onPress={() => setShowAddressModal(true)}>
              <Text style={styles.changeButton}>Change</Text>
            </TouchableOpacity>
          </View>
          {selectedAddress ? (
            <AddressCard address={selectedAddress} isSelected={true} onSelect={() => {}} />
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('Addresses')}
            >
              <Text style={styles.addButtonText}>+ Add Address</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <TouchableOpacity onPress={() => setShowPaymentModal(true)}>
              <Text style={styles.changeButton}>Change</Text>
            </TouchableOpacity>
          </View>
          <PaymentCard 
            payment={selectedPayment} 
            isSelected={true} 
            onSelect={() => {}} 
          />
        </View>

        {/* Promo Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Promo Code</Text>
          {!isPromoApplied ? (
            <View style={styles.promoContainer}>
              <TextInput
                style={styles.promoInput}
                placeholder="Enter promo code"
                value={promoCode}
                onChangeText={setPromoCode}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.applyButton} onPress={applyCoupon}>
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.appliedPromoContainer}>
              <View style={styles.appliedPromoInfo}>
                <Text style={styles.appliedPromoIcon}>🎉</Text>
                <View>
                  <Text style={styles.appliedPromoText}>{promoCode} Applied</Text>
                  <Text style={styles.appliedPromoSavings}>You saved ₹{couponAmount.toFixed(2)}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => {
                setIsPromoApplied(false);
                setCouponAmount(0);
                setPromoCode('');
              }}>
                <Text style={styles.removePromoText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Order Total */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Details</Text>
          <View style={styles.totalContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>₹{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Shipping</Text>
              <Text style={styles.totalValue}>₹{shipping.toFixed(2)}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, styles.discountLabel]}>Discount</Text>
                <Text style={[styles.totalValue, styles.discountValue]}>-₹{discount.toFixed(2)}</Text>
              </View>
            )}
            <View style={[styles.totalRow, styles.finalTotalRow]}>
              <Text style={styles.finalTotalLabel}>Total Amount</Text>
              <Text style={styles.finalTotalValue}>₹{total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.bottomContainer}>
        <View style={styles.orderSummaryBottom}>
          <Text style={styles.bottomTotalLabel}>Total Amount</Text>
          <Text style={styles.bottomTotalValue}>₹{total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderButton, processing && styles.placeOrderButtonDisabled]}
          onPress={placeOrder}
          disabled={processing}
          activeOpacity={0.9}
        >
          {processing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.placeOrderIcon}>📱</Text>
              <Text style={styles.placeOrderText}>Place Order</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Address Selection Modal */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Address</Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {addresses.map((address, index) => (
                <AddressCard
                  key={index}
                  address={address}
                  isSelected={selectedAddress === address}
                  onSelect={() => {
                    setSelectedAddress(address);
                    setShowAddressModal(false);
                  }}
                />
              ))}
              <TouchableOpacity 
                style={styles.addNewButton}
                onPress={() => {
                  setShowAddressModal(false);
                  navigation.navigate('Addresses');
                }}
              >
                <Text style={styles.addNewIcon}>+</Text>
                <Text style={styles.addNewText}>Add New Address</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Payment Method Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment Method</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              <PaymentCard
                payment="payu"
                isSelected={selectedPayment === 'payu'}
                onSelect={() => {
                  setSelectedPayment('payu');
                  setShowPaymentModal(false);
                }}
              />
              <PaymentCard
                payment="phonepe"
                isSelected={selectedPayment === 'phonepe'}
                onSelect={() => {
                  setSelectedPayment('phonepe');
                  setShowPaymentModal(false);
                }}
              />
              <PaymentCard
                payment="cod"
                isSelected={selectedPayment === 'cod'}
                onSelect={() => {
                  setSelectedPayment('cod');
                  setShowPaymentModal(false);
                }}
              />
              <TouchableOpacity 
                style={styles.addNewButton}
                onPress={() => {
                  setShowPaymentModal(false);
                  navigation.navigate('PaymentMethods');
                }}
              >
                <Text style={styles.addNewIcon}>+</Text>
                <Text style={styles.addNewText}>Add Payment Method</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* OTP Modal */}
      <Modal
        visible={showOtpModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowOtpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.otpModal}>
            <Text style={styles.otpTitle}>Verify Phone Number</Text>
            <Text style={styles.otpSubtitle}>
              Enter the 6-digit OTP sent to your phone
            </Text>
            <TextInput
              style={styles.otpInput}
              placeholder="Enter OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
            <View style={styles.otpTimer}>
              <Text style={styles.timerText}>
                {timeLeft > 0 ? `Resend in ${formatTime()}` : 'OTP Expired'}
              </Text>
            </View>
            <View style={styles.otpButtons}>
              {timeLeft > 0 ? (
                <TouchableOpacity style={styles.verifyButton} onPress={verifyOtp}>
                  <Text style={styles.verifyButtonText}>Verify OTP</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.resendButton} 
                  onPress={() => sendOtp(selectedAddress?.phone)}
                >
                  <Text style={styles.resendButtonText}>Resend OTP</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.cancelOtpButton} 
                onPress={() => setShowOtpModal(false)}
              >
                <Text style={styles.cancelOtpButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Order Success Modal */}
      <Modal
        visible={showOrderSuccess}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowOrderSuccess(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successIcon}>
              <Text style={styles.successEmoji}>🎉</Text>
            </View>
            <Text style={styles.successTitle}>Order Placed Successfully!</Text>
            <Text style={styles.successSubtitle}>
              Your order has been placed and will be delivered within 5-7 business days.
            </Text>
            <View style={styles.successButtons}>
              <TouchableOpacity
                style={styles.trackOrderButton}
                onPress={() => {
                  setShowOrderSuccess(false);
                  navigation.navigate('Orders');
                }}
              >
                <Text style={styles.trackOrderText}>Track Order</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.continueShoppingButton}
                onPress={() => {
                  setShowOrderSuccess(false);
                  navigation.navigate('Home');
                }}
              >
                <Text style={styles.continueShoppingText}>Continue Shopping</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  shopButton: {
    backgroundColor: '#000',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 0,
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemCount: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight:'600'
  },
  changeButton: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  orderItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  itemImageContainer: {
    width: 65,
    height: 65,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b6b6bff',
    marginBottom: 4,
  },
  itemSpecs: {
    flexDirection: 'row',
    gap: 12,
  },
  itemSpec: {
    fontSize: 11,
    color: '#6B7280',
  },
  itemPricing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#6B7280',
  },
  addressCard: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  selectedCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#F0F7FF',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  // Add these styles to complete your StyleSheet

defaultBadge: {
  backgroundColor: '#10B981',
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 8,
},
defaultText: {
  fontSize: 10,
  color: '#FFFFFF',
  fontWeight: '600',
},
addressText: {
  fontSize: 14,
  color: '#6B7280',
  marginBottom: 2,
},
addressPhone: {
  fontSize: 14,
  color: '#374151',
  fontWeight: '500',
},
radioButton: {
  width: 20,
  height: 20,
  borderRadius: 10,
  borderWidth: 2,
  borderColor: '#D1D5DB',
  alignItems: 'center',
  justifyContent: 'center',
},
radioButtonSelected: {
  borderColor: '#3B82F6',
},
radioButtonInner: {
  width: 10,
  height: 10,
  borderRadius: 5,
  backgroundColor: '#3B82F6',
},
paymentCard: {
  borderWidth: 2,
  borderColor: '#E5E7EB',
  borderRadius: 16,
  padding: 16,
  marginBottom: 12,
},
paymentHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},
paymentInfo: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
},
paymentIcon: {
  fontSize: 24,
},
paymentType: {
  fontSize: 16,
  fontWeight: '600',
  color: '#1F2937',
},
paymentDetails: {
  fontSize: 14,
  color: '#6B7280',
},
codWarning: {
  fontSize: 12,
  color: '#DC2626',
  fontWeight: '500',
  marginTop: 4,
},
promoContainer: {
  flexDirection: 'row',
  gap: 12,
  marginTop: 12,
},
promoInput: {
  flex: 1,
  borderWidth: 1,
  borderColor: '#D1D5DB',
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 16,
  backgroundColor: '#FFFFFF',
},
applyButton: {
  backgroundColor: '#3B82F6',
  paddingHorizontal: 24,
  paddingVertical: 14,
  borderRadius: 12,
},
applyButtonText: {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '600',
},
appliedPromoContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#F0FDF4',
  padding: 16,
  borderRadius: 12,
  marginTop: 12,
  borderWidth: 1,
  borderColor: '#BBF7D0',
},
appliedPromoInfo: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
},
appliedPromoIcon: {
  fontSize: 20,
},
appliedPromoText: {
  fontSize: 16,
  fontWeight: '600',
  color: '#166534',
},
appliedPromoSavings: {
  fontSize: 14,
  color: '#16A34A',
},
removePromoText: {
  fontSize: 14,
  color: '#DC2626',
  fontWeight: '600',
},
totalContainer: {
  marginTop: 16,
},
totalRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 8,
},
totalLabel: {
  fontSize: 16,
  color: '#6B7280',
},
totalValue: {
  fontSize: 16,
  color: '#374151',
  fontWeight: '500',
},
discountLabel: {
  color: '#16A34A',
},
discountValue: {
  color: '#16A34A',
},
finalTotalRow: {
  borderTopWidth: 1,
  borderTopColor: '#E5E7EB',
  paddingTop: 16,
  marginTop: 8,
},
finalTotalLabel: {
  fontSize: 18,
  fontWeight: '700',
  color: '#1F2937',
},
finalTotalValue: {
  fontSize: 18,
  fontWeight: '700',
  color: '#1F2937',
},
spacer: {
  height: 100,
},
bottomContainer: {
  backgroundColor: '#FFFFFF',
  borderTopWidth: 1,
  borderTopColor: '#E5E7EB',
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  padding: 20,
  paddingBottom: 30,
},
orderSummaryBottom: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20,
},
bottomTotalLabel: {
  fontSize: 16,
  color: '#6B7280',
},
bottomTotalValue: {
  fontSize: 24,
  fontWeight: '700',
  color: '#1F2937',
},
placeOrderButton: {
  backgroundColor: '#1F2937',
  paddingVertical: 18,
  borderRadius: 16,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
},
placeOrderButtonDisabled: {
  opacity: 0.6,
},
placeOrderIcon: {
  fontSize: 18,
},
placeOrderText: {
  color: '#FFFFFF',
  fontSize: 18,
  fontWeight: '700',
},
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'flex-end',
},
modalContent: {
  backgroundColor: '#FFFFFF',
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  maxHeight: height * 0.8,
},
modalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 20,
  paddingVertical: 20,
  borderBottomWidth: 1,
  borderBottomColor: '#E5E7EB',
},
modalTitle: {
  fontSize: 20,
  fontWeight: '700',
  color: '#1F2937',
},
modalCloseIcon: {
  fontSize: 20,
  color: '#6B7280',
},
modalScrollView: {
  paddingHorizontal: 20,
  paddingVertical: 20,
},
addNewButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 2,
  borderColor: '#D1D5DB',
  borderStyle: 'dashed',
  borderRadius: 16,
  paddingVertical: 20,
  gap: 8,
  marginBottom: 12,
},
addNewIcon: {
  fontSize: 20,
  color: '#6B7280',
},
addNewText: {
  fontSize: 16,
  color: '#6B7280',
  fontWeight: '500',
},
addButton: {
  borderWidth: 2,
  borderColor: '#E5E7EB',
  borderRadius: 16,
  padding: 16,
  alignItems: 'center',
},
addButtonText: {
  color: '#3B82F6',
  fontSize: 16,
  fontWeight: '600',
},
otpModal: {
  backgroundColor: '#FFFFFF',
  marginHorizontal: 20,
  borderRadius: 24,
  padding: 24,
  alignItems: 'center',
},
otpTitle: {
  fontSize: 20,
  fontWeight: '700',
  color: '#1F2937',
  marginBottom: 8,
},
otpSubtitle: {
  fontSize: 14,
  color: '#6B7280',
  textAlign: 'center',
  marginBottom: 20,
},
otpInput: {
  width: '100%',
  borderWidth: 1,
  borderColor: '#D1D5DB',
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 16,
  fontWeight: '600',
  letterSpacing: 4,
  textAlign: 'center',
  marginBottom: 12,
  backgroundColor: '#FFFFFF',
},
otpTimer: {
  marginBottom: 20,
},
timerText: {
  fontSize: 14,
  color: '#DC2626',
  fontWeight: '600',
},
otpButtons: {
  width: '100%',
  gap: 12,
},
verifyButton: {
  backgroundColor: '#3B82F6',
  paddingVertical: 16,
  borderRadius: 12,
  alignItems: 'center',
},
verifyButtonText: {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '600',
},
resendButton: {
  backgroundColor: '#F3F4F6',
  paddingVertical: 16,
  borderRadius: 12,
  alignItems: 'center',
},
resendButtonText: {
  color: '#374151',
  fontSize: 16,
  fontWeight: '600',
},
cancelOtpButton: {
  backgroundColor: '#F3F4F6',
  paddingVertical: 12,
  borderRadius: 12,
  alignItems: 'center',
},
cancelOtpButtonText: {
  color: '#374151',
  fontSize: 14,
  fontWeight: '500',
},
successModal: {
  backgroundColor: '#FFFFFF',
  marginHorizontal: 20,
  borderRadius: 24,
  padding: 30,
  alignItems: 'center',
},
successIcon: {
  width: 80,
  height: 80,
  borderRadius: 40,
  backgroundColor: '#F0FDF4',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 20,
},
successEmoji: {
  fontSize: 40,
},
successTitle: {
  fontSize: 24,
  fontWeight: '700',
  color: '#1F2937',
  textAlign: 'center',
  marginBottom: 12,
},
successSubtitle: {
  fontSize: 16,
  color: '#6B7280',
  textAlign: 'center',
  lineHeight: 24,
  marginBottom: 30,
},
successButtons: {
  width: '100%',
  gap: 12,
},
trackOrderButton: {
  backgroundColor: '#1F2937',
  paddingVertical: 16,
  borderRadius: 16,
  alignItems: 'center',
},
trackOrderText: {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '600',
},
continueShoppingButton: {
  backgroundColor: '#F3F4F6',
  paddingVertical: 16,
  borderRadius: 16,
  alignItems: 'center',
},
continueShoppingText: {
  color: '#374151',
  fontSize: 16,
  fontWeight: '600',
},
});
export default Checkout;
