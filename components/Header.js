import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  Dimensions,
  TouchableOpacity,
  Animated,
  Keyboard,
} from 'react-native';

const { width } = Dimensions.get('window');

const Header = ({ navigation, route, currentPage }) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchAnim] = useState(new Animated.Value(0));

  const toggleSearch = () => {
    const toValue = showSearch ? 0 : 1;
    Animated.timing(searchAnim, {
      toValue,
      duration: 250,
      useNativeDriver: false,
    }).start();
    setShowSearch(!showSearch);
    
    // Clear search when closing
    if (showSearch) {
      setSearchQuery('');
    }
  };

  const handleSearch = () => {
    toggleSearch()
    if (searchQuery.trim()) {
      Keyboard.dismiss();
      // Navigate to search/products page with search query
      navigation.navigate('Search', {
        searchValue: searchQuery.trim()
      });
      // Keep search bar open with the query
      // Or optionally close it:
      // toggleSearch();
      // setSearchQuery('');
    }
  };

  const searchBarHeight = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 45],
  });

  const isHome = currentPage === 'Home';

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        {/* Left Section */}
        {isHome ? (
          // Home page → Notification Icon
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => navigation.navigate('Notifications')}
          >
            <Image
              style={styles.icon}
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/128/2097/2097743.png',
              }}
            />
          </TouchableOpacity>
        ) : (
          // Other Pages → Back button + Page Name
          <View style={styles.leftSection}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.goBack()}
            >
              <Image
                style={styles.icon}
                source={{
                  uri: 'https://cdn-icons-png.flaticon.com/128/271/271220.png',
                }}
                width={18} 
                height={18}
              />
            </TouchableOpacity>

            <Text
              style={styles.pageTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {currentPage}
            </Text>
          </View>
        )}

        {/* Center Section */}
        {isHome && (
          <Image
            style={styles.logo}
            source={{
              uri: 'https://voguemine.com/_next/static/media/vlogo.28405d81.png',
            }}
          />
        )}

        {/* Right Section */}
        <View style={styles.rightIcons}>
          <TouchableOpacity style={styles.iconButton} onPress={toggleSearch}>
            <Image
              style={[styles.icon, showSearch && styles.iconActive]}
              source={{
                uri: showSearch 
                  ? 'https://cdn-icons-png.flaticon.com/128/1828/1828778.png' 
                  : 'https://cdn-icons-png.flaticon.com/128/54/54481.png',
              }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, { marginLeft: 6 }]}
            onPress={() => navigation.navigate('Cart')}
          >
            <Image
              style={styles.icon}
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/128/1170/1170678.png',
              }}
            />
            <View style={styles.cartBadge}></View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Animated Search Bar */}
      <Animated.View style={[styles.searchBarContainer, { height: searchBarHeight }]}>
        <View style={styles.searchBar}>
          <Image
            style={styles.searchIcon}
            source={{
              uri: 'https://cdn-icons-png.flaticon.com/128/54/54481.png',
            }}
          />
          <TextInput
            placeholder="Search for products..."
            style={styles.searchInput}
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus={showSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Image
                style={styles.clearIcon}
                source={{
                  uri: 'https://cdn-icons-png.flaticon.com/128/1828/1828778.png',
                }}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={!searchQuery.trim()}
          >
            <Text style={[
              styles.searchButtonText,
              !searchQuery.trim() && styles.searchButtonTextDisabled
            ]}>
              Search
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    width,
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingTop: 5,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    padding: 4,
  },
  icon: {
    width: 22,
    height: 22,
    tintColor: '#222',
  },
  iconActive: {
    tintColor: '#111',
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 45,
    resizeMode: 'contain',
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'red',
    borderRadius: 6,
    width: 6,
    height: 6,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    marginLeft: 8,
    maxWidth: width * 0.6,
  },
  searchBarContainer: {
    overflow: 'hidden',
    marginTop: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 25,
    paddingHorizontal: 12,
    height: 45,
  },
  searchIcon: {
    width: 18,
    height: 18,
    tintColor: '#777',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginRight: 4,
  },
  clearIcon: {
    width: 14,
    height: 14,
    tintColor: '#999',
  },
  searchButton: {
    backgroundColor: '#111',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchButtonTextDisabled: {
    opacity: 0.5,
  },
});

export default Header;