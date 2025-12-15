import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  Animated,
  ScrollView,
} from "react-native";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
// import { AntDesign, Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const BANNER_HEIGHT = Math.round(width * 0.56); // nice aspect ratio

// Replace these ) calls with the actual files you add to /assets
const BANNERS = [
  "https://res.cloudinary.com/dqh6bd766/image/upload/c_limit,h_1000,f_auto,q_50/v1734679687/gdtdt8dbugz7urb6dsz0.jpg",
  "https://res.cloudinary.com/dqh6bd766/image/upload/c_limit,h_1000,f_auto,q_50/v1734679687/gdtdt8dbugz7urb6dsz0.jpg",
  "https://res.cloudinary.com/dqh6bd766/image/upload/c_limit,h_1000,f_auto,q_50/v1734679687/gdtdt8dbugz7urb6dsz0.jpg",
  "https://res.cloudinary.com/dqh6bd766/image/upload/c_limit,h_1000,f_auto,q_50/v1734679687/gdtdt8dbugz7urb6dsz0.jpg",
];

const STORY_CATEGORIES = [
  { id: "1", title: "Fresh Fits", img: "https://res.cloudinary.com/dqh6bd766/image/upload/c_limit,h_1000,f_auto,q_50/v1734679687/gdtdt8dbugz7urb6dsz0.jpg" },
  { id: "2", title: "Women", img: "https://res.cloudinary.com/dqh6bd766/image/upload/c_limit,h_1000,f_auto,q_50/v1734679687/gdtdt8dbugz7urb6dsz0.jpg" },
  { id: "3", title: "Men", img: "https://res.cloudinary.com/dqh6bd766/image/upload/c_limit,h_1000,f_auto,q_50/v1734679687/gdtdt8dbugz7urb6dsz0.jpg" },
  { id: "4", title: "Trending", img: "https://res.cloudinary.com/dqh6bd766/image/upload/c_limit,h_1000,f_auto,q_50/v1734679687/gdtdt8dbugz7urb6dsz0.jpg" },
  { id: "5", title: "New", img: "https://res.cloudinary.com/dqh6bd766/image/upload/c_limit,h_1000,f_auto,q_50/v1734679687/gdtdt8dbugz7urb6dsz0.jpg" },
];

const HORIZONTAL_CATEGORIES = [
  { id: "c1", title: "CASUAL", img: "https://res.cloudinary.com/dqh6bd766/image/upload/c_limit,h_1000,f_auto,q_50/v1734679687/gdtdt8dbugz7urb6dsz0.jpg" },
  { id: "c2", title: "ACTIVE", img: "https://res.cloudinary.com/dqh6bd766/image/upload/c_limit,h_1000,f_auto,q_50/v1734679687/gdtdt8dbugz7urb6dsz0.jpg" },
  { id: "c3", title: "BOLD", img: "https://res.cloudinary.com/dqh6bd766/image/upload/c_limit,h_1000,f_auto,q_50/v1734679687/gdtdt8dbugz7urb6dsz0.jpg" },
  { id: "c4", title: "STREET", img: "https://res.cloudinary.com/dqh6bd766/image/upload/c_limit,h_1000,f_auto,q_50/v1734679687/gdtdt8dbugz7urb6dsz0.jpg" },
  { id: "c5", title: "PARTY", img: "https://res.cloudinary.com/dqh6bd766/image/upload/c_limit,h_1000,f_auto,q_50/v1734679687/gdtdt8dbugz7urb6dsz0.jpg" },
];

const ICON_CATEGORIES = [
  { id: "i1", title: "New Arrival", img: "https://res.cloudinary.com/dqh6bd766/image/upload/c_limit,h_1000,f_auto,q_50/v1734679687/gdtdt8dbugz7urb6dsz0.jpg" },
  { id: "i2", title: "Jewellery", img: "https://res.cloudinary.com/dqh6bd766/image/upload/c_limit,h_1000,f_auto,q_50/v1734679687/gdtdt8dbugz7urb6dsz0.jpg" },
  { id: "i3", title: "Dresses", img: "https://res.cloudinary.com/dqh6bd766/image/upload/c_limit,h_1000,f_auto,q_50/v1734679687/gdtdt8dbugz7urb6dsz0.jpg" },
  { id: "i4", title: "Tops", img: "https://res.cloudinary.com/dqh6bd766/image/upload/c_limit,h_1000,f_auto,q_50/v1734679687/gdtdt8dbugz7urb6dsz0.jpg" },
  { id: "i5", title: "Jeans", img: "https://res.cloudinary.com/dqh6bd766/image/upload/c_limit,h_1000,f_auto,q_50/v1734679687/gdtdt8dbugz7urb6dsz0.jpg" },
  { id: "i6", title: "Shoes", img: "https://res.cloudinary.com/dqh6bd766/image/upload/c_limit,h_1000,f_auto,q_50/v1734679687/gdtdt8dbugz7urb6dsz0.jpg" },
];

