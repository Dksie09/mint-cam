import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useAuthorization } from "../utils/useAuthorization";
import { UserAccount } from "../components/account/account-detail-feature";
import { SignInFeature } from "../components/sign-in/sign-in-feature";

export function HomeScreen() {
  const { selectedAccount } = useAuthorization();

  return (
    <View style={styles.screenContainer}>
      {selectedAccount ? (
        <UserAccount />
      ) : (
        <>
          <View style={styles.centeredContent}>
            <Text
              style={{
                fontWeight: "bold",
                textAlign: "center",
              }}
              variant="displaySmall"
            >
              Welcome To
            </Text>
            <Text
              style={{
                fontWeight: "bold",
                marginBottom: 12,
                textAlign: "center",
              }}
              variant="displaySmall"
            >
              Mint Cam
            </Text>
            <Text
              style={{ marginBottom: 25, textAlign: "center" }}
              variant="bodyMedium"
            >
              Turn your moments into geo-tagged NFTs instantly.
            </Text>
            <SignInFeature />
            <Text
              style={{
                textAlign: "center",
                color: "yellow",
                marginTop: 70,
              }}
              variant="bodySmall"
            >
              Connect your wallet to get started
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    padding: 16,
  },
  centeredContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -100,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    marginBottom: 25,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
