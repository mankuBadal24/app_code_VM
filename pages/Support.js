import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import Header from "../components/Header";
// import { MaterialIcons } from '@expo/vector-icons';

const HelpSupport = ({navigation}) => {
  const faqs = [
    { question: "How to track my order?", answer: "Go to My Orders and click View Details." },
    { question: "How to cancel my order?", answer: "Contact support within 24 hours." },
    { question: "How to return a product?", answer: "Check return policy under My Orders." },
    { question: "How to contact customer care?", answer: "You can call or WhatsApp our support team." },
  ];

  return (
    <View>
      <Header navigation={navigation} currentPage="Help & Support"/>

    <ScrollView style={styles.container}>
      {faqs.map((faq, idx) => (
        <View key={idx} style={styles.card}>
          <View style={styles.row}>
            {/* <MaterialIcons name="help-outline" size={24} color="#4CAF50" /> */}
            <Text style={styles.question}>{faq.question}</Text>
          </View>
          <Text style={styles.answer}>{faq.answer}</Text>
        </View>
      ))}

      <TouchableOpacity style={styles.contactBtn}>
        <Text style={styles.contactText}>Contact Support</Text>
      </TouchableOpacity>
    </ScrollView>
    </View>

  );
};

const styles = StyleSheet.create({
  container: { padding: 15 },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 15,
    borderRadius: 15,
  },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  question: { fontWeight: "bold", fontSize: 16, marginLeft: 10 },
  answer: { fontSize: 14, color: "#555" },
  contactBtn: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 50,
    alignItems: "center",
    marginTop: 20,
  },
  contactText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

export default HelpSupport;