export default function CategoryScreen({ navigation, activeNavIndex, setActiveNavIndex }) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const bannerRef = useRef(null);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [activeStory, setActiveStory] = useState(1);
  const [bagCount, setBagCount] = useState(2);

  useEffect(() => {
    // auto-scroll banners every 4 sec
    const id = setInterval(() => {
      const next = (bannerIndex + 1) % BANNERS.length;
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


  const renderStories = () => (
    <View>
      <FlatList
        data={STORY_CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storyList}
        keyExtractor={(i) => i.id}
        renderItem={({ item, index }) => {
          const isActive = activeStory === index;
          return (
            <TouchableOpacity
              onPress={() => setActiveStory(index)}
              style={styles.storyItem}
              activeOpacity={0.8}
            >
              <Image source={{uri: item.img}} style={styles.storyImg} />
              <Text style={[styles.storyText, isActive && styles.storyTextActive]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
      {/* subtle underline indicator */}
      <View style={styles.storyIndicatorRow}>
        <View style={[styles.underline, { left: (activeStory * 84) + 20 }]} />
      </View>
    </View>
  );

  const renderBanner = () => (
    <View style={styles.bannerContainer}>
      <Animated.FlatList
        ref={bannerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        data={BANNERS}
        keyExtractor={(_, i) => i.toString()}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.9}>
            <Image source={{uri: item}} style={styles.bannerImage} resizeMode="cover" />
          </TouchableOpacity>
        )}
      />
      <View style={styles.dots}>
        {BANNERS.map((_, i) => {
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

  const renderHorizontalCategories = () => (
    <View style={{ marginTop: 12 }}>
      <FlatList
        data={HORIZONTAL_CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.9} style={styles.hCard}>
            <Image source={{uri: item.img}} style={styles.hImage} />
            <View style={styles.hOverlay} />
            <Text style={styles.hLabel}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderIconCategories = () => (
    <View style={styles.iconGrid}>
      {ICON_CATEGORIES.map((it) => (
        <TouchableOpacity key={it.id} style={styles.iconItem} activeOpacity={0.8}>
          <View style={styles.iconCircle}>
            <Image source={{uri: it.img}} style={styles.iconImg} resizeMode="contain" />
          </View>
          <Text style={styles.iconText} numberOfLines={1}>
            {it.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Header navigation={navigation} currentPage="New"/>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
        {renderStories()}
        {renderBanner()}
        {renderHorizontalCategories()}
        {renderIconCategories()}
        {/* You can add more sections here */}
      </ScrollView>

      <BottomNav navigation={navigation} activeNavIndex={activeNavIndex} setActiveNavIndex={setActiveNavIndex}/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topBar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  iconBtn: {
    padding: 8,
    marginRight: 6,
  },
  cartBtn: {
    padding: 8,
    marginLeft: 6,
    position: "relative",
  },
  badge: {
    position: "absolute",
    right: 2,
    top: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  brand: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 4,
  },

  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  // STORIES
  storyList: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  storyItem: {
    width: 72,
    marginHorizontal: 6,
    alignItems: "center",
  },
  storyImg: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: "#fff",
    elevation: 3,
  },
  storyText: {
    marginTop: 6,
    fontSize: 12,
    color: "#666",
  },
  storyTextActive: { color: "#000", fontWeight: "700" },
  storyIndicatorRow: { height: 6 },
  underline: {
    position: "absolute",
    bottom: 0,
    width: 48,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#000",
  },

  // BANNER
  bannerContainer: {
    marginTop: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerImage: {
    width: width,
    height: BANNER_HEIGHT,
  },
  dots: {
    position: "absolute",
    bottom: 12,
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

  // HORIZONTAL CATEGORY CARDS
  hCard: {
    width: 140,
    height: 160,
    marginRight: 12,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#eee",
  },
  hImage: {
    width: "100%",
    height: "100%",
  },
  hOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  hLabel: {
    position: "absolute",
    left: 10,
    bottom: 12,
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 1,
  },

  // ICON GRID
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 18,
    paddingHorizontal: 12,
    justifyContent: "space-between",
  },
  iconItem: {
    width: (width - 48) / 3,
    alignItems: "center",
    marginBottom: 20,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fff",
    elevation: 6,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  iconImg: {
    width: 48,
    height: 48,
  },
  iconText: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 12,
    color: "#333",
  },

  // BOTTOM TABS
  bottomTabs: {
    height: 64,
    backgroundColor: "#fff",
    flexDirection: "row",
    borderTopWidth: 0.8,
    borderTopColor: "#eee",
    alignItems: "center",
    justifyContent: "space-around",
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabItem: { alignItems: "center", justifyContent: "center", width: 64 },
  tabItemActive: {
    alignItems: "center",
    justifyContent: "center",
    width: 64,
    // slight elevated pill
    backgroundColor: "#fff",
    borderRadius: 22,
    marginTop: -8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
  },
  tabText: { fontSize: 11, color: "#333", marginTop: 2 },
  tabTextActive: { fontSize: 11, color: "#111", marginTop: 2, fontWeight: "700" },
  tabSmallBadge: {
    position: "absolute",
    right: 10,
    top: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  tabSmallBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
});
