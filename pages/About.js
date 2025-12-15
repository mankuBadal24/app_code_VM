import React from "react";
import { View, Text, ScrollView, StyleSheet, Image } from "react-native";
import Header from "../components/Header";

const About = ({navigation}) => {
  return (
    <View>
      <Header navigation={navigation} currentPage="About"/>

    <ScrollView style={styles.container}>
      <Image 
        source={{ uri: "https://voguemine.com/_next/static/media/vlogo.28405d81.png" }} 
        style={styles.logo} 
        resizeMode="contain"
      />
      <Text style={styles.title}>About Voguemine</Text>
      <Text style={styles.text}>
        Voguemine is your premium destination for branded clothing, shoes, and accessories. 
        We focus on quality and style, offering exclusive collections from top brands like Gucci, Armani, Prada, Balmain, and more.
      </Text>
      <Text style={styles.text}>
        Our mission is to provide premium fashion at your fingertips with fast delivery and excellent customer support.
      </Text>
      <Text style={styles.subtitle}>Contact Us</Text>
      <Text style={styles.text}>Email: support@voguemine.com</Text>
      <Text style={styles.text}>Phone: +91 9899202079</Text>
      <Text style={styles.text}>Address: H-119, Sector 63, Noida, Uttar Pradesh, 201301</Text>
    </ScrollView>
    </View>

  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  logo: { width: 120, height: 120, alignSelf: "center", marginBottom: 0 },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 15 },
  subtitle: { fontSize: 18, fontWeight: "bold", marginTop: 20, marginBottom: 10 },
  text: { fontSize: 15, color: "#555", marginBottom: 10, lineHeight: 22 },
});

export default About;
