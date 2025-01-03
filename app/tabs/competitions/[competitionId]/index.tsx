import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../firebase'; // Adjust this path as needed

// Define the Listing interface
interface Listing {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  puzzleType: string;
  usage: string;
  description: string;
  userId: string;
  createdAt: number;
}

const Listings = () => {
  const { competitionId } = useLocalSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, 'listings'), where('competitionId', '==', competitionId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listingsData = snapshot.docs.map(doc => {
        const data = doc.data();

        // Make sure all required fields are present
        return {
          id: doc.id,
          name: data.name || 'Unnamed',  // Fallback if name is missing
          price: data.price || 0,  // Fallback if price is missing
          imageUrl: data.imageUrl || '',
          puzzleType: data.puzzleType || 'Unknown',
          usage: data.usage || 'Unknown',
          description: data.description || '',
          userId: data.userId || 'Unknown',
          createdAt: data.createdAt || Date.now(),
        } as Listing;  // Explicitly cast to Listing type
      });

      setListings(listingsData);
      setLoading(false);
    }, error => {
      console.error('Error fetching listings:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [competitionId]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading listings...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button
        title="Create New Listing"
        onPress={() => router.push(`/tabs/competitions/${competitionId}/create-listing`)}
      />
      
      <FlatList
        data={listings}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.cardContainer} 
            onPress={() => router.push(`/tabs/competitions/${competitionId}/${item.id}`)}
          >
            <View style={styles.card}>
              <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardPrice}>${item.price}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default Listings;

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 20,  // Spacing between cards
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,  // For Android shadow effect
  },
  cardImage: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
  cardContent: {
    flex: 1,
    padding: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardPrice: {
    fontSize: 16,
    color: '#777',
  },
});
