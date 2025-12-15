import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from "../components/Header";

const sortOptions = [
  { label: "Default", value: "default" },
  { label: "Price: Low → High", value: "price" },
  { label: "Price: High → Low", value: "-price" },
  { label: "Newest First", value: "-createdAt" },
  { label: "Oldest First", value: "createdAt" },
  { label: "Most Sold", value: "sold" },
  { label: "A → Z", value: "title" },
  { label: "Z → A", value: "-title" },
];

const Search = ({ route, navigation }) => {
  const { searchValue } = route.params || {};
  
  const [sortType, setSortType] = useState("default");
  const [wishlist, setWishlist] = useState([]);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    color: null,
    size: null,
    brand: null,
  });
  const [tempFilters, setTempFilters] = useState({
    color: null,
    size: null,
    brand: null,
  });
  const [sortDropdownVisible, setSortDropdownVisible] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [availableFilters, setAvailableFilters] = useState({
    colors: [],
    sizes: [],
    brands: [],
  });
  const [searchQuery, setSearchQuery] = useState(searchValue || "");
  const [userData, setUserData] = useState(null);

  const isInitialMount = useRef(true);
  const shouldFetchRef = useRef(false);

  // Load user data and wishlist
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const parsedData = JSON.parse(userDataString);
        setUserData(parsedData);
        setWishlist(parsedData.wishlist?.map(item => item._id) || []);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  useEffect(() => {
    if (searchQuery) {
      fetchProducts(1, true);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (shouldFetchRef.current && !loading) {
      fetchProducts(1, true);
      shouldFetchRef.current = false;
    }
  }, [selectedFilters]);

  useEffect(() => {
    if (!isInitialMount.current && !loading) {
      fetchProducts(1, true);
    }
  }, [sortType]);

  const buildApiUrl = (page) => {
    let url = `https://voguemine.com/api/products/search?search=${encodeURIComponent(searchQuery)}&page=${page}&limit=16`;
    
    if (sortType && sortType !== "default") {
      url += `&sort=${sortType}`;
    }
    
    if (selectedFilters.color) {
      url += `&color=${encodeURIComponent(selectedFilters.color)}`;
    }
    
    if (selectedFilters.size) {
      url += `&size=${encodeURIComponent(selectedFilters.size)}`;
    }
    
    if (selectedFilters.brand) {
      url += `&brand=${encodeURIComponent(selectedFilters.brand)}`;
    }
    
    url += `&state=active`;
    
    return url;
  };

  const fetchProducts = async (page, resetProducts = false) => {
    if (!searchQuery) {
      setLoading(false);
      return;
    }

    try {
      if (resetProducts) {
        setLoading(true);
        setProducts([]);
      } else {
        setLoadingMore(true);
      }

      const url = buildApiUrl(page);
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        const fetchedProducts = data.products || [];
        
        if (resetProducts) {
          setProducts(fetchedProducts);
          setCurrentPage(1);
        } else {
          setProducts(prevProducts => [...prevProducts, ...fetchedProducts]);
          setCurrentPage(page);
        }
        
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalProducts(data.pagination?.totalProducts || 0);
        
        if (data.filters) {
          setAvailableFilters({
            colors: data.filters.colors || [],
            sizes: data.filters.sizes || [],
            brands: data.filters.brands || [],
          });
        }
      } else {
        console.error('API returned error:', data.error);
        Alert.alert('Error', data.error || 'Failed to fetch products');
      }
      
      setLoading(false);
      setLoadingMore(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to fetch products. Please try again.');
      setLoading(false);
      setLoadingMore(false);
      setProducts([]);
    }
  };

  const toggleWishlist = async (product) => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      
      if (!userToken || !userData) {
        Alert.alert('Login Required', 'Please login to add items to wishlist');
        navigation.navigate('Login');
        return;
      }

      let updatedWishlist;
      const isInWishlist = wishlist.includes(product._id);

      if (isInWishlist) {
        updatedWishlist = userData.wishlist.filter(item => item._id !== product._id);
        setWishlist(wishlist.filter(id => id !== product._id));
      } else {
        updatedWishlist = [...(userData.wishlist || []), product];
        setWishlist([...wishlist, product._id]);
      }

      // Update backend
      const response = await fetch(
        `https://voguemine.com/api/app/cart/update-wishlist?mobile=${userData.mobile}&token=${userToken}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify(updatedWishlist)
        }
      );

      if (response.ok) {
        const updatedUserData = { ...userData, wishlist: updatedWishlist };
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
        setUserData(updatedUserData);
      } else {
        // Revert on failure
        if (isInWishlist) {
          setWishlist([...wishlist, product._id]);
        } else {
          setWishlist(wishlist.filter(id => id !== product._id));
        }
        Alert.alert('Error', 'Failed to update wishlist');
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      Alert.alert('Error', 'Failed to update wishlist');
    }
  };

  const openFilters = () => {
    setTempFilters({...selectedFilters});
    setFiltersVisible(true);
  };

  const closeFilters = () => {
    setFiltersVisible(false);
    setSortDropdownVisible(false);
  };

  const applyFilters = () => {
    setSelectedFilters({...tempFilters});
    shouldFetchRef.current = true;
    closeFilters();
  };

  const clearFilters = () => {
    const emptyFilters = {
      color: null,
      size: null,
      brand: null,
    };
    setTempFilters(emptyFilters);
  };

  const handleSortSelect = (value) => {
    setSortType(value);
    setSortDropdownVisible(false);
  };

  const loadMore = () => {
    if (loadingMore || loading || currentPage >= totalPages) return;
    
    fetchProducts(currentPage + 1, false);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchProducts(1, true);
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#111" />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  if (!searchQuery && !loading) {
    return (
      <View style={styles.container}>
        <Header navigation={navigation} currentPage="Search" />
        <View style={[styles.container, styles.centerContent]}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.errorText}>Enter a search query</Text>
          <Text style={styles.errorSubtext}>Search for products by name, category, or brand</Text>
        </View>
      </View>
    );
  }

  if (loading && products.length === 0) {
    return (
      <View style={styles.container}>
        <Header navigation={navigation} currentPage="Search" />
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color="#111" />
          <Text style={styles.loadingText}>Searching products...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header navigation={navigation} currentPage="Search Results" />
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search products..."
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Image
            source={{ uri: "https://cdn-icons-png.flaticon.com/128/3917/3917754.png" }}
            style={styles.searchIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Results Header */}
      {totalProducts > 0 && (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>
            {totalProducts} {totalProducts === 1 ? 'result' : 'results'} found
          </Text>
        </View>
      )}

      {/* Product List */}
      <FlatList
        data={products}
        keyExtractor={(item, index) => item._id?.toString() || item.id?.toString() || index.toString()}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 10, paddingTop: 10 }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Product', { 
                productId: item.handle || item._id,
                product: item 
              })}
            >
              <Image 
                source={{ 
                  uri: item.images?.[0]?.url || item.image || 'https://via.placeholder.com/150' 
                }} 
                style={styles.image} 
              />
              {item.totalQuantity === 0 && (
                <View style={styles.soldOutBadge}>
                  <Text style={styles.soldOutText}>Sold Out</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.wishlistIcon}
              onPress={() => toggleWishlist(item)}
            >
              <Image
                source={{
                  uri: wishlist.includes(item._id || item.id)
                    ? "https://cdn-icons-png.flaticon.com/128/833/833472.png"
                    : "https://cdn-icons-png.flaticon.com/128/1077/1077035.png",
                }}
                style={{ width: 12, height: 12 }}
              />
            </TouchableOpacity>

            <Text style={styles.title} numberOfLines={1}>
              {item.title || 'Product'}
            </Text>
            <Text style={styles.brand}>{item.brand || 'Brand'}</Text>
            <Text style={styles.price}>₹ {item.price || 0}</Text>
          </View>
        )}
      />

      {/* Loading Overlay */}
      {loading && products.length > 0 && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#111" />
            <Text style={styles.loadingOverlayText}>Updating results...</Text>
          </View>
        </View>
      )}

      {/* Sticky Bottom Bar - Filter and Sort */}
      <View style={styles.stickyBottomBar}>
        <View style={styles.bottomBarContent}>
          {/* Sort Dropdown */}
          <View style={styles.bottomGridItem}>
            <TouchableOpacity
              style={styles.bottomBtn}
              onPress={() => setSortDropdownVisible(!sortDropdownVisible)}
            >
              <Image
                source={{
                  uri: "https://cdn-icons-png.flaticon.com/128/1828/1828911.png",
                }}
                style={styles.bottomBtnIcon}
              />
              <Text style={styles.bottomBtnText}>Sort</Text>
            </TouchableOpacity>

            {sortDropdownVisible && (
              <View style={styles.bottomDropdownList}>
                <ScrollView>
                  {sortOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.dropdownItem,
                        sortType === option.value && styles.activeDropdownItem
                      ]}
                      onPress={() => handleSortSelect(option.value)}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        sortType === option.value && styles.activeDropdownItemText
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Filter Button */}
          <View style={styles.bottomGridItem}>
            <TouchableOpacity
              onPress={openFilters}
              style={styles.bottomBtn}
            >
              <Image
                source={{
                  uri: "https://cdn-icons-png.flaticon.com/128/11741/11741061.png",
                }}
                style={styles.bottomBtnIcon}
              />
              <Text style={styles.bottomBtnText}>Filter</Text>
              {(selectedFilters.color || selectedFilters.size || selectedFilters.brand) && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>
                    {[selectedFilters.color, selectedFilters.size, selectedFilters.brand].filter(Boolean).length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Filter Modal */}
      <Modal 
        visible={filtersVisible} 
        animationType="slide"
        onRequestClose={closeFilters}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={closeFilters}>
              <Image
                source={{
                  uri: "https://cdn-icons-png.flaticon.com/128/1828/1828778.png",
                }}
                style={{ width: 28, height: 28 }}
              />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Color */}
            {availableFilters.colors.length > 0 && (
              <>
                <Text style={styles.filterLabel}>Color</Text>
                <View style={styles.optionRow}>
                  {availableFilters.colors.map((color, index) => (
                    <TouchableOpacity
                      key={`${color}-${index}`}
                      style={[
                        styles.filterOption,
                        tempFilters.color === color && styles.selectedOption,
                      ]}
                      onPress={() =>
                        setTempFilters((prev) => ({
                          ...prev,
                          color: prev.color === color ? null : color,
                        }))
                      }
                    >
                      <Text style={tempFilters.color === color && styles.selectedText}>
                        {color}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Size */}
            {availableFilters.sizes.length > 0 && (
              <>
                <Text style={styles.filterLabel}>Size</Text>
                <View style={styles.optionRow}>
                  {availableFilters.sizes.map((size, index) => (
                    <TouchableOpacity
                      key={`${size}-${index}`}
                      style={[
                        styles.filterOption,
                        tempFilters.size === size && styles.selectedOption,
                      ]}
                      onPress={() =>
                        setTempFilters((prev) => ({
                          ...prev,
                          size: prev.size === size ? null : size,
                        }))
                      }
                    >
                      <Text style={tempFilters.size === size && styles.selectedText}>
                        {size}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Brand */}
            {availableFilters.brands.length > 0 && (
              <>
                <Text style={styles.filterLabel}>Brand</Text>
                <View style={styles.optionRow}>
                  {availableFilters.brands.map((brand, index) => (
                    <TouchableOpacity
                      key={`${brand}-${index}`}
                      style={[
                        styles.filterOption,
                        tempFilters.brand === brand && styles.selectedOption,
                      ]}
                      onPress={() =>
                        setTempFilters((prev) => ({
                          ...prev,
                          brand: prev.brand === brand ? null : brand,
                        }))
                      }
                    >
                      <Text style={tempFilters.brand === brand && styles.selectedText}>
                        {brand}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={clearFilters}
            >
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyBtn}
              onPress={applyFilters}
            >
              <Text style={styles.applyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fb"},
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 14,
  },
  searchButton: {
    marginLeft: 10,
    backgroundColor: '#111',
    padding: 10,
    borderRadius: 25,
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
  },
  resultsHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultsText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  card: {
    backgroundColor: "#fff",
    width: "48%",
    borderRadius: 8,
    marginBottom: 15,
    padding: 5,
  },
  image: { width: "100%", aspectRatio: 1/1, borderRadius: 5 },
  soldOutBadge: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -40 }, { translateY: -15 }],
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  soldOutText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  wishlistIcon: {
    position: "absolute",
    right: 10,
    top: 10,
    backgroundColor: "#fff",
    padding: 5,
    borderRadius: 20,
    elevation: 3,
  },
  title: { fontWeight: "600", fontSize: 12, color: "#333", marginTop: 8 },
  brand: { fontSize: 12, color: "#555", marginTop: 5 },
  price: {
    fontWeight: "bold",
    fontSize: 15,
    color: "#111",
    marginVertical: 8,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  loadingBox: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    elevation: 5,
  },
  loadingOverlayText: {
    marginTop: 12,
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  stickyBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#111",
    paddingVertical: 3,
    paddingHorizontal: 15,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bottomBarContent: {
    flexDirection: "row",
    gap: 10,
  },
  bottomGridItem: {
    flex: 1,
  },
  bottomBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    paddingVertical: 10,
    position: "relative",
  },
  bottomBtnIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
    tintColor: "#fff",
  },
  bottomBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  filterBadge: {
    position: "absolute",
    top: 4,
    right: "30%",
    backgroundColor: "#ff4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  filterBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  bottomDropdownList: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 5,
    zIndex: 99,
    maxHeight: 250,
  },
  dropdownItem: { 
    padding: 14, 
    borderBottomWidth: 0.5, 
    borderColor: "#ddd" 
  },
  activeDropdownItem: {
    backgroundColor: "#f0f0f0",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#333",
  },
  activeDropdownItemText: {
    fontWeight: "bold",
    color: "#111",
  },
  modalContainer: { flex: 1, backgroundColor: "#fff", padding: 20 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: { fontSize: 22, fontWeight: "bold" },
  filterLabel: { 
    fontWeight: "600", 
    marginTop: 20, 
    marginBottom: 10,
    fontSize: 16,
    color: "#111",
  },
  optionRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 5 },
  filterOption: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    margin: 5,
    backgroundColor: "#fff",
  },
  selectedOption: { 
    backgroundColor: "#111", 
    borderColor: "#111",
  },
  selectedText: {
    color: "#fff",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  clearBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#111",
    padding: 14,
    borderRadius: 8,
  },
  clearText: { 
    color: "#111", 
    textAlign: "center", 
    fontWeight: "bold",
    fontSize: 15,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: "#111",
    padding: 14,
    borderRadius: 8,
  },
  applyText: { 
    color: "#fff", 
    textAlign: "center", 
    fontWeight: "bold",
    fontSize: 15,
  },
});

export default Search;