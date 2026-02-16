import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@habit_tracker_data";

// Default habits (used on first run, or if storage was cleared)
const INITIAL_HABITS = [
  { id: "1", name: "Drink Water", description: "Drink 8 glasses", completed: false },
  { id: "2", name: "Exercise", description: "30 minutes workout", completed: false },
  { id: "3", name: "Read", description: "Read for 20 minutes", completed: false },
  { id: "4", name: "Meditate", description: "10 minutes meditation", completed: false },
  { id: "5", name: "Eat Healthy", description: "Include vegetables", completed: false },
];

export default function App() {
  const [habits, setHabits] = useState(INITIAL_HABITS);
  const [currentDate, setCurrentDate] = useState("");

  // New habit form state
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitDesc, setNewHabitDesc] = useState("");
  const [showManager, setShowManager] = useState(true);

  useEffect(() => {
    loadHabits();
    updateDate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    saveHabits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits]);

  const updateDate = () => {
    const now = new Date();
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    setCurrentDate(now.toLocaleDateString("en-US", options));
  };

  const loadHabits = async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);

      // First run
      if (!savedData) {
        setHabits(INITIAL_HABITS);
        return;
      }

      const parsed = JSON.parse(savedData);
      const savedHabits = Array.isArray(parsed?.habits) ? parsed.habits : INITIAL_HABITS;
      const savedDate = parsed?.date;

      const today = new Date().toDateString();

      // Same day → keep completion states
      if (savedDate === today) {
        setHabits(savedHabits);
        return;
      }

      // New day → reset completion states, but keep the habit list
      const resetHabits = savedHabits.map((h) => ({ ...h, completed: false }));
      setHabits(resetHabits);
    } catch (error) {
      console.error("Error loading habits:", error);
      // Safe fallback
      setHabits(INITIAL_HABITS);
    }
  };

  const saveHabits = async () => {
    try {
      const dataToSave = { habits, date: new Date().toDateString() };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error("Error saving habits:", error);
    }
  };

  const toggleHabit = (id) => {
    setHabits((prev) =>
      prev.map((habit) => (habit.id === id ? { ...habit, completed: !habit.completed } : habit))
    );
  };

  const addHabit = () => {
    const name = newHabitName.trim();
    const description = newHabitDesc.trim();

    if (!name) {
      Alert.alert("Missing name", "Please enter a habit name.");
      return;
    }

    // Basic unique id
    const id = `${Date.now()}`;

    const newHabit = {
      id,
      name,
      description: description || "No description",
      completed: false,
    };

    setHabits((prev) => [...prev, newHabit]);
    setNewHabitName("");
    setNewHabitDesc("");
  };

  const removeHabit = (id) => {
    const habit = habits.find((h) => h.id === id);

    Alert.alert(
      "Remove habit?",
      habit ? `Delete "${habit.name}" from your list?` : "Delete this habit?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => setHabits((prev) => prev.filter((h) => h.id !== id)),
        },
      ]
    );
  };

  const clearAllHabits = () => {
    Alert.alert(
      "Reset habits?",
      "This clears your list and restores the default habits.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            setHabits(INITIAL_HABITS);
            await AsyncStorage.removeItem(STORAGE_KEY);
          },
        },
      ]
    );
  };

  const completedCount = useMemo(() => habits.filter((h) => h.completed).length, [habits]);
  const percentage = habits.length === 0 ? 0 : Math.round((completedCount / habits.length) * 100);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Habit Tracker</Text>
          <Text style={styles.headerDate}>{currentDate}</Text>
          <Text style={styles.headerProgress}>
            {completedCount} / {habits.length} completed ({percentage}%)
          </Text>

          <View style={styles.headerButtonsRow}>
            <TouchableOpacity
              style={styles.smallHeaderBtn}
              onPress={() => setShowManager((s) => !s)}
            >
              <Text style={styles.smallHeaderBtnText}>
                {showManager ? "Hide Manager" : "Manage Habits"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.smallHeaderBtn, styles.dangerBtn]} onPress={clearAllHabits}>
              <Text style={styles.smallHeaderBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.habitList} keyboardShouldPersistTaps="handled">
          {/* Habit Manager */}
          {showManager && (
            <View style={styles.managerCard}>
              <Text style={styles.managerTitle}>Add a Habit</Text>

              <TextInput
                style={styles.input}
                placeholder="Habit name (e.g., Journal)"
                value={newHabitName}
                onChangeText={setNewHabitName}
              />
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Description (optional)"
                value={newHabitDesc}
                onChangeText={setNewHabitDesc}
                multiline
              />

              <TouchableOpacity style={styles.addBtn} onPress={addHabit}>
                <Text style={styles.addBtnText}>+ Add Habit</Text>
              </TouchableOpacity>

              <Text style={styles.managerHint}>
                Tip: Use the 🗑 button to remove a habit.
              </Text>
            </View>
          )}

          {/* Habit List */}
          {habits.length === 0 ? (
            <Text style={styles.emptyText}>No habits yet. Add one above.</Text>
          ) : (
            habits.map((habit) => (
              <HabitItem
                key={habit.id}
                habit={habit}
                onToggle={() => toggleHabit(habit.id)}
                onRemove={() => removeHabit(habit.id)}
              />
            ))
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function HabitItem({ habit, onToggle, onRemove }) {
  return (
    <View style={[styles.habitItem, habit.completed && styles.habitItemCompleted]}>
      <TouchableOpacity style={styles.habitInfo} onPress={onToggle} activeOpacity={0.8}>
        <Text style={[styles.habitName, habit.completed && styles.habitNameCompleted]}>
          {habit.name}
        </Text>
        <Text style={styles.habitDescription}>{habit.description}</Text>
      </TouchableOpacity>

      <View style={styles.rightControls}>
        {/* Toggle */}
        <TouchableOpacity
          style={[styles.toggleButton, habit.completed && styles.toggleButtonActive]}
          onPress={onToggle}
          activeOpacity={0.8}
        >
          <View style={[styles.toggleCircle, habit.completed && styles.toggleCircleActive]} />
        </TouchableOpacity>

        {/* Remove */}
        <TouchableOpacity style={styles.trashBtn} onPress={onRemove} activeOpacity={0.8}>
          <Text style={styles.trashText}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },

  header: { backgroundColor: "#061603", padding: 30, paddingTop: 60 },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "white", marginBottom: 5 },
  headerDate: { fontSize: 16, color: "rgba(255,255,255,0.9)", marginBottom: 10 },
  headerProgress: { fontSize: 14, color: "rgba(255,255,255,0.8)" },

  headerButtonsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  smallHeaderBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  dangerBtn: { backgroundColor: "rgba(255, 0, 0, 0.22)" },
  smallHeaderBtnText: { color: "white", fontWeight: "600" },

  habitList: { flex: 1, padding: 20 },

  managerCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  managerTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10, color: "#222" },
  input: {
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  inputMultiline: { minHeight: 60, textAlignVertical: "top" },
  addBtn: { backgroundColor: "#4caf50", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  addBtnText: { color: "white", fontWeight: "700" },
  managerHint: { marginTop: 10, color: "#666", fontSize: 12 },

  emptyText: { textAlign: "center", color: "#666", marginTop: 30 },

  habitItem: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  habitItemCompleted: { backgroundColor: "#e8f5e9" },
  habitInfo: { flex: 1, paddingRight: 10 },

  habitName: { fontSize: 18, fontWeight: "600", color: "#333", marginBottom: 5 },
  habitNameCompleted: { textDecorationLine: "line-through", color: "#4caf50" },
  habitDescription: { fontSize: 14, color: "#666" },

  rightControls: { flexDirection: "row", alignItems: "center", gap: 12 },

  toggleButton: {
    width: 60,
    height: 30,
    backgroundColor: "#ccc",
    borderRadius: 15,
    justifyContent: "center",
    padding: 3,
  },
  toggleButtonActive: { backgroundColor: "#4caf50" },
  toggleCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: "white" },
  toggleCircleActive: { alignSelf: "flex-end" },

  trashBtn: { padding: 6, borderRadius: 8, backgroundColor: "#f2f2f2" },
  trashText: { fontSize: 16 },
});
