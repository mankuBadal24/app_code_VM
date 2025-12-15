import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, StatusBar, ActivityIndicator } from 'react-native';

const { width, height } = Dimensions.get('window');


const VideoHome = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
const [banners, setBanners] = useState([]);
const [isLoading, setIsLoading] = useState(true);
useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await fetch('https://voguemine.com/api/banner/get-banners?id=677bc6e15dab1ba1f11b74a1');
      const dataBaners = await response.json();
      const data = dataBaners.banners || [];
      
      // Create screens array with splash and first 3 banners
      const apiScreens = [
        {
          type: 'splash',
          content: <Text style={styles.logoText}>VM</Text>,
        },
        ...data.slice(3, 6).map((banner, index) => ({
          type: banner.type || `banner${index + 1}`,
          image: { uri: banner.url }, // Use image_url from API
          title: banner.title || `Your style tell about you ${index + 1}`,
        }))
      ];
      
      setBanners(apiScreens);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching banners:', error);
      setIsLoading(false);
      // Fallback to default screens if API fails
      setBanners(screens);
    }
  };
  const screens = [
    {
      type: 'splash',
      content: <Text style={styles.logoText}>VM</Text>,
    },
    {
      type: 'men',
      image: require('../images/men.jpg'),
      title: 'Your style tell about you 1',
    },
    {
      type: 'women',
      image: require('../images/women.jpg'),
      title: 'Your style tell about you 2',
    },
    {
      type: 'kids',
      image: require('../images/kids.jpg'),
      title: 'Your style tell about you 3',
    },
  ];
  useEffect(() => {
    if (currentIndex === 0) {
      setTimeout(() => setCurrentIndex(1), 2000); // Splash screen delay
    }
  }, [currentIndex]);

  const goNext = () => {
    if (currentIndex < screens.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
    if (currentIndex === 3) {
      navigation.navigate('Home');
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  const renderScreen = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#cba77b" />
        </View>
      );
    }

    if (!banners.length) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load banners</Text>
        </View>
      );
    }

    const screen = banners[currentIndex];

    if (screen.type === 'splash') {
      return (
        <View style={styles.splashContainer}>
          {screen.content}
        </View>
      );
    }
    return (
      <View style={styles.screenContainer}>
        <Image source={screen.image} style={styles.image} resizeMode="cover" />
        <View style={styles.overlay}>
          <TouchableOpacity style={[styles.goBack, { display: currentIndex > 1 ? "flex" : "none" }]} onPress={goBack}>
            <Text style={styles.goBackText}>&lt;</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{screen.title}</Text>
          <Text style={styles.subtitle}>
            There are many clothes with designs that are suitable for you today
          </Text>
          <View style={styles.buttonOverlay}>
            <View style={styles.activeIndex}>
              <Text style={[styles.activeIndexNum, currentIndex === 1 ? styles.activeIndex1 : ""]}>.</Text>
              <Text style={[styles.activeIndexNum, currentIndex === 2 ? styles.activeIndex1 : ""]}>.</Text>
              <Text style={[styles.activeIndexNum, currentIndex === 3 ? styles.activeIndex1 : ""]}>.</Text>
            </View>
            <TouchableOpacity onPress={goNext} style={styles.button}>
              <Text style={styles.buttonText}>Continue &rarr;</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderScreen()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#cba77b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 100,
    fontWeight: 'bold',
    color: '#000',
    backgroundColor: '#fff',
    padding: 0, // Remove padding to avoid shifting the text
    borderRadius: 150,
    width: 250,
    height: 250,
    textAlign: 'center', // Center text horizontally
    lineHeight: 250, // Center text vertically
  },
  screenContainer: {
    flex: 1,
    height,

  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 150,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(203,167,123,0.6)', // matching your brownish gradient
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#000',
    marginBottom: 10,

  },
  subtitle: {
    fontSize: 14,
    color: '#000',
    marginBottom: 20,
  },
  buttonOverlay: {
    backgroundColor: 'rgba(215, 159, 91, 0.6)',
    position: 'absolute',
    height: 100,
    bottom: 0,
    width,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  activeIndex: {
    alignItems: 'center',
    height: '100%',
    flexDirection: 'row'
  },

  activeIndexNum: {
    marginRight: 15,
    fontSize: 10,
    height: 8,
    width: 8,
    padding: 1,
    borderRadius: 50,
    backgroundColor: 'white',
  },
  activeIndex1: {
    backgroundColor: 'red'
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 25,
    width: 160,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  goBack: {
    backgroundColor: 'white',
    width: 40,
    height: 40,
    borderRadius: 50,
    position: 'absolute',
    top: 15,
    alignItems: 'center',
    justifyContent: 'center',
    left: 10
  },
  goBackText: {
    fontSize: 40,
    marginTop: -10,
    marginLeft: -2
  }
});

export default VideoHome;
