import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, TextInput, Platform,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import {
  getStaffProfile, saveServiceRecord, saveAttendanceEvent,
  getRecordsForDate, getTodayClock, deleteServiceRecord,
  getISTDate, getISTTime,
} from '../../lib/storage'

const GOLD = '#e6c364'
const BG = '#0f0e0c'
const SURFACE_CONTAINER = '#211f1d'
const SURFACE_LOW = '#1d1b19'
const ON_SURFACE = '#e6e2de'
const ON_SURFACE_VAR = '#d0c5b2'
const OUTLINE_VAR = '#4d4637'

export default function StaffHomeScreen() {
  const [profile, setProfile]     = useState(null)
  const [clockedIn, setClockedIn] = useState(false)
  const [amount, setAmount]       = useState('')
  const [payment, setPayment]     = useState('online')
  const [entryTag, setEntryTag]   = useState('service') // 'service' | 'tip' | 'product'
  const [entries, setEntries]     = useState([])
  const [saving, setSaving]       = useState(false)
  const [todayDate, setTodayDate] = useState(getISTDate())

  const clockedInRef = useRef(false)
  const profileRef = useRef(null)

  // Sync refs
  useEffect(() => { clockedInRef.current = clockedIn }, [clockedIn])
  useEffect(() => { profileRef.current = profile }, [profile])

  // Auto-checkout at IST midnight
  useEffect(() => {
    const interval = setInterval(async () => {
      const currentIST = getISTDate()
      if (currentIST !== todayDate) {
        // Day changed — auto checkout if checked in
        if (clockedInRef.current && profileRef.current) {
          await saveAttendanceEvent({
            staff_name: profileRef.current.name,
            date: todayDate,
            login_time: null,
            logout_time: '23:59:59',
          })
          setClockedIn(false)
        }
        setTodayDate(currentIST)
        setEntries([])
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [todayDate])

  // Load data on every tab focus
  useFocusEffect(
    useCallback(() => {
      let mounted = true
      ;(async () => {
        const today = getISTDate()
        setTodayDate(today)
        const p = await getStaffProfile()
        if (!mounted) return
        setProfile(p)
        if (p) {
          const todayRecords = await getRecordsForDate(today, p.name)
          if (mounted) setEntries(todayRecords)
          const clock = await getTodayClock(p.name)
          if (mounted) setClockedIn(clock.isClockedIn)
        }
      })()
      return () => { mounted = false }
    }, [])
  )

  const services = entries.filter(e => e.entry_type === 'service')
  const tips     = entries.filter(e => e.entry_type === 'tip')
  const products = entries.filter(e => e.entry_type === 'product')
  const totalRevenue = services.reduce((s, e) => s + Number(e.amount), 0)
  const totalTips    = tips.reduce((s, e) => s + Number(e.amount), 0)
  const totalProducts = products.reduce((s, e) => s + Number(e.amount), 0)

  async function toggleCheck() {
    if (!profile) return
    const time = getISTTime()
    const type = clockedIn ? 'logout' : 'login'

    const event = {
      staff_name: profile.name,
      date: todayDate,
      login_time:  type === 'login'  ? time : null,
      logout_time: type === 'logout' ? time : null,
    }

    await saveAttendanceEvent(event)
    setClockedIn(!clockedIn)

    const msg = clockedIn ? 'Checked Out' : 'Checked In'
    const body = `${profile.name} at ${time.slice(0, 5)}`
    if (Platform.OS === 'web') { window.alert(`${msg}\n${body}`) }
    else { Alert.alert(msg, body) }
  }

  async function addEntry() {
    if (!clockedIn) {
      const msg = 'You must check in before adding entries.'
      if (Platform.OS === 'web') { window.alert(msg) }
      else { Alert.alert('Not Checked In', msg) }
      return
    }
    const num = parseFloat(amount)
    if (!num || num <= 0) {
      if (Platform.OS === 'web') { window.alert('Enter a valid amount') }
      else { Alert.alert('Invalid', 'Enter a valid amount') }
      return
    }
    if (!profile) return

    setSaving(true)
    const record = {
      staff_name: profile.name,
      date: todayDate,
      time: getISTTime(),
      amount: num,
      payment_type: payment,
      entry_type: entryTag,
      source: 'mobile',
    }

    const saved = await saveServiceRecord(record)
    if (saved) setEntries(prev => [saved, ...prev])
    setAmount('')
    setEntryTag('service')
    setSaving(false)
  }

  async function handleDeleteEntry(entry) {
    const doDelete = async () => {
      const ok = await deleteServiceRecord(entry.id)
      if (ok) setEntries(prev => prev.filter(e => e.id !== entry.id))
    }
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete ₹${entry.amount} ${entry.entry_type}?`)) doDelete()
    } else {
      Alert.alert('Delete Entry', `Delete ₹${Number(entry.amount).toLocaleString('en-IN')} ${entry.entry_type}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ])
    }
  }

  if (!profile) return null

  const firstName = profile.name.split(' ')[0]
  const dateStr = new Date().toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.greeting}>Hi, {firstName} 👋</Text>
            <Text style={s.dateText}>{dateStr}</Text>
          </View>
          <TouchableOpacity
            style={[s.checkBtn, clockedIn ? s.checkOut : s.checkIn]}
            onPress={toggleCheck}
            activeOpacity={0.8}
          >
            <Text style={[s.checkText, clockedIn ? s.checkTextOut : s.checkTextIn]}>
              {clockedIn ? 'Check Out' : 'Check In'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary Stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statIcon}>💰</Text>
            <Text style={[s.statValue, { color: GOLD }]}>₹{totalRevenue >= 1000 ? (totalRevenue/1000).toFixed(1) + 'k' : totalRevenue.toLocaleString('en-IN')}</Text>
            <Text style={s.statLabel}>REVENUE</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statIcon}>🤝</Text>
            <Text style={s.statValue}>₹{totalTips >= 1000 ? (totalTips/1000).toFixed(1) + 'k' : totalTips.toLocaleString('en-IN')}</Text>
            <Text style={s.statLabel}>TIPS</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statIcon}>🧴</Text>
            <Text style={s.statValue}>₹{totalProducts >= 1000 ? (totalProducts/1000).toFixed(1) + 'k' : totalProducts.toLocaleString('en-IN')}</Text>
            <Text style={s.statLabel}>PRODUCTS</Text>
          </View>
        </View>

        {/* Add Entry Form */}
        <View style={[s.formCard, !clockedIn && { opacity: 0.5 }]}>
          <View style={s.formHeader}>
            <Text style={s.formTitle}>Add Service/Tip</Text>
            <View style={s.paymentToggle}>
              {['online', 'cash'].map(p => (
                <TouchableOpacity
                  key={p}
                  style={[s.payToggleBtn, payment === p && s.payToggleActive]}
                  onPress={() => clockedIn && setPayment(p)}
                >
                  <Text style={[s.payToggleText, payment === p && s.payToggleTextActive]}>
                    {p === 'online' ? 'Online' : 'Cash'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View>
            <Text style={s.inputLabel}>AMOUNT (₹)</Text>
            <TextInput
              style={s.input}
              placeholder="0.00"
              placeholderTextColor="#363432"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              returnKeyType="done"
              editable={clockedIn}
            />
          </View>

          <View style={s.tagRow}>
            {[
              { key: 'service', label: 'Service' },
              { key: 'tip', label: 'Tip' },
              { key: 'product', label: 'Product' },
            ].map(t => (
              <TouchableOpacity
                key={t.key}
                style={[s.tagBtn, entryTag === t.key && s.tagBtnActive]}
                onPress={() => clockedIn && setEntryTag(t.key)}
              >
                <Text style={[s.tagText, entryTag === t.key && s.tagTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[s.addBtn, (saving || !clockedIn) && { opacity: 0.4 }]}
            onPress={addEntry}
            activeOpacity={0.8}
            disabled={saving || !clockedIn}
          >
            <Text style={s.addBtnText}>{clockedIn ? '＋  Add Entry' : 'Check In First'}</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Log */}
        {entries.length > 0 && (
          <View style={s.logSection}>
            <View style={s.logHeaderRow}>
              <Text style={s.logTitle}>TODAY'S LOG</Text>
              <View style={s.logDivider} />
            </View>
            {entries.map((e, idx) => (
              <View key={e.id || idx} style={s.logItem}>
                <View style={[s.logAccent, e.entry_type === 'tip' ? s.logAccentTip : e.entry_type === 'product' ? s.logAccentProd : s.logAccentSvc]} />
                <View style={s.logContent}>
                  <View style={s.logTopRow}>
                    <View style={[s.logBadge, e.entry_type === 'tip' ? s.logBadgeTip : e.entry_type === 'product' ? s.logBadgeProd : s.logBadgeSvc]}>
                      <Text style={[s.logBadgeText, e.entry_type === 'tip' ? s.logBadgeTextTip : e.entry_type === 'product' ? s.logBadgeTextProd : s.logBadgeTextSvc]}>
                        {e.entry_type === 'tip' ? 'TIP' : e.entry_type === 'product' ? 'PRD' : 'SVC'}
                      </Text>
                    </View>
                    <Text style={s.logDesc}>
                      {e.entry_type === 'tip' ? 'Tip' : e.entry_type === 'product' ? 'Product' : 'Service'}
                    </Text>
                  </View>
                  <Text style={s.logMeta}>
                    {e.time ? e.time.slice(0, 5) : ''} • {e.payment_type === 'cash' ? 'Cash' : 'Online'}
                  </Text>
                </View>
                <Text style={s.logAmount}>₹{Number(e.amount).toLocaleString('en-IN')}</Text>
                <TouchableOpacity style={s.deleteEntryBtn} onPress={() => handleDeleteEntry(e)}>
                  <Text style={s.deleteEntryText}>🗑</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: BG },
  scroll:           { padding: 20, gap: 24, paddingBottom: 32 },
  headerRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  greeting:         { fontSize: 22, fontWeight: '700', color: ON_SURFACE, letterSpacing: -0.5 },
  dateText:         { fontSize: 13, color: ON_SURFACE_VAR, fontWeight: '500', marginTop: 2 },
  checkBtn:         { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
  checkIn:          { backgroundColor: 'rgba(34,197,94,0.1)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' },
  checkOut:         { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  checkText:        { fontSize: 14, fontWeight: '700' },
  checkTextIn:      { color: '#22c55e' },
  checkTextOut:     { color: '#ef4444' },
  statsRow:         { flexDirection: 'row', gap: 12 },
  statCard:         { flex: 1, backgroundColor: SURFACE_CONTAINER, padding: 16, borderRadius: 20, alignItems: 'center', gap: 4 },
  statIcon:         { fontSize: 18, marginBottom: 4 },
  statValue:        { fontSize: 22, fontWeight: '700', color: ON_SURFACE },
  statLabel:        { fontSize: 9, color: ON_SURFACE_VAR, letterSpacing: 2, fontWeight: '500' },
  formCard:         { backgroundColor: SURFACE_LOW, borderRadius: 24, padding: 20, gap: 16, borderWidth: 1, borderColor: 'rgba(77,70,55,0.1)' },
  formHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  formTitle:        { fontSize: 17, fontWeight: '700', color: ON_SURFACE, letterSpacing: -0.3 },
  paymentToggle:    { flexDirection: 'row', backgroundColor: BG, borderRadius: 10, padding: 3 },
  payToggleBtn:     { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  payToggleActive:  { backgroundColor: GOLD },
  payToggleText:    { fontSize: 12, fontWeight: '700', color: ON_SURFACE_VAR },
  payToggleTextActive: { color: '#3d2e00' },
  inputLabel:       { fontSize: 9, fontWeight: '700', color: ON_SURFACE_VAR, letterSpacing: 1, marginBottom: 6 },
  input:            { backgroundColor: BG, borderRadius: 14, padding: 16, fontSize: 24, color: '#fff', fontWeight: '700' },
  tagRow:           { flexDirection: 'row', gap: 8 },
  tagBtn:           { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: OUTLINE_VAR, alignItems: 'center' },
  tagBtnActive:     { backgroundColor: GOLD, borderColor: GOLD },
  tagText:          { fontSize: 13, fontWeight: '600', color: ON_SURFACE_VAR },
  tagTextActive:    { color: '#3d2e00' },
  addBtn:           { backgroundColor: GOLD, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  addBtnText:       { color: '#3d2e00', fontWeight: '700', fontSize: 15 },
  logSection:       { gap: 12 },
  logHeaderRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logTitle:         { fontSize: 12, fontWeight: '700', color: ON_SURFACE_VAR, letterSpacing: 2 },
  logDivider:       { flex: 1, height: 1, backgroundColor: 'rgba(77,70,55,0.2)' },
  logItem:          { flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE_CONTAINER, borderRadius: 20, padding: 16, gap: 12 },
  logAccent:        { width: 3, height: 40, borderRadius: 2 },
  logAccentSvc:     { backgroundColor: GOLD },
  logAccentTip:     { backgroundColor: '#d8c598' },
  logAccentProd:    { backgroundColor: '#a78bfa' },
  logContent:       { flex: 1 },
  logTopRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logBadge:         { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99 },
  logBadgeSvc:      { backgroundColor: 'rgba(201,168,76,0.2)' },
  logBadgeTip:      { backgroundColor: 'rgba(216,197,152,0.2)' },
  logBadgeProd:     { backgroundColor: 'rgba(167,139,250,0.2)' },
  logBadgeText:     { fontSize: 9, fontWeight: '700', letterSpacing: -0.3 },
  logBadgeTextSvc:  { color: GOLD },
  logBadgeTextTip:  { color: '#d8c598' },
  logBadgeTextProd: { color: '#a78bfa' },
  logDesc:          { fontSize: 14, fontWeight: '700', color: ON_SURFACE },
  logMeta:          { fontSize: 11, color: ON_SURFACE_VAR, marginTop: 2 },
  logAmount:        { fontSize: 17, fontWeight: '700', color: ON_SURFACE },
  deleteEntryBtn:   { padding: 8, marginLeft: 4, backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 10, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  deleteEntryText:  { fontSize: 15 },
})
