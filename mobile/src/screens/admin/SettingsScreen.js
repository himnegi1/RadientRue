import React from 'react'
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity, Alert,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { clearRole } from '../../lib/storage'

const GOLD = '#C9A84C'

export default function AdminSettingsScreen() {

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          await clearRole()
        },
      },
    ])
  }

  function handleClearData() {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete ALL service records, attendance data, and staff profiles. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything', style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove([
              'rr_service_records',
              'rr_attendance',
              'rr_staff_profile',
            ])
            Alert.alert('Done', 'All data has been cleared.')
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>

        <Text style={s.heading}>Settings</Text>

        {/* Account */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Account</Text>
          <TouchableOpacity style={s.row} onPress={handleLogout}>
            <Text style={s.rowText}>Logout</Text>
            <Text style={s.rowChevron}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Data Management */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Data Management</Text>
          <TouchableOpacity style={s.row} onPress={handleClearData}>
            <Text style={[s.rowText, { color: '#ef4444' }]}>Clear All Data</Text>
            <Text style={s.rowChevron}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Staff PINs */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Staff PINs</Text>
          {[
            { name: 'Akram Khan', pin: '1234' },
            { name: 'Azad', pin: '2345' },
            { name: 'Sawan Kumar', pin: '3456' },
            { name: 'Sonu', pin: '4567' },
            { name: 'Umer', pin: '5678' },
            { name: 'Admin', pin: '9999' },
          ].map(s => (
            <View key={s.pin} style={st.pinRow}>
              <Text style={st.pinName}>{s.name}</Text>
              <Text style={st.pinCode}>{s.pin}</Text>
            </View>
          ))}
        </View>

        {/* App Info */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>About</Text>
          <View style={s.row}>
            <Text style={s.rowText}>App Version</Text>
            <Text style={s.rowValue}>1.0.0</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowText}>Data Storage</Text>
            <Text style={s.rowValue}>Local (AsyncStorage)</Text>
          </View>
        </View>

        <Text style={s.footer}>Radiant Rue Salon Dashboard</Text>

      </ScrollView>
    </SafeAreaView>
  )
}

// Separate StyleSheet for the pin rows to avoid naming conflict with `s`
const st = StyleSheet.create({
  pinRow:  { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  pinName: { fontSize: 14, color: '#e4e4e7' },
  pinCode: { fontSize: 14, fontWeight: '700', color: GOLD, fontVariant: ['tabular-nums'] },
})

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#0f0e0c' },
  scroll:       { padding: 16, gap: 16, paddingBottom: 32 },
  heading:      { fontSize: 22, fontWeight: '700', color: '#e4e4e7' },
  section:      { backgroundColor: '#18181b', borderRadius: 16, padding: 16, gap: 2 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#71717a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  rowText:      { fontSize: 15, color: '#e4e4e7' },
  rowValue:     { fontSize: 14, color: '#71717a' },
  rowChevron:   { fontSize: 16, color: '#52525b' },
  footer:       { textAlign: 'center', color: '#3f3f46', fontSize: 12, marginTop: 16 },
})
