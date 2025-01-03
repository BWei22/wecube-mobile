import React, { useState, useEffect } from 'react';
import { View, Text, Button, Image, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, setDoc, serverTimestamp, query, where, collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../../../../../firebase';  // Adjust this path as needed

interface Listing {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  puzzleType: string;
  usage: string;
  description: string;
  userId: string;
}

const ListingDetails = () => {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();  // Strongly type listingId
  const [listing, setListing] = useState<Listing | null>(null);  // Define the correct type for listing
  const [sellerUsername, setSellerUsername] = useState('');
  const router = useRouter();

  // Ensure listingId is available before proceeding
  if (!listingId) {
    return (
      <View style={styles.centeredContainer}>
        <Text>Listing not found!</Text>
      </View>
    );
  }

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const docRef = doc(db, 'listings', listingId as string);  // Ensure listingId is passed as a string
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const listingData = docSnap.data() as Listing;  // Cast the document data to Listing type
          setListing({
            id: listingId as string,
            name: listingData.name || 'Unnamed Listing',
            price: listingData.price || 0,
            imageUrl: listingData.imageUrl || '',
            puzzleType: listingData.puzzleType || 'Unknown',
            usage: listingData.usage || 'Unknown',
            description: listingData.description || '',
            userId: listingData.userId || 'Unknown',
          });

          // Fetch the seller's username
          const userDocRef = doc(db, 'users', listingData.userId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setSellerUsername(userDocSnap.data().username);
          } else {
            setSellerUsername('Unknown');
          }
        }
      } catch (error) {
        console.error('Error fetching listing:', error);
      }
    };

    fetchListing();
  }, [listingId]);

  if (!listing) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading listing details...</Text>
      </View>
    );
  }

  const handleContactSeller = async () => {
    if (!auth.currentUser) {
      alert('You must be logged in to contact the seller.');
      router.push('/login');  // Redirect to the login page if the user is not authenticated
      return;
    }
  
    const buyerId = auth.currentUser.uid;
    const sellerId = listing.userId;
  
    // Step 1: Generate a conversation ID that is independent of the order of buyerId and sellerId
    const sortedIds = [buyerId, sellerId].sort();  // Sort the two user IDs alphabetically
    const conversationId = `${sortedIds[0]}_${sortedIds[1]}`;  // Create a unique conversation ID
  
    // Step 2: Check if the conversation already exists
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);
  
    // Step 3: If no conversation exists, create one
    if (!conversationDoc.exists()) {
      await setDoc(conversationRef, {
        participants: sortedIds,  // Store the participants in sorted order
        createdAt: serverTimestamp(),
        lastMessage: '',
        unreadBy: [sellerId],  // Mark the seller as having unread messages initially
      });
    }
  
    // Step 4: Navigate to the conversation page
    router.push(`/tabs/messages/${conversationId}`);
  };
  

  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      <Image source={{ uri: listing.imageUrl }} style={styles.listingImage} />
      
      <View style={styles.card}>
        <Text style={styles.listingName}>{listing.name}</Text>
        <Text style={styles.listingDetail}>Puzzle Type: <Text style={styles.detailValue}>{listing.puzzleType}</Text></Text>
        <Text style={styles.listingDetail}>Price: <Text style={styles.detailValue}>${listing.price}</Text></Text>
        <Text style={styles.listingDetail}>Usage: <Text style={styles.detailValue}>{listing.usage}</Text></Text>
        <Text style={styles.listingDetail}>Description:</Text>
        <Text style={styles.listingDescription}>{listing.description}</Text>
        <Text style={styles.listingDetail}>Seller: <Text style={styles.detailValue}>{sellerUsername}</Text></Text>
      </View>

      {/* Only show the Contact Seller button if the current user is not the seller */}
      {listing.userId !== auth.currentUser?.uid && (
        <Button title="Contact the Seller" onPress={handleContactSeller} color="#007BFF" />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 20,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  listingImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  listingName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  listingDetail: {
    fontSize: 16,
    marginBottom: 5,
  },
  detailValue: {
    fontWeight: 'bold',
  },
  listingDescription: {
    fontSize: 14,
    marginTop: 5,
    color: '#555',
  },
});

export default ListingDetails;
