// import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";
// import { Metaplex, keypairIdentity, Nft } from "@metaplex-foundation/js";

// interface Attribute {
//   trait_type: string;
//   value: number;
// }
// interface Metadata {
//   name: string;
//   symbol: string;
//   description: string;
//   image: string;
//   payer: string;
//   attributes: Attribute[];
// }

// export async function mintNFT(metadata: Metadata, wallet: any): Promise<Nft> {
//   try {
//     const connection = new Connection(clusterApiUrl("devnet"));

//     if (!wallet) {
//       throw new Error("Wallet not connected");
//     }

//     const metaplex = Metaplex.make(connection).use(keypairIdentity(wallet));

//     const { name, symbol, description, image, attributes } = metadata;

//     const { nft } = await metaplex.nfts().create({
//       uri: image,
//       name,
//       symbol,
//       sellerFeeBasisPoints: 500,
//       creators: [{ address: wallet.publicKey.toBase58(), share: 100 }],
//     });

//     console.log("NFT Minted Successfully: ", nft);
//     return nft;
//   } catch (error) {
//     console.error("Error minting NFT: ", error);
//     throw error;
//   }
// }
