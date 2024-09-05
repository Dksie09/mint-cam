import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  Platform,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import {
  Button,
  Text,
  Icon,
  useTheme,
  Card,
  Title,
  Paragraph,
} from "react-native-paper";
import { useAuthorization } from "../../utils/useAuthorization";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";

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
  const { selectedAccount } = useAuthorization();
  const [image, setImage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const theme = useTheme();
  const navigation = useNavigation();

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
          {/* {location && (
            <Text
              style={[styles.locationText, { color: theme.colors.secondary }]}
            >
              Latitude: {location.latitude.toFixed(4)}, Longitude:{" "}
              {location.longitude.toFixed(4)}
            </Text>
          )} */}
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
              disabled={!selectedAccount}
              onPress={() => navigation.navigate("Metadata", { metadata })}
              style={styles.mintButton}
            >
              Proceed to Mint NFT
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
});
