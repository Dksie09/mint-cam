import React from "react";
import {
  View,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Text, Card, Title, Paragraph } from "react-native-paper";
import { RouteProp } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";

type NFTSuccessParams = {
  mintAddress: string;
  imageUrl: string;
  name: string;
  symbol: string;
  attributes: Array<{ trait_type: string; value: number }>;
};

type NFTSuccessProps = {
  route: RouteProp<{ NFTSuccess: NFTSuccessParams }, "NFTSuccess">;
};

export function NFTSuccess({ route }: NFTSuccessProps) {
  const { mintAddress, imageUrl, name, symbol, attributes } = route.params;

  const handleLongPressCopy = () => {
    Clipboard.setString(mintAddress);
    Alert.alert("Copied to clipboard", "The mint address has been copied.");
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Success</Title>
          <Image source={{ uri: imageUrl }} style={styles.image} />
          <TouchableOpacity onLongPress={handleLongPressCopy}>
            <Paragraph style={styles.mintAddress}>
              Mint Address: {mintAddress}
            </Paragraph>
          </TouchableOpacity>
          {attributes.map((attr, index) => (
            <Paragraph key={index} style={styles.paragraph}>
              {attr.trait_type}: {attr.value}
            </Paragraph>
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#121212",
  },
  card: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    paddingVertical: 30,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    color: "lightgreen",
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 15,
  },
  image: {
    width: 250,
    height: 250,
    alignSelf: "center",
    marginVertical: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  mintAddress: {
    color: "#4CAF50",
    marginTop: 10,
    marginBottom: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  paragraph: {
    color: "#b0b0b0",
    marginBottom: 10,
  },
});
