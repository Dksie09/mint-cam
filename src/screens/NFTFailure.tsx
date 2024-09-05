import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Card, Title, Paragraph } from "react-native-paper";
import { RouteProp } from "@react-navigation/native";

type NFTFailureParams = {
  error: string;
};

type NFTFailureProps = {
  route: RouteProp<{ NFTFailure: NFTFailureParams }, "NFTFailure">;
};

export function NFTFailure({ route }: NFTFailureProps) {
  const { error } = route.params;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Failure</Title>
          <Paragraph style={styles.errorText}>
            Something went wrong during the minting process.
          </Paragraph>
          <Paragraph style={styles.errorMessage}>Error: {error}</Paragraph>
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
    color: "red",
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 15,
  },
  errorText: {
    color: "#ff4f4f",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  errorMessage: {
    color: "#b0b0b0",
    marginBottom: 10,
    textAlign: "center",
  },
});
