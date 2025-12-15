import React, { useEffect, useState, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Linking,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import Login from '../components/Login'
const { width } = Dimensions.get('window');
const BANNER_HEIGHT = Math.round(width * 0.82); // nice aspect ratio

// Move all component definitions outside the main component
const CollectionCard = memo(({ item , navigation}) => {
  const handlePress = () => {
    // Pass the collection with handle for API call
    navigation.navigate('Products', { 
      collection: {
        ...item,
        handle: item.handle || item.id,
      }
    });
  };
  return (
  <TouchableOpacity style={styles.collectionCard} activeOpacity={0.85} onPress={handlePress}>
    <Image source={{ uri: item.images[0].url }} style={styles.collectionImage} />
  </TouchableOpacity>
)});

const CollectionsSection = memo(({ data, navigation }) => (
  <View style={styles.collectionsSection}>
    <FlatList
      data={data}
      renderItem={({ item }) => <CollectionCard item={item} navigation={navigation} />}
      keyExtractor={(item) => item.title}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.collectionsList}
    />
  </View>
));

const SectionProductCard = memo(({ item, navigation }) => {
  const img = item.images[2] ? item.images[2].url : item.images[0].url
  return (
    <TouchableOpacity
      style={styles.sectionProductCard}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('Products', { 
        collection: {
          ...item,
          handle: item.handle || item.id,
        }
      })}
    >
      <Image source={{ uri: img }} style={styles.sectionProductImage} />
    </TouchableOpacity>
  );
});

const ProductsSection = memo(({ data, colIndex, title, navigation }) => (
  <View style={[styles.productsSection, colIndex === 1 ? styles.col1 : styles.col2]}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeading}>{title}</Text>
      {/* <TouchableOpacity style={styles.viewAllButton}>
        <Text style={styles.viewAllText}>View All</Text>
        <Text style={styles.viewAllArrow}>→</Text>
      </TouchableOpacity> */}
    </View>
    <FlatList
      data={data}
      renderItem={({ item }) => <SectionProductCard item={item} navigation={navigation} />}
      keyExtractor={(item) => item.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.sectionProductsList}
    />
  </View>
));

const ProductInfoCard = memo(({ item, navigation, wishlistItems, onToggleWishlist, cartItems }) => {
  const isInWishlist = wishlistItems.some(w => w._id === item._id);
  const isInCart = cartItems.some(cartItem => cartItem.productId === item._id);

  return (
    <TouchableOpacity
      style={styles.productInfoCard}
      onPress={() => navigation.navigate('Product', { productId: item.handle })}
      activeOpacity={0.85}
    >
      <View style={styles.productImageContainer}>
        <Image source={{ uri: item.images[0].url }} style={styles.productImage} />
        {isInCart && (
          <View style={styles.inCartBadge}>
            <Text style={styles.inCartText}>IN CART</Text>
          </View>
        )}
        <View style={styles.productOverlay}>
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation();
              onToggleWishlist(item);
            }}
          >
            <Image
              source={{ 
                uri: isInWishlist 
                  ? 'https://cdn-icons-png.flaticon.com/128/833/833472.png'
                  : 'https://cdn-icons-png.flaticon.com/128/833/833472.png' 
              }}
              style={[styles.favoriteIcon, isInWishlist && styles.favoriteIconActive]}
            />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.title}</Text>
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>₹{item.price}</Text>
          <View style={styles.ratingContainer}>
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/128/1828/1828884.png' }}
              style={styles.starIcon}
            />
            <Text style={styles.rating}>{item.ratings.length}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const ProductsInfoSection = memo(({ data, navigation, wishlistItems, onToggleWishlist, cartItems }) => (
  <View style={styles.productsInfoSection}>
    <FlatList
      data={data}
      renderItem={({ item }) => (
        <ProductInfoCard 
          item={item} 
          navigation={navigation} 
          wishlistItems={wishlistItems}
          onToggleWishlist={onToggleWishlist}
          cartItems={cartItems}
        />
      )}
      keyExtractor={(item) => item.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.sectionProductsList}
    />
  </View>
));

