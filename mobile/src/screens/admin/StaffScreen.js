import React, { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, SafeAreaView,
  FlatList, TouchableOpacity, Alert, TextInput, Platform, Switch,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import {
  getAllStaff, getAllStaffStatsBatch, saveOTRecord, getOTRecord, getWeekStart, getISTDate,
} from '../../lib/storage'

const GOLD = '#e6c364'
const BG = '#0f0e0c'
const ON_SURFACE = '#e6e2de'
const ON_SURFACE_VAR = '#d0c5b2'

export default function AdminStaffScreen() {
  const [staffList, setStaffList] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showDisabled, setShowDisabled] = useState(false)
  const [otInputs, setOtInputs]   = useState({}) // { staffName: hours }

  const weekStart = getWeekStart(getISTDate())

  const loadStaff = useCallback(async () => {
    setLoading(true)
    const [allStaff, statsMap] = await Promise.all([
      getAllStaff(),
      getAllStaffStatsBatch(),
    ])
    const otPromises = allStaff.map(s => getOTRecord(s.name, weekStart))
    const otResults = await Promise.all(otPromises)
    const list = allStaff.map((staff, i) => ({
      ...staff,
      ...(statsMap[staff.name] || { totalServices: 0, totalRevenue: 0, totalTips: 0, totalProducts: 0, daysWorked: 0 }),
      otAmount: otResults[i] ? Number(otResults[i].ot_hours) : 0,
    }))
    list.sort((a, b) => b.totalRevenue - a.totalRevenue)
    setStaffList(list)
    setLoading(false)
  }, [weekStart])

  useFocusEffect(useCallback(() => { loadStaff() }, [loadStaff]))

  async function handleSaveOT(staffName) {
    const amt = parseFloat(otInputs[staffName])
    if (isNaN(amt) || amt < 0) return
    await saveOTRecord(staffName, weekStart, amt)
    setOtInputs(prev => ({ ...prev, [staffName]: undefined }))
    if (Platform.OS === 'web') window.alert(`OT saved: ₹${amt} for ${staffName}`)
    else Alert.alert('OT Saved', `₹${amt} for ${staffName}`)
    loadStaff()
  }

  const activeStaff = staffList.filter(s => s.active)
  const disabledStaff = staffList.filter(s => !s.active)
  const displayList = showDisabled ? staffList : activeStaff

  return (
    <SafeAreaView style={s.safe}>
      <FlatList
        data={displayList}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={!loading && <View style={s.empty}><Text style={s.emptyText}>No staff data</Text></View>}
        ListHeaderComponent={
          <View style={s.header}>
            <Text style={s.heading}>Staff ({activeStaff.length})</Text>
            {disabledStaff.length > 0 && (
              <View style={s.toggleRow}>
                <Text style={s.toggleLabel}>Show disabled</Text>
                <Switch
                  value={showDisabled}
                  onValueChange={setShowDisabled}
                  trackColor={{ false: '#27272a', true: GOLD + '55' }}
                  thumbColor={showDisabled ? GOLD : '#52525b'}
                />
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const isDisabled = !item.active
          const fmt = n => n >= 1000 ? (n/1000).toFixed(1)+'k' : n.toLocaleString('en-IN')
          return (
            <View style={[s.card, isDisabled && { opacity: 0.5 }]}>
              <View style={s.cardHeader}>
                <View style={s.avatarSmall}>
                  <Text style={s.avatarText}>{item.name.charAt(0)}</Text>
                </View>
                <View style={s.nameCol}>
                  <View style={s.nameRow}>
                    <Text style={s.staffName}>{item.name}</Text>
                    {isDisabled && <Text style={s.disabledBadge}>DISABLED</Text>}
                  </View>
                  <Text style={s.staffSub}>
                    {item.daysWorked} days · {item.totalServices} services
                  </Text>
                </View>
              </View>
              <View style={s.statsRow}>
                <Stat label="Revenue" value={`₹${fmt(item.totalRevenue)}`} gold />
                <Stat label="Tips" value={`₹${fmt(item.totalTips)}`} />
                <Stat label="Products" value={`₹${fmt(item.totalProducts || 0)}`} />
              </View>
              {/* OT Entry */}
              {!isDisabled && (
                <View style={s.otRow}>
                  <Text style={s.otLabel}>OT this week: ₹{item.otAmount.toLocaleString('en-IN')}</Text>
                  <TextInput
                    style={s.otInput}
                    placeholder="₹"
                    placeholderTextColor="#52525b"
                    keyboardType="numeric"
                    value={otInputs[item.name] ?? ''}
                    onChangeText={v => setOtInputs(prev => ({ ...prev, [item.name]: v }))}
                  />
                  <TouchableOpacity style={s.otBtn} onPress={() => handleSaveOT(item.name)}>
                    <Text style={s.otBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )
        }}
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
  safe:          { flex: 1, backgroundColor: BG },
  list:          { padding: 16, gap: 12, paddingBottom: 24 },
  header:        { gap: 8, marginBottom: 8 },
  heading:       { fontSize: 22, fontWeight: '700', color: ON_SURFACE },
  toggleRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLabel:   { fontSize: 13, color: ON_SURFACE_VAR },
  card:          { backgroundColor: '#18181b', borderRadius: 16, padding: 16, gap: 12 },
  cardHeader:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarSmall:   { width: 40, height: 40, borderRadius: 20, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  avatarText:    { fontSize: 18, fontWeight: '700', color: '#0f0e0c' },
  nameCol:       { flex: 1 },
  nameRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  staffName:     { fontSize: 16, fontWeight: '700', color: ON_SURFACE },
  disabledBadge: { fontSize: 9, fontWeight: '700', color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  staffSub:      { fontSize: 12, color: '#71717a', marginTop: 2 },
  statsRow:      { flexDirection: 'row', gap: 8 },
  stat:          { flex: 1, backgroundColor: '#27272a', borderRadius: 8, padding: 10, alignItems: 'center' },
  statLabel:     { fontSize: 10, color: '#71717a', marginBottom: 2 },
  statValue:     { fontSize: 13, fontWeight: '700', color: ON_SURFACE },
  otRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: '#27272a', paddingTop: 10 },
  otLabel:       { flex: 1, fontSize: 12, color: ON_SURFACE_VAR },
  otInput:       { backgroundColor: '#27272a', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, width: 70, fontSize: 13, color: '#fff', textAlign: 'center' },
  otBtn:         { backgroundColor: GOLD + '33', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  otBtnText:     { fontSize: 12, fontWeight: '700', color: GOLD },
  empty:         { alignItems: 'center', paddingTop: 60 },
  emptyText:     { fontSize: 16, fontWeight: '600', color: '#52525b' },
})
