import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, TextInput,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import {
  getStaffProfile, saveServiceRecord, saveAttendanceEvent,
  getRecordsForDate, getTodayClock,
} from '../../lib/storage'

const GOLD = '#C9A84C'

export default function StaffHomeScreen() {
  const [profile, setProfile]     = useState(null)
  const [clockedIn, setClockedIn] = useState(false)
  const [amount, setAmount]       = useState('')
  const [payment, setPayment]     = useState('paytm')
  const [isTip, setIsTip]         = useState(false)
  const [entries, setEntries]     = useState([])
  const [saving, setSaving]       = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  // Load profile and today's data
  useFocusEffect(
    useCallback(() => {
      let mounted = true
      ;(async () => {
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
    }, [today])
  )

  const services = entries.filter(e => e.entry_type === 'service')
  const tips     = entries.filter(e => e.entry_type === 'tip')
  const totalRevenue = services.reduce((s, e) => s + e.amount, 0)
  const totalTips    = tips.reduce((s, e) => s + e.amount, 0)

  async function toggleClock() {
    if (!profile) return
    const time = new Date().toTimeString().slice(0, 8)
    const type = clockedIn ? 'logout' : 'login'

    const event = {
      id: Date.now().toString(),
      staff_name: profile.name,
      date: today,
      login_time:  type === 'login'  ? time : null,
      logout_time: type === 'logout' ? time : null,
    }

    await saveAttendanceEvent(event)
    setClockedIn(!clockedIn)

    Alert.alert(
      clockedIn ? 'Clocked Out' : 'Clocked In',
      `${profile.name} at ${time.slice(0, 5)}`
    )
  }

  async function addEntry() {
    const num = parseFloat(amount)
    if (!num || num <= 0) { Alert.alert('Invalid', 'Enter a valid amount'); return }
    if (!profile) return

    setSaving(true)
    const record = {
      id: Date.now().toString(),
      staff_name: profile.name,
      date: today,
      time: new Date().toTimeString().slice(0, 8),
      amount: num,
      payment_type: payment,
      entry_type: isTip ? 'tip' : 'service',
      source: 'mobile',
    }

    await saveServiceRecord(record)
    setEntries(prev => [record, ...prev])
    setAmount('')
    setIsTip(false)
    setSaving(false)
  }

  if (!profile) return null

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <Text style={s.greeting}>Hi, {profile.name.split(' ')[0]} 👋</Text>
        <Text style={s.dateText}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>

        {/* Clock In/Out */}
        <TouchableOpacity
          style={[s.clockBtn, clockedIn ? s.clockOut : s.clockIn]}
          onPress={toggleClock}
          activeOpacity={0.8}
        >
          <Text style={s.clockText}>{clockedIn ? '🔴  Clock Out' : '🟢  Clock In'}</Text>
        </TouchableOpacity>

        {/* Today summary */}
        <View style={s.summaryRow}>
          <StatCard label="Services" value={services.length} />
          <StatCard label="Revenue" value={`₹${totalRevenue.toLocaleString('en-IN')}`} gold />
          <StatCard label="Tips" value={`₹${totalTips.toLocaleString('en-IN')}`} />
        </View>

        {/* Add entry form */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Add Service / Tip</Text>

          <TextInput
            style={s.input}
            placeholder="Amount (₹)"
            placeholderTextColor="#52525b"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            returnKeyType="done"
          />

          <View style={s.toggleRow}>
            {['paytm', 'cash'].map(p => (
              <TouchableOpacity
                key={p}
                style={[s.toggleBtn, payment === p && s.toggleActive]}
                onPress={() => setPayment(p)}
              >
                <Text style={[s.toggleText, payment === p && s.toggleTextActive]}>
                  {p === 'paytm' ? '📱 Paytm' : '💵 Cash'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={s.tipRow} onPress={() => setIsTip(t => !t)}>
            <View style={[s.checkbox, isTip && s.checkboxOn]}>
              {isTip && <Text style={s.checkmark}>✓</Text>}
            </View>
            <Text style={s.tipLabel}>This is a tip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.addBtn, saving && { opacity: 0.6 }]}
            onPress={addEntry}
            activeOpacity={0.8}
            disabled={saving}
          >
            <Text style={s.addBtnText}>Add Entry</Text>
          </TouchableOpacity>
        </View>

        {/* Today's entries */}
        {entries.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Today's Log ({entries.length})</Text>
            {entries.map(e => (
              <View key={e.id} style={s.entryRow}>
                <View style={[s.entryBadge, e.entry_type === 'tip' ? s.tipBadge : s.svcBadge]}>
                  <Text style={s.entryBadgeText}>{e.entry_type === 'tip' ? 'TIP' : 'SVC'}</Text>
                </View>
                <Text style={s.entryAmt}>₹{e.amount.toLocaleString('en-IN')}</Text>
                <Text style={[s.entryPay, e.payment_type === 'cash' ? s.cashColor : s.paytmColor]}>
                  {e.payment_type}
                </Text>
                <Text style={s.entryTime}>{e.time.slice(0, 5)}</Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  )
}

function StatCard({ label, value, gold }) {
  return (
    <View style={s.stat}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={[s.statValue, gold && { color: GOLD }]}>{value}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: '#0f0e0c' },
  scroll:           { padding: 16, gap: 14, paddingBottom: 24 },
  greeting:         { fontSize: 20, fontWeight: '700', color: '#e4e4e7' },
  dateText:         { fontSize: 13, color: '#71717a', marginBottom: 4 },
  clockBtn:         { borderRadius: 16, paddingVertical: 20, alignItems: 'center' },
  clockIn:          { backgroundColor: '#14532d' },
  clockOut:         { backgroundColor: '#450a0a' },
  clockText:        { fontSize: 18, fontWeight: '700', color: '#fff' },
  summaryRow:       { flexDirection: 'row', gap: 10 },
  stat:             { flex: 1, backgroundColor: '#18181b', borderRadius: 12, padding: 12, alignItems: 'center' },
  statLabel:        { fontSize: 11, color: '#71717a', marginBottom: 4 },
  statValue:        { fontSize: 16, fontWeight: '700', color: '#e4e4e7' },
  card:             { backgroundColor: '#18181b', borderRadius: 16, padding: 16, gap: 12 },
  cardTitle:        { fontSize: 15, fontWeight: '600', color: '#e4e4e7', marginBottom: 2 },
  input:            { backgroundColor: '#27272a', borderRadius: 10, padding: 14, fontSize: 20, color: '#fff', fontWeight: '600' },
  toggleRow:        { flexDirection: 'row', gap: 10 },
  toggleBtn:        { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#3f3f46', alignItems: 'center' },
  toggleActive:     { backgroundColor: GOLD + '22', borderColor: GOLD },
  toggleText:       { color: '#71717a', fontWeight: '600', fontSize: 14 },
  toggleTextActive: { color: GOLD },
  tipRow:           { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox:         { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: '#3f3f46', alignItems: 'center', justifyContent: 'center' },
  checkboxOn:       { backgroundColor: GOLD, borderColor: GOLD },
  checkmark:        { color: '#0f0e0c', fontSize: 13, fontWeight: '700' },
  tipLabel:         { color: '#a1a1aa', fontSize: 14 },
  addBtn:           { backgroundColor: GOLD, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  addBtnText:       { color: '#0f0e0c', fontWeight: '700', fontSize: 16 },
  entryRow:         { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  entryBadge:       { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  svcBadge:         { backgroundColor: '#27272a' },
  tipBadge:         { backgroundColor: '#14532d' },
  entryBadgeText:   { fontSize: 10, fontWeight: '700', color: '#71717a' },
  entryAmt:         { flex: 1, fontSize: 15, fontWeight: '600', color: '#e4e4e7' },
  entryPay:         { fontSize: 12 },
  paytmColor:       { color: '#60a5fa' },
  cashColor:        { color: '#d97706' },
  entryTime:        { fontSize: 12, color: '#52525b' },
})
