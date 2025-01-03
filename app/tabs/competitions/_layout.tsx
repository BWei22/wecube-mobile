import React from 'react';
import { Stack } from 'expo-router';

export default function CompetitionStack() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Competitions List', headerShown: false }} />
      <Stack.Screen name="[competitionId]" options={{ title: 'This Competition', headerShown: false }} />
    </Stack>
  );
}
