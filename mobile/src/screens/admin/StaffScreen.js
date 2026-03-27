import React, { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, SafeAreaView,
  FlatList, TouchableOpacity, Alert,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import {
  getAllStaffNames, getStaffStats, deleteStaffRecords,
} from '../../lib/storage'

const GOLD = '#C9A84C'

export default function AdminStaffScreen() {
  const [staffList, setStaffList] = useState([])
  const [loading, setLoading]     = useState(true)

  const loadStaff = useCallback(async () => {
    setLoading(true)
    const names = await getAllStaffNames()
    const list = []
    for (const name of names) {
      const stats = await getStaffStats(name)
      list.push({ name, ...stats })
    }
    list.sort((a, b) => b.totalRevenue - a.totalRevenue)
    setStaffList(list)
    setLoading(false)
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadStaff()
    }, [loadStaff])
  )

  function confirmDelete(name) {
    Alert.alert(
      'Delete Staff Records',
      `Delete all records for ${name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            await deleteStaffRecords(name)
            await loadStaff()
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <FlatList
        data={staffList}
        keyExtractor={item => item.name}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          !loading && (
            <View style={s.empty}>
              <Text style={s.emptyText}>No staff data yet</Text>
              <Text style={s.emptyHint}>Staff will appear here once they log entries</Text>
            </View>
          )
        }
        ListHeaderComponent={
          <Text style={s.heading}>Staff ({staffList.length})</Text>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.avatarSmall}>
                <Text style={s.avatarText}>{item.name.charAt(0)}</Text>
              </View>
              <View style={s.nameCol}>
                <Text style={s.staffName}>{item.name}</Text>
                <Text style={s.staffSub}>
                  {item.daysWorked} days worked · {item.totalServices} services
                </Text>
              </View>
              <TouchableOpacity
                style={s.deleteBtn}
                onPress={() => confirmDelete(item.name)}
              >
                <Text style={s.deleteText}>🗑</Text>
              </TouchableOpacity>
            </View>

            <View style={s.statsRow}>
              <Stat label="Revenue" value={`₹${item.totalRevenue.toLocaleString('en-IN')}`} gold />
              <Stat label="Tips" value={`₹${item.totalTips.toLocaleString('en-IN')}`} />
              <Stat label="Cash" value={`₹${item.totalCash.toLocaleString('en-IN')}`} />
              <Stat label="Paytm" value={`₹${item.totalPaytm.toLocaleString('en-IN')}`} />
            </View>

            {item.totalServices > 0 && (
              <Text style={s.avgText}>
                Avg ₹{Math.round(item.totalRevenue / item.totalServices).toLocaleString('en-IN')}/service
              </Text>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  )
}

function Stat({ label, value, gold }) {
  return (
    <View style={s.stat}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={[s.statValue, gold && { color: GOLD }]}>{value}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#0f0e0c' },
  list:        { padding: 16, gap: 12, paddingBottom: 24 },
  heading:     { fontSize: 22, fontWeight: '700', color: '#e4e4e7', marginBottom: 8 },
  card:        { backgroundColor: '#18181b', borderRadius: 16, padding: 16, gap: 12 },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  avatarText:  { fontSize: 18, fontWeight: '700', color: '#0f0e0c' },
  nameCol:     { flex: 1 },
  staffName:   { fontSize: 16, fontWeight: '700', color: '#e4e4e7' },
  staffSub:    { fontSize: 12, color: '#71717a', marginTop: 2 },
  deleteBtn:   { padding: 8 },
  deleteText:  { fontSize: 18 },
  statsRow:    { flexDirection: 'row', gap: 8 },
  stat:        { flex: 1, backgroundColor: '#27272a', borderRadius: 8, padding: 10, alignItems: 'center' },
  statLabel:   { fontSize: 10, color: '#71717a', marginBottom: 2 },
  statValue:   { fontSize: 13, fontWeight: '700', color: '#e4e4e7' },
  avgText:     { fontSize: 12, color: '#71717a', textAlign: 'center' },
  empty:       { alignItems: 'center', paddingTop: 60 },
  emptyText:   { fontSize: 16, fontWeight: '600', color: '#52525b' },
  emptyHint:   { fontSize: 13, color: '#3f3f46', marginTop: 6 },
})
