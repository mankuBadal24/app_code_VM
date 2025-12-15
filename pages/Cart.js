import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Modal,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../components/Header';

const { width, height } = Dimensions.get('window');

const ShoppingCart = ({ navigation }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Load cart data from AsyncStorage on mount
  useEffect(() => {
    loadCartData();
  }, []);

  const loadCartData = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const userDataString = await AsyncStorage.getItem('userData');

      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setUserToken(token);

        // Assuming cart is in userData.cart or userData.data.cart
        const cart = userData.cart || userData.data?.cart || [];
        setCartItems(cart);
      }
    } catch (error) {
      console.error('Error loading cart data:', error);
      Alert.alert('Error', 'Failed to load cart data');
    } finally {
      setIsLoading(false);
    }
  };

  // Update cart in AsyncStorage
  const updateCartInStorage = async (updatedCart) => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        userData.cart = updatedCart;
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Error updating cart in storage:', error);
    }
  };

  // Update cart in database via API
  const updateCartInDatabase = async (updatedCart) => {
    if (!userToken) {
      console.log('No user token found');
      return;
    }

    try {
      setIsUpdating(true);
      const userDataString = await AsyncStorage.getItem('userData');
      const userData = JSON.parse(userDataString);
      const response = await fetch(`https://voguemine.com/api/app/cart/update-cart?mobile=${userData.mobile}&token=${userToken}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify(updatedCart),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to update cart in database:', data);
      }
    } catch (error) {
      console.error('Error updating cart in database:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Update both storage and database
  const syncCart = async (updatedCart) => {
    setCartItems(updatedCart);
    await updateCartInStorage(updatedCart);
    await updateCartInDatabase(updatedCart);
  };

  const updateQuantity = (id, increment) => {
    const updatedCart = cartItems.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(1, item.quantity + increment) }
        : item
    );
    syncCart(updatedCart);
  };

  const handleDelete = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    const updatedCart = cartItems.filter(item => item.id !== itemToDelete.id);
    syncCart(updatedCart);
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.prdt.price * item.quantity), 0);
  };
  const total = calculateSubtotal();

  const CartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemImageContainer}>
        <Image
          source={{ uri: item.prdt.images[0].url }}
          style={styles.itemImage}
        />
      </View>

      <View style={styles.itemDetails}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.prdt.title}
        </Text>
        <Text style={styles.itemSize}>Size: {item.size || 'N/A'}</Text>

        <Text style={styles.itemPrice}>₹{item.prdt.price.toFixed(2)}</Text>
        <View style={styles.qtyContainer}>

        <View style={styles.quantityContainer}>

          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.id, -1)}
            disabled={isUpdating}
          >
            <Text style={styles.quantityButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>


          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.id, 1)}
            disabled={isUpdating}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.itemRight}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
          disabled={isUpdating}
        >
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/128/6861/6861294.png' }}
            style={styles.deleteIcon}
          />
        </TouchableOpacity>
      </View>
      </View>
      </View>

    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header navigation={navigation} currentPage="Cart" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading cart...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header navigation={navigation} currentPage="Cart" />
        <View style={styles.emptyContainer}>
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/128/2038/2038854.png' }}
            style={styles.emptyCartIcon}
          />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add some items to get started</Text>
          <TouchableOpacity
            style={styles.shopNowButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.shopNowText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header navigation={navigation} currentPage="Cart" />

      {isUpdating && (
        <View style={styles.updatingBanner}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.updatingText}>Updating cart...</Text>
        </View>
      )}

      {/* Scrollable Cart Items */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.cartContent}
        showsVerticalScrollIndicator={false}
      >
        {cartItems.map(item => (
          <CartItem key={item.id} item={item} />
        ))}
      </ScrollView>

      {/* Fixed Summary and Checkout Section */}
      <View style={styles.bottomSection}>
        {/* Summary */}
        <View style={styles.summary}>

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Checkout Button */}
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => {
                navigation.navigate('Checkout', {
                  cartItems,
                  total,
                });
              }}
          disabled={isUpdating}
        >
          <Text style={styles.checkoutButtonText}>Checkout →</Text>
        </TouchableOpacity>
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModal}>
            <Text style={styles.deleteTitle}>Remove from Cart?</Text>

            {itemToDelete && (
              <View style={styles.deleteItemPreview}>
                <View style={styles.deleteItemImageContainer}>
                  <Image
                    source={{ uri: itemToDelete.image || itemToDelete.images?.[0]?.url }}
                    style={styles.deleteItemImage}
                  />
                </View>
                <View style={styles.deleteItemDetails}>
                  <Text style={styles.deleteItemName} numberOfLines={2}>
                    {itemToDelete.name || itemToDelete.title}
                  </Text>
                  <Text style={styles.deleteItemPrice}>
                    ₹{itemToDelete.price.toFixed(2)}
                  </Text>
                  <View style={styles.deleteQuantityContainer}>
                    <View style={styles.quantityButton}>
                      <Text style={styles.quantityButtonText}>+</Text>
                    </View>
                    <Text style={styles.quantityText}>{itemToDelete.quantity}</Text>
                    <View style={styles.quantityButton}>
                      <Text style={styles.quantityButtonText}>−</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.deleteItemSize}>
                  {itemToDelete.size || 'N/A'}
                </Text>
              </View>
            )}

            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.removeButton}
                onPress={confirmDelete}
                disabled={isUpdating}
              >
                <Text style={styles.removeButtonText}>
                  {isUpdating ? 'Removing...' : 'Yes, Remove'}
                </Text>
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
    backgroundColor: '#F8F8F8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyCartIcon: {
    width: 120,
    height: 120,
    marginBottom: 20,
    tintColor: '#ccc',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  shopNowButton: {
    backgroundColor: '#000',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 25,
  },
  shopNowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  updatingBanner: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  updatingText: {
    color: '#fff',
    fontSize: 14,
  },
  scrollContainer: {
    flex: 1,
    paddingTop: 10,
  },
  cartContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  bottomSection: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  itemImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 15,
    borderColor: 'black',
    borderWidth: 1,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '500',
    color: 'black',
    marginBottom: 3,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  qtyContainer:{
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center'
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginHorizontal: 15,
  },
  itemRight: {
    alignItems: 'center',
  },
  itemSize: {
    fontSize: 13,
    fontWeight: '500',
    color: '#777777ff',
    marginBottom: 5,
  },
  deleteButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: {
    width: 17,
    height: 17,
  },
  summary: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  checkoutButton: {
    backgroundColor: '#000000',
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  checkoutModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    maxHeight: height * 0.8,
  },
  checkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  checkoutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 24,
    color: '#999',
  },
  checkoutContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  checkoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  checkoutLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  checkoutAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkoutActionText: {
    fontSize: 16,
    color: '#D4A574',
    marginRight: 8,
  },
  chevron: {
    fontSize: 16,
    color: '#D4A574',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 24,
    height: 16,
    backgroundColor: '#1E90FF',
    borderRadius: 3,
    marginRight: 8,
  },
  promoText: {
    fontSize: 16,
    color: '#D4A574',
    marginRight: 8,
  },
  totalCost: {
    fontSize: 16,
    color: '#D4A574',
    fontWeight: '600',
    marginRight: 8,
  },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginVertical: 20,
    lineHeight: 16,
  },
  placeOrderButton: {
    backgroundColor: '#000000',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeOrderIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  placeOrderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteModal: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignSelf: 'center',
    minWidth: width,
  },
  deleteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  deleteItemPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  deleteItemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 15,
  },
  deleteItemImage: {
    width: '100%',
    height: '100%',
  },
  deleteItemDetails: {
    flex: 1,
  },
  deleteItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 3,
  },
  deleteItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  deleteQuantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteItemSize: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 10,
  },
  deleteActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  removeButton: {
    flex: 1,
    backgroundColor: '#000000',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default ShoppingCart;