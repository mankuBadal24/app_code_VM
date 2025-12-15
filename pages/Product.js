import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../components/Header';
import RenderHTML from 'react-native-render-html';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const Product = ({ route, navigation }) => {
  const { productId, product: initialProduct } = route.params;
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState(initialProduct || null);
  const [availableColors, setAvailableColors] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [userData, setUserData] = useState(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const flatListRef = useRef(null);

  // Load user data and cart from AsyncStorage
  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const parsedData = JSON.parse(userDataString);
        setUserData(parsedData);
        setCartItems(parsedData.cart || []);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Check if current variant is in cart
  const isVariantInCart = () => {
    if (!selectedColor || !selectedSize || !product) return false;
    
    return cartItems.some(
      item =>
        item.productId === product._id &&
        item.color === selectedColor &&
        item.size === selectedSize
    );
  };

  // Get cart item for current variant
  const getCartItemForVariant = () => {
    if (!selectedColor || !selectedSize || !product) return null;
    
    return cartItems.find(
      item =>
        item.productId === product._id &&
        item.color === selectedColor &&
        item.size === selectedSize
    );
  };

  // Update cart in AsyncStorage and API
  const updateCartInBackend = async (updatedCart) => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      
      if (!userToken) {
        Alert.alert('Error', 'User token not found. Please login again.');
        return false;
      }

      // Update local storage
      const updatedUserData = { ...userData, cart: updatedCart };
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
      setUserData(updatedUserData);
      setCartItems(updatedCart);

      // Update backend
      const response = await fetch(`https://voguemine.com/api/app/cart/update-cart?mobile=${updatedUserData?.mobile}&token=${userToken}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify(updatedCart)
      });

      if (!response.ok) {
        console.error('Failed to update cart on server');
        return false;
      }

      const responseData = await response.json();
      console.log('Cart updated successfully:', responseData);
      return true;
    } catch (error) {
      console.error('Error updating cart:', error);
      return false;
    }
  };

  // Remove from cart function
  const handleRemoveFromCart = async () => {
    setIsAddingToCart(true);

    try {
      const updatedCart = cartItems.filter(
        item =>
          !(item.productId === product._id &&
            item.color === selectedColor &&
            item.size === selectedSize)
      );

      const success = await updateCartInBackend(updatedCart);

      if (success) {
        Alert.alert('Success', 'Item removed from cart!');
      } else {
        Alert.alert('Error', 'Failed to remove item from cart. Please try again.');
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      Alert.alert('Error', 'An error occurred while removing from cart.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Add to cart function
  const handleAddToCart = async () => {
    if (!selectedColor || !selectedSize) {
      Alert.alert('Selection Required', 'Please select both color and size.');
      return;
    }

    if (getAvailableQuantity() === 0) {
      Alert.alert('Out of Stock', 'This item is out of stock.');
      return;
    }

    // Check if variant is already in cart
    if (isVariantInCart()) {
      // Show confirmation before removing
      Alert.alert(
        'Remove from Cart',
        'This variant is already in your cart. Do you want to remove it?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Remove',
            onPress: handleRemoveFromCart,
            style: 'destructive'
          }
        ]
      );
      return;
    }

    setIsAddingToCart(true);

    try {
      const cartItem = {
        productId: product._id,
        prdt: product,
        color: selectedColor,
        size: selectedSize,
        quantity: quantity,
      };

      // Add new item to cart (we know it doesn't exist because of the check above)
      const updatedCart = [...cartItems, cartItem];

      const success = await updateCartInBackend(updatedCart);

      if (success) {
        Alert.alert('Success', 'Item added to cart!', [
          {
            text: 'Continue Shopping',
            onPress: () => {
              setQuantity(1);
            }
          },
          {
            text: 'Go to Cart',
            onPress: () => navigation.navigate('Cart')
          }
        ]);
      } else {
        Alert.alert('Error', 'Failed to add item to cart. Please try again.');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'An error occurred while adding to cart.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Buy Now function
  const handleBuyNow = async () => {
    if (!selectedColor || !selectedSize) {
      Alert.alert('Selection Required', 'Please select both color and size.');
      return;
    }

    if (getAvailableQuantity() === 0) {
      Alert.alert('Out of Stock', 'This item is out of stock.');
      return;
    }

    try {
      const cartItem = {
        productId: product._id,
        prdt: product,
        color: selectedColor,
        size: selectedSize,
        quantity: quantity,
      };

      navigation.navigate('Checkout', {
        product,
        quantity,
        selectedColor,
        selectedSize,
        cartItem
      });
    } catch (error) {
      console.error('Error navigating to checkout:', error);
      Alert.alert('Error', 'Failed to proceed to checkout.');
    }
  };

  const getProduct = async () => {
    if (initialProduct) {
      setProduct(initialProduct);
      processVariants(initialProduct);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const productResponse = await fetch(
        `https://voguemine.com/api/products/single-product?productHandle=${productId}`
      );
      const productData = await productResponse.json();
      if (productData.success && productData.product[0]) {
        const fetchedProduct = productData.product[0];
        setProduct(fetchedProduct);
        processVariants(fetchedProduct);
      }
    } catch (error) {
      console.error("Error fetching product:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const processVariants = (productData) => {
    if (!productData?.variants) return;

    const colors = [...new Set(productData.variants.map(v => v.color?.toLowerCase()).filter(Boolean))];
    const sizes = [...new Set(productData.variants.map(v => v.size).filter(Boolean))];

    setAvailableColors(colors);
    setAvailableSizes(sizes);

    if (colors.length > 0 && !selectedColor) {
      setSelectedColor(colors[0]);
    }
    
    if (colors.length > 0 && sizes.length > 0 && !selectedSize) {
      const firstColor = colors[0];
      const availableSize = sizes.find(size => {
        const variant = productData.variants.find(
          v => v.color?.toLowerCase() === firstColor && v.size === size && v.quantity > 0
        );
        return variant;
      });
      
      if (availableSize) {
        setSelectedSize(availableSize);
      } else {
        setSelectedSize(sizes[0]);
      }
    }
  };

  useEffect(() => {
    loadUserData();
    getProduct();
  }, [productId]);

  const updateQuantity = (increment) => {
    setQuantity(prev => Math.max(1, prev + increment));
  };

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (SCREEN_WIDTH - 20));
    setActiveImageIndex(index);
  };

  const getAvailableQuantity = () => {
    if (!product?.variants || !selectedColor || !selectedSize) return 0;
    
    const variant = product.variants.find(
      v => v.color?.toLowerCase() === selectedColor && v.size === selectedSize
    );
    return variant?.quantity || 0;
  };

  const ColorOption = ({ color, isSelected, onPress }) => {
    const colorMap = {
      'black': '#1a1a1a',
      'navy': '#1e3a8a',
      'blue': '#2563eb',
      'green': '#166534',
      'brown': '#92400e',
      'red': '#dc2626',
      'white': '#ffffff',
      'grey': '#6b7280',
      'gray': '#6b7280',
      'pink': '#ec4899',
      'yellow': '#eab308',
      'orange': '#f97316',
      'purple': '#9333ea',
    };

    const colorValue = colorMap[color.toLowerCase()] || '#999999';

    return (
      <TouchableOpacity
        style={[
          styles.colorOption,
          { backgroundColor: colorValue },
          colorValue === '#ffffff' && { borderWidth: 1, borderColor: '#ddd' },
          isSelected && styles.colorOptionSelected
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {isSelected && (
          <View style={styles.colorCheckmark}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const SizeOption = ({ size, isSelected, onPress, isAvailable }) => (
    <TouchableOpacity
      style={[
        styles.sizeOption,
        isSelected && styles.sizeOptionSelected,
        !isAvailable && styles.sizeOptionDisabled
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!isAvailable}
    >
      <Text style={[
        styles.sizeText,
        isSelected && styles.sizeTextSelected,
        !isAvailable && styles.sizeTextDisabled
      ]}>
        {size}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#333" />
          <Text style={styles.loadingText}>Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Product not found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const availableQuantity = getAvailableQuantity();
  const isOutOfStock = availableQuantity === 0;
  const variantInCart = isVariantInCart();
  const cartItemForVariant = getCartItemForVariant();

  return (
    <SafeAreaView style={styles.container}>
      <Header navigation={navigation} currentPage={product.title}/>
      
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Product Images */}
        <View style={styles.imageContainer}>
          <FlatList
            ref={flatListRef}
            data={product?.images || []}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.imageWrapper}>
                <Image
                  source={
                    item?.url
                      ? { uri: item.url }
                      : { uri: 'https://via.placeholder.com/400' }
                  }
                  style={styles.productImage}
                  resizeMode="cover"
                />
              </View>
            )}
          />

          {/* Stock Badge */}
          {isOutOfStock && (
            <View style={[styles.discountBadge, { backgroundColor: '#666' }]}>
              <Text style={styles.discountText}>OUT OF STOCK</Text>
            </View>
          )}

          {/* In Cart Badge */}
          {variantInCart && (
            <View style={[styles.discountBadge, { backgroundColor: '#22c55e', top: 10 }]}>
              <Text style={styles.discountText}>IN CART</Text>
            </View>
          )}

          {/* Image Indicators */}
          {product?.images?.length > 1 && (
            <View style={styles.imageIndicators}>
              {product.images.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.indicator,
                    activeImageIndex === index && styles.activeIndicator
                  ]}
                  onPress={() => setActiveImageIndex(index)}
                  activeOpacity={0.8}
                />
              ))}
            </View>
          )}
        </View>

        {/* Product Details */}
        <View style={styles.productDetails}>
          {/* Brand & Rating */}
          <View style={styles.brandRow}>
            <Text style={styles.brandText}>{product.brand || 'Brand'}</Text>
            {product.ratings?.length > 0 && (
              <View style={styles.ratingContainer}>
                <Text style={styles.starIcon}>★</Text>
                <Text style={styles.starIcon}>★</Text>
                <Text style={styles.starIcon}>★</Text>
                <Text style={styles.starIcon}>★</Text>
                <Text style={styles.starIcon}>★</Text>
                <Text style={styles.reviewsText}>({product.ratings.length})</Text>
              </View>
            )}
          </View>

          {/* Product Name & Price */}
          <Text style={styles.productName}>{product.title}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>₹ {product.price?.toFixed(2) || '0.00'}</Text>
          </View>

          {/* Variant Status Message */}
          {variantInCart && cartItemForVariant && (
            <View style={styles.variantStatusContainer}>
              <Text style={styles.variantStatusText}>
                ✓ This variant is in your cart (Qty: {cartItemForVariant.quantity})
              </Text>
            </View>
          )}

          {/* Colors */}
          {availableColors.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Color</Text>
                <Text style={styles.selectedText}>
                  {selectedColor?.charAt(0).toUpperCase() + selectedColor?.slice(1)}
                </Text>
              </View>
              <View style={styles.colorsContainer}>
                {availableColors.map((color) => (
                  <ColorOption
                    key={color}
                    color={color}
                    isSelected={selectedColor === color}
                    onPress={() => setSelectedColor(color)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Sizes */}
          {availableSizes.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Size</Text>
              </View>
              <View style={styles.sizesContainer}>
                {availableSizes.map((size) => {
                  const variant = product.variants?.find(
                    v => v.size === size && v.color?.toLowerCase() === selectedColor
                  );
                  const isAvailable = variant?.quantity > 0;
                  
                  return (
                    <SizeOption
                      key={size}
                      size={size}
                      isSelected={selectedSize === size}
                      isAvailable={isAvailable}
                      onPress={() => setSelectedSize(size)}
                    />
                  );
                })}
              </View>
            </View>
          )}

          {/* Quantity */}
          {!isOutOfStock && !variantInCart && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Quantity {availableQuantity > 0 && (
                  <Text style={styles.stockText}>({availableQuantity} available)</Text>
                )}
              </Text>
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(-1)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.quantityButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(1)}
                  activeOpacity={0.8}
                  disabled={quantity >= availableQuantity}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Description */}
          {product.description && (
            <RenderHTML
              source={{ html: product.description }}
              baseStyle={styles.description}
            />
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomContainer}>
        <View style={styles.priceSection}>
          <Text style={styles.totalLabel}>Total Price</Text>
          <Text style={styles.totalPrice}>
            ₹ {((product.price || 0) * (variantInCart ? (cartItemForVariant?.quantity || 1) : quantity)).toFixed(2)}
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.addToCartButton,
              isOutOfStock && styles.disabledButton,
              variantInCart && styles.removeFromCartButton
            ]}
            activeOpacity={0.9}
            disabled={isOutOfStock || isAddingToCart}
            onPress={handleAddToCart}
          >
            {isAddingToCart ? (
              <ActivityIndicator size="small" color={variantInCart ? "#fff" : "#333"} />
            ) : (
              <>
                <Text style={[styles.cartIcon, variantInCart && { color: '#fff' }]}>
                  {variantInCart ? '🗑️' : '🛒'}
                </Text>
                <Text style={[styles.addToCartText, variantInCart && styles.removeFromCartText]}>
                  {isOutOfStock ? 'Out of Stock' : variantInCart ? 'Remove from Cart' : 'Add to Cart'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buyNowButton, isOutOfStock && styles.disabledButton]}
            activeOpacity={0.9}
            onPress={handleBuyNow}
            disabled={isOutOfStock}
          >
            <Text style={styles.buyNowText}>Buy Now</Text>
            <Text style={styles.arrowIcon}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    backgroundColor: '#F8F8F8',
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  imageWrapper: {
    width: SCREEN_WIDTH - 20,
    aspectRatio: 1,
    padding: 8,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 10,
    backgroundColor: '#FF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  imageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D0D0D0',
  },
  activeIndicator: {
    backgroundColor: '#333',
    width: 24,
  },
  productDetails: {
    padding: 20,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starIcon: {
    fontSize: 16,
    color: '#FFD700',
  },
  reviewsText: {
    fontSize: 14,
    color: '#666',
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    lineHeight: 30,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  variantStatusContainer: {
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  variantStatusText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 24,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  selectedText: {
    fontSize: 14,
    color: '#666',
  },
  stockText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '400',
  },
  colorsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderColor: '#333',
  },
  colorCheckmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 12,
    color: '#333',
    fontWeight: '700',
  },
  sizesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sizeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  sizeOptionSelected: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  sizeOptionDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  sizeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  sizeTextSelected: {
    color: '#FFFFFF',
  },
  sizeTextDisabled: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 22,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 10,
    paddingBottom: 30,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    paddingVertical: 15,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  removeFromCartButton: {
    backgroundColor: '#ef4444',
  },
  cartIcon: {
    fontSize: 16,
  },
  addToCartText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  removeFromCartText: {
    color: '#FFFFFF',
  },
  buyNowButton: {
    flex: 1.2,
    backgroundColor: '#1a1a1a',
    paddingVertical: 10,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  buyNowText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  arrowIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default Product;