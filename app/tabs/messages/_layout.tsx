import React from 'react';
import { Stack } from 'expo-router';

export default function MessagesStack() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Messages', headerShown: false }} />
      <Stack.Screen name="[messageId]" options={{ title: 'This Conversation', headerShown: false }} />
    </Stack>
  );
}