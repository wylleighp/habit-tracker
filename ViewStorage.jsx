import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@habit_tracker_data';

export default function ViewStorage() {
  const [storedData, setStoredData] = useState(null);

  // Load storage on mount
  useEffect(() => {
    loadStorage();
  }, []);

  // Function to read data from AsyncStorage
  const loadStorage = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data !== null) {
        setStoredData(JSON.parse(data));
      } else {
        setStoredData({ message: 'No data found!' });
      }
    } catch (error) {
      console.error('Error reading storage:', error);
      setStoredData({ message: 'Error reading storage' });
    }
  };

  // Optional: clear storage
  const clearStorage = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setStoredData({ message: 'Storage cleared!' });
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Habit Tracker Storage Debug</Text>

      <Button title="Reload Storage" onPress={loadStorage} />
      <Button title="Clear Storage" onPress={clearStorage} color="#e74c3c" />

      <ScrollView style={styles.scroll}>
        <Text style={styles.code}>
          {storedData ? JSON.stringify(storedData, null, 2) : 'Loading...'}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  scroll: { marginTop: 20, backgroundColor: '#fff', padding: 15, borderRadius: 12 },
  code: { fontFamily: 'monospace', fontSize: 14 },
});
