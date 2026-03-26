import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, TextInput,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const GOLD = '#C9A84C'

export default function StaffHomeScreen() {
  const [clockedIn, setClockedIn] = useState(false)
  const [amount, setAmount]       = useState('')
  const [payment, setPayment]     = useState('paytm') // 'paytm' | 'cash'
  const [isTip, setIsTip]         = useState(false)
  const [todayEntries, setTodayEntries] = useState([])

  const today = new Date().toISOString().slice(0, 10)
  const totalToday = todayEntries
    .filter(e => e.entry_type === 'service')
    .reduce((s, e) => s + e.amount, 0)

  async function toggleClock() {
    const type = clockedIn ? 'logout' : 'login'
    const time = new Date().toTimeString().slice(0, 8)

    // TODO: save to Supabase attendance table
    console.log(`Attendance: ${type} at ${time}`)
    setClockedIn(!clockedIn)
    Alert.alert(clockedIn ? 'Clocked Out' : 'Clocked In', `Time: ${time}`)
  }

  async function addEntry() {
    const num = parseFloat(amount)
    if (!num || num <= 0) { Alert.alert('Enter a valid amount'); return }

    const entry = {
      id: Date.now().toString(),
      staff_name: 'Staff', // TODO: get from auth context
      date: today,
      time: new Date().toTimeString().slice(0, 8),
      amount: num,
      payment_type: payment,
      entry_type: isTip ? 'tip' : 'service',
      source: 'mobile',
    }

    // TODO: save to Supabase
    setTodayEntries(prev => [entry, ...prev])
    setAmount('')
    setIsTip(false)
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>

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
          <Stat label="Services" value={todayEntries.filter(e => e.entry_type === 'service').length} />
          <Stat label="Total Today" value={`₹${totalToday.toLocaleString('en-IN')}`} gold />
          <Stat label="Tips" value={`₹${todayEntries.filter(e=>e.entry_type==='tip').reduce((s,e)=>s+e.amount,0)}`} />
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
          />

          {/* Payment toggle */}
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

          {/* Tip checkbox */}
          <TouchableOpacity style={s.tipRow} onPress={() => setIsTip(t => !t)}>
            <View style={[s.checkbox, isTip && s.checkboxOn]} />
            <Text style={s.tipLabel}>This is a tip</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.addBtn} onPress={addEntry} activeOpacity={0.8}>
            <Text style={s.addBtnText}>Add Entry</Text>
          </TouchableOpacity>
        </View>

        {/* Today's entries */}
        {todayEntries.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Today's Log</Text>
            {todayEntries.map(e => (
              <View key={e.id} style={s.entryRow}>
                <Text style={s.entryType}>{e.entry_type === 'tip' ? 'TIP' : 'SVC'}</Text>
                <Text style={s.entryAmt}>₹{e.amount}</Text>
                <Text style={s.entryPay}>{e.payment_type}</Text>
                <Text style={s.entryTime}>{e.time.slice(0,5)}</Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
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
  safe:            { flex: 1, backgroundColor: '#0f0e0c' },
  scroll:          { padding: 16, gap: 14 },
  clockBtn:        { borderRadius: 16, paddingVertical: 20, alignItems: 'center' },
  clockIn:         { backgroundColor: '#14532d' },
  clockOut:        { backgroundColor: '#450a0a' },
  clockText:       { fontSize: 18, fontWeight: '700', color: '#fff' },
  summaryRow:      { flexDirection: 'row', gap: 10 },
  stat:            { flex: 1, backgroundColor: '#18181b', borderRadius: 12, padding: 12, alignItems: 'center' },
  statLabel:       { fontSize: 11, color: '#71717a', marginBottom: 4 },
  statValue:       { fontSize: 16, fontWeight: '700', color: '#e4e4e7' },
  card:            { backgroundColor: '#18181b', borderRadius: 16, padding: 16, gap: 12 },
  cardTitle:       { fontSize: 15, fontWeight: '600', color: '#e4e4e7', marginBottom: 4 },
  input:           { backgroundColor: '#27272a', borderRadius: 10, padding: 14, fontSize: 18, color: '#fff', fontWeight: '600' },
  toggleRow:       { flexDirection: 'row', gap: 10 },
  toggleBtn:       { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#3f3f46', alignItems: 'center' },
  toggleActive:    { backgroundColor: GOLD + '22', borderColor: GOLD },
  toggleText:      { color: '#71717a', fontWeight: '600' },
  toggleTextActive:{ color: GOLD },
  tipRow:          { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox:        { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#3f3f46' },
  checkboxOn:      { backgroundColor: GOLD, borderColor: GOLD },
  tipLabel:        { color: '#a1a1aa', fontSize: 14 },
  addBtn:          { backgroundColor: GOLD, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  addBtnText:      { color: '#0f0e0c', fontWeight: '700', fontSize: 16 },
  entryRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  entryType:       { width: 36, fontSize: 10, fontWeight: '700', color: '#71717a' },
  entryAmt:        { flex: 1, fontSize: 15, fontWeight: '600', color: '#e4e4e7' },
  entryPay:        { fontSize: 12, color: '#60a5fa' },
  entryTime:       { fontSize: 12, color: '#52525b' },
})
