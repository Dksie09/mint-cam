import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  Platform,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import { Button, Text, Icon, useTheme, Card, Title } from "react-native-paper";
import { useAuthorization, APP_IDENTITY } from "../../utils/useAuthorization";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import axios from "axios";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Keypair,
} from "@solana/web3.js";
import {
  createMint,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createInitializeMintInstruction,
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
} from "@solana/spl-token";
import {
  transact,
  Web3MobileWallet,
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { useNavigation, NavigationProp } from "@react-navigation/native";

type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  Metadata: {
    metadata: {
      name: string;
      symbol: string;
      description: string;
      image: string;
      attributes: Array<{ trait_type: string; value: number }>;
    };
  };
  NFTSuccess: {
    mintAddress: string;
    imageUrl: string;
    name: string;
    symbol: string;
    attributes: Array<{ trait_type: string; value: number }>;
  };
  NFTFailure: {
    error: string;
  };
};

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/drpkrxpgt/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "mintcampreset";

interface Attribute {
  trait_type: string;
  value: number;
}

interface Metadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  payer: string;
  attributes: Attribute[];
}

export function UserAccount() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { selectedAccount, authorizeSession } = useAuthorization();
  const [image, setImage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const theme = useTheme();

  const pickImage = async () => {
    setUploading(true);
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
      await uploadImage(result.assets[0].uri);
    } else {
      setUploading(false);
    }
  };

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("Permission to access location was denied");
      return;
    }

    let loc = await Location.getCurrentPositionAsync({});
    setLocation({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });
  };

  const uploadImage = async (imageUri: string) => {
    const data = new FormData();

    const fileName = imageUri.split("/").pop() || "nft-image.jpg";
    const fileType =
      fileName.split(".").pop()?.toLowerCase() === "png"
        ? "image/png"
        : "image/jpeg";

    if (Platform.OS === "android") {
      data.append("file", {
        uri: "file://" + imageUri,
        type: fileType,
        name: fileName,
      } as any);
    } else {
      data.append("file", {
        uri: imageUri,
        type: fileType,
        name: fileName,
      } as any);
    }

    data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await axios.post(CLOUDINARY_URL, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImageUrl(response.data.secure_url);
      console.log("Image uploaded successfully:", response.data.secure_url);

      // Create metadata after successful upload
      createMetadata(response.data.secure_url);
    } catch (error) {
      console.error("Error uploading image: ", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Cloudinary response:", error.response.data);
      }
    } finally {
      setUploading(false);
    }
  };

  const createMetadata = (imageUrl: string) => {
    const newMetadata: Metadata = {
      name: "Geo-Tagged NFT",
      symbol: "GEO",
      description: "A unique geo-tagged NFT captured with MintCam",
      image: imageUrl,
      payer: selectedAccount?.publicKey.toString() || "",
      attributes: [
        { trait_type: "Latitude", value: location?.latitude || 0 },
        { trait_type: "Longitude", value: location?.longitude || 0 },
      ],
    };
    setMetadata(newMetadata);
  };

  const createNFT = async () => {
    if (!selectedAccount || !metadata) {
      Alert.alert("Error", "Wallet not connected or metadata not available");
      return;
    }

    setMinting(true);
    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );

    try {
      const payerPublicKey = selectedAccount.publicKey;

      // Check and log the balance of the account
      const balance = await connection.getBalance(payerPublicKey);
      console.log(`Account Public Key: ${payerPublicKey.toBase58()}`);
      console.log(`Account balance: ${balance / LAMPORTS_PER_SOL} SOL`);

      if (balance < LAMPORTS_PER_SOL) {
        throw new Error(
          `Insufficient balance. Current balance: ${
            balance / LAMPORTS_PER_SOL
          } SOL. Please add some SOL to your account.`
        );
      }

      await transact(async (wallet: Web3MobileWallet) => {
        // Re-authorize the wallet
        await authorizeSession(wallet);

        // Create a new keypair for the mint
        const mintKeypair = Keypair.generate();

        console.log("Creating new mint...");

        // Calculate rent for mint
        const lamports = await connection.getMinimumBalanceForRentExemption(
          MINT_SIZE
        );

        // Create instructions
        const createAccountInstruction = SystemProgram.createAccount({
          fromPubkey: payerPublicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        });

        const initializeMintInstruction = createInitializeMintInstruction(
          mintKeypair.publicKey,
          0,
          payerPublicKey,
          payerPublicKey
        );

        // Get the associated token account address
        const associatedTokenAddress = await getAssociatedTokenAddress(
          mintKeypair.publicKey,
          payerPublicKey
        );

        // Create the associated token account if it doesn't exist
        const createAssociatedTokenAccountIx =
          createAssociatedTokenAccountInstruction(
            payerPublicKey,
            associatedTokenAddress,
            payerPublicKey,
            mintKeypair.publicKey
          );

        // Create mint-to instruction
        const mintToInstruction = createMintToInstruction(
          mintKeypair.publicKey,
          associatedTokenAddress,
          payerPublicKey,
          1
        );

        // Combine all instructions into a single transaction
        const transaction = new Transaction().add(
          createAccountInstruction,
          initializeMintInstruction,
          createAssociatedTokenAccountIx,
          mintToInstruction
        );

        // Sign transaction
        transaction.feePayer = payerPublicKey;
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;

        const [signedTransaction] = await wallet.signTransactions({
          transactions: [transaction],
        });
        if (signedTransaction instanceof Transaction) {
          signedTransaction.partialSign(mintKeypair);

          // Send and confirm transaction
          const signature = await connection.sendRawTransaction(
            signedTransaction.serialize()
          );
          await connection.confirmTransaction(signature);

          console.log(
            `NFT minted successfully. Token Mint: https://explorer.solana.com/address/${mintKeypair.publicKey.toBase58()}?cluster=devnet`
          );

          // Navigate to success page
          navigation.navigate("NFTSuccess", {
            mintAddress: mintKeypair.publicKey.toBase58(),
            imageUrl: metadata.image,
            name: metadata.name,
            symbol: metadata.symbol,
            attributes: metadata.attributes,
          });
        } else {
          throw new Error("Failed to sign transaction");
        }
      });
    } catch (error) {
      console.error("Error creating NFT:", error);

      // Navigate to failure page
      navigation.navigate("NFTFailure", {
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setMinting(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  if (!selectedAccount) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
          <View style={styles.contentContainer}>
            <Text style={styles.title} variant="displaySmall">
              Mint Cam
            </Text>
            <Text style={styles.subtitle} variant="bodyMedium">
              Turn your moments into geo-tagged NFTs instantly.
            </Text>
            <Button
              mode="contained"
              disabled={!selectedAccount || uploading}
              onPress={pickImage}
              style={styles.button}
              icon={({ size, color }) => (
                <Icon source="camera" size={size} color={color} />
              )}
            >
              {uploading
                ? "Uploading..."
                : image
                ? "Recapture"
                : "Capture Photo"}
            </Button>
            {image && <Image source={{ uri: image }} style={styles.image} />}
            {metadata && !uploading && (
              <Card style={styles.card}>
                <Card.Content>
                  <Title style={styles.sectionTitle}>Details</Title>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Name:</Text>
                    <Text style={styles.value}>{metadata.name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Symbol:</Text>
                    <Text style={styles.value}>{metadata.symbol}</Text>
                  </View>
                  {metadata.attributes.map((attr: Attribute, index: number) => (
                    <View key={index} style={styles.detailRow}>
                      <Text style={styles.label}>{attr.trait_type}:</Text>
                      <Text style={styles.value}>{attr.value.toFixed(6)}</Text>
                    </View>
                  ))}
                </Card.Content>
              </Card>
            )}
            {!selectedAccount && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                Make sure your wallet is connected.
              </Text>
            )}
          </View>
        </ScrollView>
        {metadata && !uploading && (
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              disabled={!selectedAccount || minting}
              onPress={createNFT}
              style={styles.mintButton}
            >
              {minting ? "Minting..." : "Mint NFT"}
            </Button>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

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
    paddingBottom: 24,
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
});
