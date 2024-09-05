import React, { FC } from "react";
import { View, StyleSheet, ScrollView, Image, Dimensions } from "react-native";
import {
  Text,
  useTheme,
  Card,
  Title,
  Paragraph,
  Button,
} from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { mintNFT } from "../utils/mintNFT";
import { useAuthorization } from "../utils/useAuthorization";

const { width } = Dimensions.get("window");
const imageWidth = width * 0.8;

type RootStackParamList = {
  Metadata: {
    metadata: {
      name: string;
      symbol: string;
      description: string;
      payer: string;
      image: string;
      attributes: Array<{ trait_type: string; value: number }>;
    };
  };
};

type MetadataScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Metadata"
>;

export const MetadataScreen: FC<MetadataScreenProps> = ({ route }) => {
  const { metadata } = route.params;
  const theme = useTheme();
  const { selectedAccount } = useAuthorization();
  const [minting, setMinting] = React.useState(false);
  const [mintResult, setMintResult] = React.useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleMintNFT = async () => {
    if (!metadata || !selectedAccount) return;

    setMinting(true);
    try {
      const nft = await mintNFT(metadata, selectedAccount);
      setMintResult({
        success: true,
        message: `NFT minted successfully! Mint address: ${nft.address.toString()}`,
      });
    } catch (error: any) {
      setMintResult({
        success: false,
        message: `Failed to mint NFT: ${error.message}`,
      });
    } finally {
      setMinting(false);
    }
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollViewContent: {
      padding: 16,
      paddingBottom: 24, // Add extra padding at the bottom
    },
    contentContainer: {
      alignItems: "center",
    },
    locationText: {
      textAlign: "center",
      marginBottom: 16,
    },
    title: {
      fontWeight: "bold",
      marginBottom: 12,
      textAlign: "center",
    },
    subtitle: {
      marginBottom: 25,
      textAlign: "center",
    },
    button: {
      marginBottom: 20,
    },
    image: {
      width: 200,
      height: 200,
      marginBottom: 20,
      borderRadius: 10,
    },
    card: {
      marginBottom: 16,
      elevation: 4,
      width: "100%",
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 8,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    label: {
      fontWeight: "bold",
      fontSize: 16,
    },
    value: {
      fontSize: 16,
    },
    errorText: {
      textAlign: "center",
      marginTop: 10,
    },
    buttonContainer: {
      padding: 16,
      backgroundColor: "transparent",
    },
    mintButton: {
      width: "100%",
    },
    resultCard: {
      marginTop: 16,
    },
  });

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>NFT Metadata</Title>
          <Image source={{ uri: metadata.image }} style={styles.image} />
          {/* <Paragraph style={styles.description}>
            {metadata.description}
          </Paragraph> */}
          <Title style={styles.sectionTitle}>Details</Title>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{metadata.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Symbol:</Text>
            <Text style={styles.value}>{metadata.symbol}</Text>
          </View>
          {metadata.attributes.map((attr, index) => (
            <View key={index} style={styles.detailRow}>
              <Text style={styles.label}>{attr.trait_type}:</Text>
              <Text style={styles.value}>{attr.value.toFixed(6)}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>
      <Button
        mode="contained"
        onPress={handleMintNFT}
        disabled={minting}
        loading={minting}
        style={styles.mintButton}
      >
        {minting ? "Minting..." : "Mint NFT"}
      </Button>
      {mintResult && (
        <Card style={styles.resultCard}>
          <Card.Content>
            <Title style={{ color: mintResult.success ? "green" : "red" }}>
              {mintResult.success ? "Minting Successful" : "Minting Failed"}
            </Title>
            <Paragraph>{mintResult.message}</Paragraph>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};
