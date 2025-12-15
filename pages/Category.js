import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 90) / 3;

const CollectionsScreen = ({ navigation, activeNavIndex, setActiveNavIndex }) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllCollections();
  }, []);

  const fetchAllCollections = async () => {
    try {
      setLoading(true);
      const categories = [
        { key: 'men', title: "Men's Collections", bgColor: '#3b82f6' },
        { key: 'women', title: "Women's Collections", bgColor: '#ec4899' },
        { key: 'kids', title: "Kids Collections", bgColor: '#f59e0b' },
        { key: 'accessories', title: 'Accessories', bgColor: '#8b5cf6' },
      ];

      const fetchPromises = categories.map(async (category) => {
        const response = await fetch(
          `https://voguemine.com/api/collection/fetch-collection?category=${category.key}`
        );
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          return {
            id: category.key,
            title: category.title,
            bgColor: category.bgColor,
            collections: data.data.map((item) => ({
              id: item._id,
              handle: item.handle || item._id,
              name: item.title || item.category,
              image: item.images?.[0]?.url || item.image || 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400',
              category: item.category,
              isTrending: item.isTrending === "true",
            })),
          };
        }
        return null;
      });

      const results = await Promise.all(fetchPromises);
      const validSections = results.filter((section) => section !== null && section.collections.length > 0);
      setSections(validSections);
      setError(null);
    } catch (err) {
      console.error('Error fetching collections:', err);
      setError('Failed to load collections. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header navigation={navigation} currentPage="Categories"/>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading Collections...</Text>
        </View>
        <BottomNav
          navigation={navigation}
          activeNavIndex={activeNavIndex}
          setActiveNavIndex={setActiveNavIndex}
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header navigation={navigation} currentPage="Categories"/>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAllCollections}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
        <BottomNav
          navigation={navigation}
          activeNavIndex={activeNavIndex}
          setActiveNavIndex={setActiveNavIndex}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header navigation={navigation} currentPage="Categories"/>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {sections.map((section) => (
          <CollectionSection key={section.id} section={section} navigation={navigation} />
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>

      <BottomNav
        navigation={navigation}
        activeNavIndex={activeNavIndex}
        setActiveNavIndex={setActiveNavIndex}
      />
    </View>
  );
};

const CollectionSection = ({ section, navigation }) => {
  const scrollX = useRef(new Animated.Value(0)).current;

  if (!section.collections || section.collections.length === 0) {
    return null;
  }

  const halfLength = Math.ceil(section.collections.length / 2);
  const topCollections = section.collections.slice(0, halfLength);
  const bottomCollections = section.collections.slice(halfLength);
  const totalDots = Math.max(0, topCollections.length - 2);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIndicator, { backgroundColor: section.bgColor }]} />
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>

      {/* Top Row */}
      {topCollections.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH}
          snapToAlignment="start"
          contentContainerStyle={styles.scrollContent}
        >
          {topCollections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              bgColor={section.bgColor}
              navigation={navigation}
            />
          ))}
        </ScrollView>
      )}

      {/* Bottom Row */}
      {bottomCollections.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH}
          snapToAlignment="start"
          contentContainerStyle={styles.scrollContent}
        >
          {bottomCollections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              bgColor={section.bgColor}
              navigation={navigation}
            />
          ))}
        </ScrollView>
      )}

      {/* Pagination Dots */}
      {totalDots > 0 && (
        <View style={styles.paginationContainer}>
          {Array.from({ length: totalDots }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                { backgroundColor: index === 0 ? section.bgColor : '#d1d5db' },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const CollectionCard = ({ collection, bgColor, navigation }) => {
  const handlePress = () => {
    // Pass the collection with handle for API call
    navigation.navigate('Products', { 
      collection: {
        ...collection,
        handle: collection.handle || collection.id,
      }
    });
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={handlePress}
    >
      <View style={[styles.cardBg, { backgroundColor: bgColor + '15' }]}>
        {collection.isTrending && (
            <View style={styles.trendingBadge}>
              <Text style={styles.trendingText}>TRENDING</Text>
            </View>
          )}
        <View style={styles.imageContainer}>
          <Image source={{ uri: collection.image }} style={styles.cardImage} />
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {collection.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollView: { flex: 1 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: { marginTop: 10, marginBottom: 10 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionIndicator: { width: 4, height: 20, borderRadius: 2, marginRight: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 8 },
  card: { width: CARD_WIDTH, marginRight: 12 },
  cardBg: { borderRadius: 16, padding: 12, alignItems: 'center' },
  imageContainer: {
    width: CARD_WIDTH - 5,
    height: CARD_WIDTH - 5,
    borderRadius: (CARD_WIDTH - 5) / 2,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  cardImage: { width: '100%', height: '100%' },
  cardTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    lineHeight: 14,
    minHeight: 28,
  },
  trendingBadge: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: '#ff4444',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 10,
  },
  trendingText: {
    color: '#fff',
    fontSize: 5,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d1d5db',
  },
});

export default CollectionsScreen;