import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function ProfileScreen({ navigation }) {
  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('rr_role')
          // RootNavigator listens for role change — reload app to show Login
        },
      },
    ])
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>S</Text>
        </View>
        <Text style={s.name}>Staff Member</Text>
        <Text style={s.role}>Staff</Text>
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#0f0e0c' },
  container:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  avatar:     { width: 80, height: 80, borderRadius: 40, backgroundColor: '#C9A84C', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#0f0e0c' },
  name:       { fontSize: 20, fontWeight: '700', color: '#e4e4e7' },
  role:       { fontSize: 13, color: '#71717a', marginBottom: 24 },
  logoutBtn:  { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ef4444' },
  logoutText: { color: '#ef4444', fontWeight: '600' },
})
