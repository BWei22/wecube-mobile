import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { collection, query, where, onSnapshot, getDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebase'; // Adjust path to your Firebase config
import { useRouter } from 'expo-router';

interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: {
    message: string;
    senderId: string;
    timestamp: any;
    isRead?: boolean;  // To track whether the last message has been read
  };
}

interface User {
  username: string;
  photoURL: string;
}

const Messages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [usernames, setUsernames] = useState<{ [key: string]: { username: string; photoURL: string } }>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const convos: Conversation[] = [];
      const usernamesMap: { [key: string]: { username: string; photoURL: string } } = {};

      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data() as Conversation;
        const conversationData = { ...data, id: docSnapshot.id };

        convos.push(conversationData);

        const otherParticipantId = data.participants.find(id => id !== auth.currentUser?.uid);
        if (otherParticipantId && !usernamesMap[otherParticipantId]) {
          const userDocRef = doc(db, 'users', otherParticipantId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as User;
            usernamesMap[otherParticipantId] = {
              username: userData.username || 'Unknown',
              photoURL: userData.photoURL || 'https://via.placeholder.com/40',
            };
          }
        }
      }

      setConversations(convos);
      setUsernames(prevState => ({ ...prevState, ...usernamesMap }));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleConversationClick = async (conversation: Conversation) => {
    router.push(`/tabs/messages/${conversation.id}`);

    // Fetch unread messages in this conversation and mark them as read
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversation.id),
      where('recipientId', '==', auth.currentUser?.uid),
      where('isRead', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.forEach(async (messageDoc) => {
        // Mark message as read
        await updateDoc(messageDoc.ref, { isRead: true });
      });
    });

    // Mark the last message in the conversation as read (for the red dot logic)
    if (
      conversation.lastMessage?.isRead === false &&
      conversation.lastMessage?.senderId !== auth.currentUser?.uid
    ) {
      const conversationRef = doc(db, 'conversations', conversation.id);
      await updateDoc(conversationRef, {
        'lastMessage.isRead': true,
      });
    }

    return () => unsubscribe();
  };

  const hasUnreadMessages = (conversation: Conversation): boolean => {
    // Check if the last message is unread AND the current user is the recipient
    return (
      conversation.lastMessage?.isRead === false &&
      conversation.lastMessage?.senderId !== auth.currentUser?.uid
    );
  };  

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No conversations yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const otherParticipantId = item.participants.find(id => id !== auth.currentUser?.uid);
        const otherParticipant = usernames[otherParticipantId || ''] || { username: 'Unknown', photoURL: 'https://via.placeholder.com/40' };

        return (
          <TouchableOpacity onPress={() => handleConversationClick(item)} style={styles.conversationItem}>
            <Image source={{ uri: otherParticipant.photoURL }} style={styles.profilePicture} />
            <View style={styles.conversationDetails}>
              <Text style={styles.username}>{otherParticipant.username}</Text>
              <Text style={styles.lastMessage}>
                {item.lastMessage?.message || 'No messages yet'}
              </Text>
            </View>
            {hasUnreadMessages(item) && <View style={styles.unreadIndicator} />}
          </TouchableOpacity>
        );
      }}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    position: 'relative',
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  conversationDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  lastMessage: {
    fontSize: 14,
    color: '#888',
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 20,
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -5 }],
  },
});

export default Messages;
