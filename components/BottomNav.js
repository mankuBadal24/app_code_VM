import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
const BottomNav = ({navigation, activeNavIndex, setActiveNavIndex}) => {
const [isLoading, setIsLoading] = useState(false);
    
  const bottomNavItems = [
    { icon: 'https://cdn-icons-png.flaticon.com/128/1946/1946436.png', label: 'Home' },
    { icon: 'https://cdn-icons-png.flaticon.com/128/561/561184.png', label: 'Categories' },
    { icon: 'https://cdn-icons-png.flaticon.com/128/3775/3775383.png', label: 'New' },
    { icon: 'https://cdn-icons-png.flaticon.com/128/833/833472.png', label: 'Wishlist' },
    { icon: 'https://cdn-icons-png.flaticon.com/128/1077/1077114.png', label: 'Profile' },
  ];

  const goToCategory = (index) => {
    setActiveNavIndex(index);
    setIsLoading(true);
    switch (index) {
      case 0: navigation.navigate('Home'); break;
      case 1: navigation.navigate('Category'); break;
      case 2: navigation.navigate('New'); break;
      case 3: navigation.navigate('Wishlist'); break;
      case 4: navigation.navigate('Profile'); break;
      default: navigation.navigate('Home');
    }
    setTimeout(() => setIsLoading(false), 1000);
  };
  return (
        <View style={styles.bottomNav}>
          {bottomNavItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.bottomNavItem}
              onPress={() => goToCategory(index)}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: item.icon }}
                style={[
                  styles.bottomNavIcon,
                  activeNavIndex === index && styles.bottomNavIconActive,
                ]}
              />
              <Text
                style={[
                  styles.bottomNavLabel,
                  activeNavIndex === index && styles.bottomNavLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
  )
}

const styles = StyleSheet.create({
    bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    backgroundColor: '#fff',
  },
  bottomNavItem: {
    alignItems: 'center',
    flex: 1,
  },
  bottomNavIcon: {
    width: 18,
    height: 18,
    tintColor: '#a0a0a0ff',
    marginBottom: 2,
  },
  bottomNavIconActive: {
    tintColor: '#000',
  },
  bottomNavLabel: {
    fontSize: 9,
    color: '#999',
  },
  bottomNavLabelActive: {
    fontWeight: '700',
    color: '#000',
  },
});
export default BottomNav