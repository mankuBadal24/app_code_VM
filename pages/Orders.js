import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import Header from "../components/Header";
import AsyncStorage from '@react-native-async-storage/async-storage';

const MyOrders = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadUserData = async () => {
    try {
      setLoading(true);
      const userToken = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');

      if (!userToken || !userData) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }

      const parsedUser = JSON.parse(userData);
      // Fetch orders
      await fetchOrders(userToken, parsedUser.mobile);
      // Fetch payment methods
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (token, mobile) => {
    try {
      const response = await fetch(
        `https://voguemine.com/api/app/cart/get-orders?mobile=${mobile}&token=${token}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };
  useEffect(() => {
    loadUserData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
    });
    return unsubscribe;
  }, [navigation]);


  const renderOrder = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("OrderDetails", { orderId: item._id })}
    >
      <View style={styles.row}>
        <Text style={styles.orderNumber}>{item.orderNumber}</Text>
        <Text style={[styles.status, item.orderStatus === "Delivered" ? styles.delivered : styles.pending]}>
          {item.orderStatus}
        </Text>
      </View>
      <Text style={styles.text}>Items: {item.orderItems.length}</Text>
      <Text style={styles.text}>Total: ₹{item.finalAmount}</Text>
      <View style={styles.viewMore}>
        <Text style={styles.viewText}>View Details</Text>
        {/* <MaterialIcons name="arrow-forward-ios" size={16} color="#fff" /> */}
      </View>
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <View>
      <Header navigation={navigation} currentPage="Orders" />

      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={renderOrder}
        contentContainerStyle={{ padding: 15 }}
        ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 50 }}>No orders found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 15,
    borderRadius: 15,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  orderNumber: { fontWeight: "bold", fontSize: 18 },
  status: { fontWeight: "bold", fontSize: 14, paddingVertical: 2, paddingHorizontal: 10, borderRadius: 20, color: "#fff" },
  delivered: { backgroundColor: "#4CAF50" },
  pending: { backgroundColor: "#FFC107" },
  text: { fontSize: 16, color: "#333", marginBottom: 5 },
  viewMore: {
    flexDirection: "row",
    backgroundColor: "#000",
    padding: 10,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  viewText: { color: "#fff", marginRight: 5 },
});

export default MyOrders;
