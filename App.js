import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  useColorScheme,
  StyleSheet
} from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Home from './pages/Home';
import VideoHome from './pages/VideoHome';
import Category from './pages/Category';
import Cart from './pages/Cart'
import Product from './pages/Product';
import Checkout from './pages/Checkout';
import Products from './pages/Products';
import Wishlist from './pages/Wishlist';
import ProfileScreen from './pages/Profile';
import MyOrders from './pages/Orders';
import Addresses from './pages/Addresses';
import PaymentMethods from './pages/PaymentMethods';
import Notifications from './pages/Notifications';
import HelpSupport from './pages/Support';
import About from './pages/About';
import CategoryScreen from './pages/CategorySection';
import Search from './pages/Search';

const Stack = createNativeStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [activeNavIndex, setActiveNavIndex] = useState(0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} >
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={'white'} />
      <NavigationContainer style={styles.mainContainer}>
        <Stack.Navigator initialRouteName="VideoHome">
          <Stack.Screen name="VideoHome" component={VideoHome} options={{ headerShown: false }} />
          <Stack.Screen
            name="Home"
            children={(props) => (
              <Home
                {...props} // <-- This passes navigation and other screen props!
                activeNavIndex={activeNavIndex}
                setActiveNavIndex={setActiveNavIndex}
              />
            )}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Category"
            children={(props) => (
              <Category
                {...props}
                activeNavIndex={activeNavIndex}
                setActiveNavIndex={setActiveNavIndex}
              />
            )}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Product"
            children={(props) => (
              <Product
                {...props}
                activeNavIndex={activeNavIndex}
                setActiveNavIndex={setActiveNavIndex}
              />
            )}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Checkout"
            children={(props) => (
              <Checkout
                {...props}
                activeNavIndex={activeNavIndex}
                setActiveNavIndex={setActiveNavIndex}
              />
            )}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Cart"
            children={(props) => (
              <Cart
                {...props}
                activeNavIndex={activeNavIndex}
                setActiveNavIndex={setActiveNavIndex}
              />
            )}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Wishlist"
            children={(props) => (
              <Wishlist
                {...props}
                activeNavIndex={activeNavIndex}
                setActiveNavIndex={setActiveNavIndex}
              />
            )}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Products"
            children={(props) => (
              <Products
                {...props}
                activeNavIndex={activeNavIndex}
                setActiveNavIndex={setActiveNavIndex}
              />
            )}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Search"
            children={(props) => (
              <Search
                {...props}
                activeNavIndex={activeNavIndex}
                setActiveNavIndex={setActiveNavIndex}
              />
            )}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Profile"
            children={(props) => (
              <ProfileScreen
                {...props}
                activeNavIndex={activeNavIndex}
                setActiveNavIndex={setActiveNavIndex}
              />
            )}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Orders"
            children={(props) => (
              <MyOrders
                {...props}
                activeNavIndex={activeNavIndex}
                setActiveNavIndex={setActiveNavIndex}
              />
            )}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Addresses"
            children={(props) => (
              <Addresses
                {...props}
                activeNavIndex={activeNavIndex}
                setActiveNavIndex={setActiveNavIndex}
              />
            )}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PaymentMethods"
            children={(props) => (
              <PaymentMethods
                {...props}
                activeNavIndex={activeNavIndex}
                setActiveNavIndex={setActiveNavIndex}
              />
            )}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Notifications"
            children={(props) => (
              <Notifications
                {...props}
                activeNavIndex={activeNavIndex}
                setActiveNavIndex={setActiveNavIndex}
              />
            )}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Support"
            children={(props) => (
              <HelpSupport
                {...props}
                activeNavIndex={activeNavIndex}
                setActiveNavIndex={setActiveNavIndex}
              />
            )}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="About"
            children={(props) => (
              <About
                {...props}
                activeNavIndex={activeNavIndex}
                setActiveNavIndex={setActiveNavIndex}
              />
            )}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="New"
            children={(props) => (
              <CategoryScreen
                {...props}
                activeNavIndex={activeNavIndex}
                setActiveNavIndex={setActiveNavIndex}
              />
            )}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  mainContainer: {
    fontFamily: 'Montserrat',
  }
})

export default App;