const CouponRibbon = memo(({ ribbonBanner, couponData }) => (
  <TouchableOpacity style={styles.couponContainer} activeOpacity={0.85}>
    {ribbonBanner ? (
      <Image source={{ uri: ribbonBanner.url }} style={styles.ribbonBannerImage} />
    ) : (
      <View style={styles.couponContent}>
        <View style={styles.couponLeft}>
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/128/5141/5141376.png' }}
            style={styles.couponIcon}
          />
        </View>
        <View style={styles.couponMiddle}>
          <Text style={styles.couponTitle}>{couponData.title}</Text>
          <Text style={styles.couponSubtitle}>{couponData.subtitle}</Text>
        </View>
        <View style={styles.couponRight}>
          <Text style={styles.couponCode}>{couponData.code}</Text>
        </View>
      </View>
    )}
  </TouchableOpacity>
));

const ProductCard = memo(({ item, navigation, wishlistItems, onToggleWishlist, cartItems }) => {
  const isInWishlist = wishlistItems.some(w => w._id === item._id);
  const isInCart = cartItems.some(cartItem => cartItem.productId === item._id);

  return (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('Product', { productId: item.handle })}
      activeOpacity={0.85}
    >
      <View style={styles.productImageContainer}>
        <Image source={{ uri: item.images[0].url }} style={styles.productImage} />
        {isInCart && (
          <View style={styles.inCartBadge}>
            <Text style={styles.inCartText}>IN CART</Text>
          </View>
        )}
        <View style={styles.productOverlay}>
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation();
              onToggleWishlist(item);
            }}
          >
            <Image
              source={{ 
                uri: isInWishlist 
                  ? 'https://cdn-icons-png.flaticon.com/128/833/833472.png'
                  : 'https://cdn-icons-png.flaticon.com/128/833/833472.png' 
              }}
              style={[styles.favoriteIcon, isInWishlist && styles.favoriteIconActive]}
            />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.title}</Text>
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>₹{item.price}</Text>
          <View style={styles.ratingContainer}>
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/128/1828/1828884.png' }}
              style={styles.starIcon}
            />
            <Text style={styles.rating}>{item.ratings.length}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const ReelCard = memo(({ item, onPress }) => (
  <TouchableOpacity style={styles.reelCard} activeOpacity={0.85} onPress={onPress}>
    <Image source={{ uri: item.thumbnail_url || item.media_url }} style={styles.reelImage} />
    <View style={styles.reelOverlay}>
      <Image
        source={{ uri: 'https://cdn-icons-png.flaticon.com/128/5968/5968764.png' }}
        style={styles.playIcon}
      />
    </View>
  </TouchableOpacity>
));

const InstagramReelsSection = memo(({ reels, onFollowPress, isLoadingReels }) => (
  <View style={styles.productsSection}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeading}>Instagram Reels</Text>
      <TouchableOpacity style={styles.viewAllButton} onPress={onFollowPress}>
        <Text style={styles.viewAllText}>Follow Us</Text>
        <Text style={styles.viewAllArrow}>→</Text>
      </TouchableOpacity>
    </View>
    {isLoadingReels ? (
      <View style={styles.reelsLoadingContainer}>
        <ActivityIndicator size="small" color="#000" />
        <Text style={styles.reelsLoadingText}>Loading reels...</Text>
      </View>
    ) : reels.length > 0 ? (
      <FlatList
        data={reels}
        renderItem={({ item }) => (
          <ReelCard 
            item={item} 
            onPress={() => {
              if (item.permalink) {
                Linking.openURL(item.permalink);
              }
            }}
          />
        )}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sectionProductsList}
      />
    ) : (
      <View style={styles.reelsErrorContainer}>
        <Text style={styles.reelsErrorText}>No reels available</Text>
      </View>
    )}
  </View>
));

