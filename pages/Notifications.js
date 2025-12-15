import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from "../components/Header";

const Notifications = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Default notifications
  const defaultNotifications = [
    {
      _id: 'default-1',
      title: '🎉 Welcome to VogueMine!',
      message: 'Thank you for joining us! Explore our latest collection and enjoy exclusive offers.',
      createdAt: new Date().toISOString(),
      isRead: false,
      type: 'welcome'
    },
    {
      _id: 'default-2',
      title: '🔥 Flash Sale Alert!',
      message: 'Get up to 50% off on selected items. Limited time offer. Shop now!',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      isRead: false,
      type: 'promotion'
    },
    {
      _id: 'default-3',
      title: '📦 Track Your Orders',
      message: 'You can now track all your orders in real-time from the Orders section.',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      isRead: false,
      type: 'info'
    },
    {
      _id: 'default-4',
      title: '💳 New Payment Methods',
      message: 'We now support UPI, Cards, and Net Banking. Add your preferred payment method!',
      createdAt: new Date(Date.now() - 10800000).toISOString(),
      isRead: false,
      type: 'update'
    },
    {
      _id: 'default-5',
      title: '⭐ Rate Your Experience',
      message: 'Love shopping with us? Rate your recent purchases and help others discover great products!',
      createdAt: new Date(Date.now() - 14400000).toISOString(),
      isRead: false,
      type: 'feedback'
    }
  ];

  const loadUserData = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');

      if (!userToken || !userData) {
        navigation?.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return null;
      }

      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // If no notifications exist, set default ones
      const userNotifications = parsedUser.notifications || defaultNotifications;
      setNotifications(userNotifications);
      
      return parsedUser;
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load notifications');
      return null;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadUserData();
  };

  const updateNotificationsInBackend = async (updatedNotifications) => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      
      if (!userToken) {
        Alert.alert('Error', 'User token not found. Please login again.');
        return false;
      }

      // Update local storage
      const updatedUserData = { ...user, notifications: updatedNotifications };
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
      setUser(updatedUserData);
      setNotifications(updatedNotifications);

      // Update backend
      const response = await fetch(
        `https://voguemine.com/api/app/cart/update-notifications?mobile=${user.mobile}&token=${userToken}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify(updatedNotifications)
        }
      );

      if (!response.ok) {
        console.error('Failed to update notifications on server');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating notifications:', error);
      return false;
    }
  };

  const handleReadNotification = async (notification) => {
    // Mark as read and auto-delete
    const updatedNotifications = notifications.filter(n => n._id !== notification._id);
    
    const success = await updateNotificationsInBackend(updatedNotifications);
    
    if (!success) {
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            const success = await updateNotificationsInBackend([]);
            if (success) {
              Alert.alert('Success', 'All notifications cleared');
            } else {
              Alert.alert('Error', 'Failed to clear notifications');
            }
          }
        }
      ]
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'welcome':
        return '🎉';
      case 'promotion':
        return '🔥';
      case 'info':
        return '📦';
      case 'update':
        return '💳';
      case 'feedback':
        return '⭐';
      case 'order':
        return '🛍️';
      case 'delivery':
        return '🚚';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'welcome':
        return '#10b981';
      case 'promotion':
        return '#ef4444';
      case 'info':
        return '#3b82f6';
      case 'update':
        return '#8b5cf6';
      case 'feedback':
        return '#f59e0b';
      case 'order':
        return '#ec4899';
      case 'delivery':
        return '#14b8a6';
      default:
        return '#6b7280';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleReadNotification(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.type) + '20' }]}>
          <Text style={styles.icon}>{getNotificationIcon(item.type)}</Text>
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.date}>{formatTime(item.createdAt)}</Text>
        </View>

        <View style={styles.readIndicator}>
          <View style={[styles.dot, !item.isRead && styles.dotUnread]} />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header navigation={navigation} currentPage="Notifications"/>
      {notifications.length > 0 && (
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>
            {notifications.length} {notifications.length === 1 ? 'Notification' : 'Notifications'}
          </Text>
          <TouchableOpacity onPress={handleDeleteAll}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#000']}
            tintColor="#000"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubtext}>
              You're all caught up! New notifications will appear here.
            </Text>
          </View>
        }
      />
    </View>
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
    backgroundColor: '#F8F8F8',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 15,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    lineHeight: 20,
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 18,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  readIndicator: {
    marginTop: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0E0E0',
  },
  dotUnread: {
    backgroundColor: '#3b82f6',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default Notifications;