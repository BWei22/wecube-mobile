import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Button,
  ActivityIndicator,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Flag from 'react-native-flags';
import axios from 'axios';

interface Competition {
  id: string;
  name: string;
  city: string;
  country: string;
  date: {
    from: string;
    till: string;
  };
}

const Competitions = () => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState('current');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    axios
      .get('https://raw.githubusercontent.com/robiningelbrecht/wca-rest-api/master/api/competitions-page-1.json')
      .then((response) => {
        setCompetitions(response.data.items);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching competitions:', error);
        setLoading(false);
      });
  }, []);

  const currentDate = new Date().getTime();
  const pastMonthDate = new Date().setMonth(new Date().getMonth() - 1);

  const filteredCompetitions = competitions.filter((comp) => {
    const competitionEndDate = new Date(`${comp.date.till}T23:59:59Z`).getTime();
    const competitionStartDate = new Date(`${comp.date.from}T00:00:00Z`).getTime();
    const isUpcoming = competitionStartDate >= currentDate;
    const isRightNow = competitionStartDate <= currentDate && competitionEndDate >= currentDate;
    const isPastMonth = competitionEndDate < currentDate && competitionEndDate >= pastMonthDate;

    if (view === 'current') {
      return (
        (isUpcoming || isRightNow) &&
        (comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          comp.city.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    } else if (view === 'past') {
      return (
        isPastMonth &&
        (comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          comp.city.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return false;
  });

  const sortedCompetitions = filteredCompetitions.sort((a, b) => {
    if (view === 'past') {
      return new Date(b.date.till).getTime() - new Date(a.date.till).getTime();
    } else {
      return new Date(a.date.from).getTime() - new Date(b.date.from).getTime();
    }
  });

  const formatDateRange = (from: string, till: string) => {
    const fromDate = new Date(`${from}T00:00:00Z`);
    const tillDate = new Date(`${till}T23:59:59Z`);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' };
    const fromDateString = new Intl.DateTimeFormat('en-US', options).format(fromDate);
    const tillDateString = new Intl.DateTimeFormat('en-US', options).format(tillDate);

    if (fromDateString === tillDateString) {
      return fromDateString;
    } else {
      return `${fromDateString} - ${tillDateString}`;
    }
  };

  const handleCompetitionClick = (competitionId: string) => {
    router.push(`/tabs/competitions/${competitionId}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading competitions...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.viewToggle}>
            <Button
              title="Current"
              onPress={() => setView('current')}
              color={view === 'current' ? 'blue' : 'gray'}
            />
            <Button
              title="Past Month"
              onPress={() => setView('past')}
              color={view === 'past' ? 'blue' : 'gray'}
            />
          </View>

          <TextInput
            placeholder="Search Competitions"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />

          <FlatList
            data={sortedCompetitions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.competitionItem} onPress={() => handleCompetitionClick(item.id)}>
                <View style={styles.flagContainer}>
                  <Flag code={item.country} size={32} />
                </View>
                <View style={styles.detailsContainer}>
                  <Text style={styles.competitionName}>{item.name}</Text>
                  <Text style={styles.competitionDate}>
                    {formatDateRange(item.date.from, item.date.till)}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default Competitions;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewToggle: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  searchInput: {
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
  },
  competitionItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  flagContainer: {
    marginRight: 15,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  competitionName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  competitionDate: {
    color: '#777',
  },
});