const AllProductsSection = memo(({ products, navigation, wishlistItems, onToggleWishlist, cartItems }) => (
  <View style={styles.infiniteScrollSection}>
    <View style={styles.allProductsHeader}>
      <Text style={styles.allProductsHeading}>All Products</Text>
      <Text style={styles.allProductsCount}>{products.length} items</Text>
    </View>
    <View style={styles.productsGrid}>
      {products.map((item) => (
        <ProductCard 
          key={item.id} 
          item={item} 
          navigation={navigation}
          wishlistItems={wishlistItems}
          onToggleWishlist={onToggleWishlist}
          cartItems={cartItems}
        />
      ))}
    </View>
  </View>
));

const HomePage = ({ navigation, activeNavIndex, setActiveNavIndex }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [banners, setBanners] = useState([]);
  const [ribbonBanner, setRibbonBanner] = useState(null);
  const [mensCollections, setMensCollections] = useState([])
  const [womensCollections, setWomensCollections] = useState([])
  const [recentCollections,setRecentCollections] = useState([])
  const [trendingCollections,setTrendingCollections] = useState([])
  const [firstCollectionsProducts,setFirstCollectionsProducts] = useState([])
  const [mostTrendingProducts,setMostTrendingProducts] = useState([])
  const [wishlistItems, setWishlistItems] = useState([]);
  const [userData, setUserData] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [instagramReels, setInstagramReels] = useState([]);
  const [isLoadingReels, setIsLoadingReels] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const bannerRef = useRef(null);
  const [bannerIndex, setBannerIndex] = useState(0);
  const couponData = {
    code: 'SAVE30',
    title: 'Get 30% OFF on your first order',
    subtitle: 'Use code at checkout',
  };

  // Load user data, wishlist and cart
  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const parsedData = JSON.parse(userDataString);
        setUserData(parsedData);
        setWishlistItems(parsedData.wishlist || []);
        setCartItems(parsedData.cart || []);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Fetch Instagram Reels
  const fetchInstagramReels = async () => {
    setIsLoadingReels(true);
    try {
      // Replace with your Instagram Business Account ID and Access Token
      const INSTAGRAM_BUSINESS_ACCOUNT_ID = '17841477860532422';
      const ACCESS_TOKEN = 'EAAMF2wEGCf4BPt2QFQgBl6k28kkRAUG0tpQ6PJusrtsGGNLOFyaOnxkdjimDR92BIa26MpQLVZBrpZCaZCSPxwO3ez6H2wV49zFtZAAYynzMdrEX5e3DYFCv2cayJ7YWerBlx3IGY8IuA1OWNr3jWlpb8UESqtyWa39iCvKc47vXbtPUaB0mlZAQZCoyBw';
      
      const response = await fetch(
  `https://graph.facebook.com/v19.0/${INSTAGRAM_BUSINESS_ACCOUNT_ID}/media?fields=id,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${ACCESS_TOKEN}`
);
      
      const data = await response.json();      
      if (data.data) {
        // Filter only reels and get the latest 8
        const reels = data.data
          .filter(item => item.media_type === 'VIDEO' || item.media_type === 'REELS')
          .slice(0, 8);
        
        setInstagramReels(reels);
      }
    } catch (error) {
      console.error('Error fetching Instagram reels:', error);
      setInstagramReels([]);
    } finally {
      setIsLoadingReels(false);
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

  // Toggle wishlist
  const handleToggleWishlist = async (product) => {
    const isInWishlist = wishlistItems.some(w => w._id === product._id);
    
    let updatedWishlist;
    if (isInWishlist) {
      // Remove from wishlist
      updatedWishlist = wishlistItems.filter(w => w._id !== product._id);
    } else {
      // Add to wishlist
      updatedWishlist = [...wishlistItems, product];
    }

    const success = await updateWishlistInBackend(updatedWishlist);
    
    if (!success) {
      Alert.alert('Error', 'Failed to update wishlist. Please try again.');
    }
  };
  
  const getBanners = async () => {
    try {
      const response = await fetch('https://voguemine.com/api/app/home');
      const data = await response.json();
      if(data.success){
        const carouselBanners = data.data.banners.banners.slice(0, 6);
        const ribbonBannerData = data.data.banners.banners[6] || null;
        
        setBanners(carouselBanners);
        setRibbonBanner(ribbonBannerData);
        setMensCollections(data.data.mensCollections)
        setWomensCollections(data.data.womensCollections)
        setRecentCollections(data.data.recentCollections)
        setTrendingCollections(data.data.trendingCollections)
        setFirstCollectionsProducts(data.data.firstCollectionProducts)
        setMostTrendingProducts(data.data.mostTrendingProducts)
        setProducts(data.data.latestProducts)
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleFollowInstagram = () => {
    // Replace with your Instagram profile URL
    Linking.openURL('https://www.instagram.com/voguemine.official/');
  };

  useEffect(() => {
    loadUserData();
    getBanners();
    fetchInstagramReels();
  }, []);

  // Reload user data when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
    });

    return unsubscribe;
  }, [navigation]);

  // Auto-carousel - Fixed to use state properly
  useEffect(() => {
    // auto-scroll banners every 4 sec
    const id = setInterval(() => {
      const next = (bannerIndex + 1) % banners.length;
      bannerRef.current?.scrollToOffset({ offset: next * width, animated: true });
      setBannerIndex(next);
    }, 4000);
    return () => clearInterval(id);
  }, [bannerIndex]);

  useEffect(() => {
    // listen to scrollX to update bannerIndex when user swipes
    const listener = scrollX.addListener(({ value }) => {
      const index = Math.round(value / width);
      setBannerIndex(index);
    });
    return () => scrollX.removeListener(listener);
  }, []);

    const renderBanner = () => (
      <View style={styles.bannerContainer}>
        <Animated.FlatList
          ref={bannerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          data={banners}
          keyExtractor={(_, i) => i.toString()}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.9}>
              <Image source={{uri: item.url}} style={styles.bannerImage} resizeMode="cover" />
            </TouchableOpacity>
          )}
        />
        <View style={styles.dots}>
          {banners.map((_, i) => {
            const opacity = bannerIndex === i ? 1 : 0.3;
            const widthDot = bannerIndex === i ? 28 : 10;
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { opacity, width: widthDot }]}
              />
            );
          })}
        </View>
      </View>
    );

  return (
    <SafeAreaView style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      )}

      <Header navigation={navigation} currentPage="Home"/>
      <Login/>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderBanner()}

        <CouponRibbon ribbonBanner={ribbonBanner} couponData={couponData} />

        <CollectionsSection data={mensCollections} navigation={navigation}/>

        <CollectionsSection data={womensCollections} navigation={navigation}/>

        <ProductsSection 
          data={recentCollections} 
          colIndex={1} 
          title="New Arrivals" 
          navigation={navigation}
          cartItems={cartItems}
        />
        <ProductsInfoSection 
          data={firstCollectionsProducts} 
          navigation={navigation}
          wishlistItems={wishlistItems}
          onToggleWishlist={handleToggleWishlist}
          cartItems={cartItems}
        />

        <ProductsSection 
          data={trendingCollections} 
          colIndex={2} 
          title="Best Sellers" 
          navigation={navigation}
          cartItems={cartItems}
        />
        <ProductsInfoSection 
          data={mostTrendingProducts} 
          navigation={navigation}
          wishlistItems={wishlistItems}
          onToggleWishlist={handleToggleWishlist}
          cartItems={cartItems}
        />

        <InstagramReelsSection 
          reels={instagramReels} 
          onFollowPress={handleFollowInstagram}
          isLoadingReels={isLoadingReels}
        />

        <AllProductsSection 
          products={products} 
          navigation={navigation}
          wishlistItems={wishlistItems}
          onToggleWishlist={handleToggleWishlist}
          cartItems={cartItems}
        />
      </ScrollView>
      <BottomNav navigation={navigation} activeNavIndex={activeNavIndex} setActiveNavIndex={setActiveNavIndex}/>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  content: {
    flex: 1,
    marginTop: 0,
  },
  contentContainer: {
    paddingBottom: 20,
  },

  // Carousel Styles - Adjusted height
  bannerContainer: {
    marginTop: 0,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  bannerImage: {
    width: width,
    height: BANNER_HEIGHT,
    resizeMode:'contain'
  },
  dots: {
    position: "absolute",
    bottom:-15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#000",
    marginHorizontal: 6,
  },

  // Coupon/Ribbon Styles
  couponContainer: {
    marginBottom: 24,
    background: 'transparent',
    overflow: 'hidden',
  },
  ribbonBannerImage: {
    width: '100%',
    height: 64,
    resizeMode: 'contain',
  },
  couponContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  couponLeft: {
    marginRight: 16,
  },
  couponIcon: {
    width: 28,
    height: 28,
    tintColor: '#fff',
  },
  couponMiddle: {
    flex: 1,
  },
  couponTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 3,
  },
  couponSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  couponRight: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  couponCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 1.5,
  },

  // Collections Styles
  collectionsSection: {
    marginBottom: 20,
  },
  collectionsList: {
    paddingHorizontal: 16,
  },
  collectionCard: {
    width: (width * 0.19),
    height: (width * 0.19),
    marginRight: 17,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  collectionImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // In Cart Badge
  inCartBadge: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: '#22c55e',
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 10,
  },
  inCartText: {
    color: '#fff',
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Products Section Styles
  productsSection: {
    marginBottom: 30,
    paddingVertical: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '500',
    color: '#000',
    letterSpacing: 0.3,
    fontStyle: 'italic'
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'black',
    marginRight: 4,
  },
  viewAllArrow: {
    fontSize: 14,
    color: 'black',
    fontWeight: '600',
  },
  sectionProductsList: {
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  productsInfoSection: {
    paddingVertical: 5,
  },
  sectionProductCard: {
    width: (width / 4),
    aspectRatio: 9/16,
    marginRight: 5,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: '#fff',
    position: 'relative',
  },
  sectionProductImage: {
    width: '100%',
    aspectRatio: 9 / 16,
    resizeMode: 'contain',
  },
  col1: {
    backgroundColor: '#f6e6ffff',
  },
  col2: {
    backgroundColor: '#fff6e6ff',
  },

  // Instagram Reels Styles
  reelCard: {
    width: (width / 3.2),
    marginRight: 10,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  reelImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    resizeMode: 'cover',
  },
  reelOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    width: 36,
    height: 36,
    tintColor: 'white',
  },
  reelsLoadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelsLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  reelsErrorContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelsErrorText: {
    fontSize: 14,
    color: '#666',
  },

  // Infinite Scroll Products Styles
  infiniteScrollSection: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  allProductsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  allProductsHeading: {
    fontSize: 20,
    fontWeight: '500',
    color: '#000',
    letterSpacing: 0.3,
  },
  allProductsCount: {
    fontSize: 13,
    color: '#666',
    fontWeight: '400',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: (width - 42) / 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  productInfoCard: {
    width: (width - 42) / 2.3,
    marginBottom: 16,
    marginRight: 10,
    overflow: 'hidden',
  },
  productImageContainer: {
    position: 'relative',
    backgroundColor: '#f5f5f5',
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
    resizeMode: 'cover',
    borderRadius: 10,
  },
  productOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  favoriteButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    width: 15,
    height: 15,
    tintColor: '#333',
  },
  favoriteIconActive: {
    tintColor: '#ef4444',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
    lineHeight: 19,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  starIcon: {
    width: 13,
    height: 13,
    tintColor: '#ffa500',
    marginRight: 4,
  },
  rating: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
});

export default HomePage;