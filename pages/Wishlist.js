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
import BottomNav from '../components/BottomNav';

const { width, height } = Dimensions.get('window');

const Wishlist = ({ navigation, activeNavIndex, setActiveNavIndex }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  // Load user data and wishlist
  const loadWishlist = async () => {
    setIsLoading(true);
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const parsedData = JSON.parse(userDataString);
        setUserData(parsedData);
        setWishlistItems(parsedData.wishlist || []);
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
      Alert.alert('Error', 'Failed to load wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  // Update wishlist in backend
  const updateWishlistInBackend = async (updatedWishlist) => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      
      if (!userToken) {
        Alert.alert('Error', 'User token not found. Please login again.');
        return false;
      }

      // Update local storage
      const updatedUserData = { ...userData, wishlist: updatedWishlist };
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
      setUserData(updatedUserData);
      setWishlistItems(updatedWishlist);

      // Update backend
      const response = await fetch(`https://voguemine.com/api/app/cart/update-wishlist?mobile=${updatedUserData?.mobile}&token=${userToken}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify(updatedWishlist)
      });

      if (!response.ok) {
        console.error('Failed to update wishlist on server');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating wishlist:', error);
      return false;
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  // Reload wishlist when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadWishlist();
    });

    return unsubscribe;
  }, [navigation]);

  const handleDelete = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    const updatedWishlist = wishlistItems.filter(item => item._id !== itemToDelete._id);
    
    const success = await updateWishlistInBackend(updatedWishlist);
    
    if (success) {
      setShowDeleteModal(false);
      setItemToDelete(null);
    } else {
      Alert.alert('Error', 'Failed to remove item from wishlist');
      setShowDeleteModal(false);
    }
  };

  const goToProduct = (item) => {
    navigation.navigate('Product', { 
      productId: item.handle,
      product: item 
    });
  };

  const WishlistItem = ({ item }) => (
    <View style={styles.wishlistItem}>
      <TouchableOpacity 
        style={styles.itemImageContainer}
        onPress={() => goToProduct(item)}
        activeOpacity={0.8}
      >
        <Image 
          source={{ uri: item.images?.[0]?.url || 'https://via.placeholder.com/400' }} 
          style={styles.itemImage} 
        />
      </TouchableOpacity>

      <View style={styles.itemDetails}>
        <TouchableOpacity onPress={() => goToProduct(item)}>
          <Text style={styles.itemName} numberOfLines={2}>{item.title}</Text>
        </TouchableOpacity>
        <Text style={styles.itemPrice}>₹{item.price?.toFixed(2) || '0.00'}</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.viewProductButton}
            onPress={() => goToProduct(item)}
          >
            <Text style={styles.viewProductText}>View Product</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item)}
          >
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/128/6861/6861294.png' }}
              style={styles.deleteIcon}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header navigation={navigation} currentPage="Wishlist" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading wishlist...</Text>
        </View>
        <BottomNav
          navigation={navigation}
          activeNavIndex={activeNavIndex}
          setActiveNavIndex={setActiveNavIndex}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header navigation={navigation} currentPage="Wishlist" />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {wishlistItems.length > 0 ? (
          <>
            {wishlistItems.map(item => <WishlistItem key={item._id} item={item} />)}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Image
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/128/102/102661.png',
              }}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>Your Wishlist is empty</Text>
            <Text style={styles.emptySubtext}>Add items you love to your wishlist</Text>
            <TouchableOpacity 
              style={styles.shopNowButton}
              onPress={() => {
                setActiveNavIndex(0);
                navigation.navigate('Home');
              }}
            >
              <Text style={styles.shopNowText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModal}>
            <Text style={styles.deleteTitle}>Remove from Wishlist?</Text>

            {itemToDelete && (
              <View style={styles.deleteItemPreview}>
                <View style={styles.deleteItemImageContainer}>
                  <Image
                    source={{ uri: itemToDelete.images?.[0]?.url || 'https://via.placeholder.com/400' }}
                    style={styles.deleteItemImage}
                  />
                </View>
                <View style={styles.deleteItemDetails}>
                  <Text style={styles.deleteItemName} numberOfLines={2}>
                    {itemToDelete.title}
                  </Text>
                  <Text style={styles.deleteItemPrice}>
                    ₹{itemToDelete.price?.toFixed(2) || '0.00'}
                  </Text>
                </View>
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
              >
                <Text style={styles.removeButtonText}>Yes, Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <BottomNav
        navigation={navigation}
        activeNavIndex={activeNavIndex}
        setActiveNavIndex={setActiveNavIndex}
      />
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
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingBottom: 30,
  },
  wishlistItem: {
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
    backgroundColor: '#f5f5f5',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#424242ff',
    marginBottom: 5,
    lineHeight: 15,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 3,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  viewProductButton: {
    backgroundColor: '#000',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  viewProductText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
  deleteIcon: {
    width: 20,
    height: 20,
    tintColor: '#ef4444',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    tintColor: '#ccc',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    color: '#333',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
  },
  shopNowButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  shopNowText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  deleteModal: {
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#fff',
  },
  deleteItemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  deleteItemDetails: {
    flex: 1,
  },
  deleteItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    lineHeight: 18,
  },
  deleteItemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  deleteActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  removeButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default Wishlist;