import React, { useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { getStaffProfile, getStaffStats, clearRole } from '../../lib/storage'

const GOLD = '#C9A84C'

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null)
  const [stats, setStats]     = useState(null)

  useFocusEffect(
    useCallback(() => {
      let mounted = true
      ;(async () => {
        const p = await getStaffProfile()
        if (!mounted || !p) return
        setProfile(p)
        const s = await getStaffStats(p.name)
        if (mounted) setStats(s)
      })()
      return () => { mounted = false }
    }, [])
  )

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          await clearRole()
          // RootNavigator polls role — we need to trigger a re-render
          // For now we rely on the user's app restart or a navigation reset
        },
      },
    ])
  }

  if (!profile) return null

  const initial = profile.name.charAt(0).toUpperCase()

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>

        {/* Avatar + Name */}
        <View style={s.header}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initial}</Text>
          </View>
          <Text style={s.name}>{profile.name}</Text>
          <Text style={s.role}>Staff Member</Text>
        </View>

        {/* Stats Grid */}
        {stats && (
          <View style={s.card}>
            <Text style={s.cardTitle}>My Performance</Text>
            <View style={s.grid}>
              <StatBox label="Services"   value={stats.totalServices} />
              <StatBox label="Revenue"    value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`} gold />
              <StatBox label="Tips"       value={`₹${stats.totalTips.toLocaleString('en-IN')}`} />
              <StatBox label="Days Worked" value={stats.daysWorked} />
              <StatBox label="Cash"       value={`₹${stats.totalCash.toLocaleString('en-IN')}`} />
              <StatBox label="Paytm"      value={`₹${stats.totalPaytm.toLocaleString('en-IN')}`} />
            </View>
          </View>
        )}

        {/* Avg per service */}
        {stats && stats.totalServices > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Averages</Text>
            <View style={s.avgRow}>
              <View style={s.avgItem}>
                <Text style={s.avgLabel}>Per Service</Text>
                <Text style={s.avgValue}>
                  ₹{Math.round(stats.totalRevenue / stats.totalServices).toLocaleString('en-IN')}
                </Text>
              </View>
              {stats.daysWorked > 0 && (
                <View style={s.avgItem}>
                  <Text style={s.avgLabel}>Per Day</Text>
                  <Text style={s.avgValue}>
                    ₹{Math.round(stats.totalRevenue / stats.daysWorked).toLocaleString('en-IN')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  )
}

function StatBox({ label, value, gold }) {
  return (
    <View style={s.statBox}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={[s.statValue, gold && { color: GOLD }]}>{value}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#0f0e0c' },
  scroll:     { padding: 16, gap: 16, paddingBottom: 32 },
  header:     { alignItems: 'center', gap: 6, marginBottom: 8 },
  avatar:     { width: 80, height: 80, borderRadius: 40, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#0f0e0c' },
  name:       { fontSize: 22, fontWeight: '700', color: '#e4e4e7' },
  role:       { fontSize: 13, color: '#71717a' },
  card:       { backgroundColor: '#18181b', borderRadius: 16, padding: 16, gap: 12 },
  cardTitle:  { fontSize: 15, fontWeight: '600', color: '#e4e4e7' },
  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox:    { width: '30%', backgroundColor: '#27272a', borderRadius: 10, padding: 12, alignItems: 'center' },
  statLabel:  { fontSize: 11, color: '#71717a', marginBottom: 4 },
  statValue:  { fontSize: 15, fontWeight: '700', color: '#e4e4e7' },
  avgRow:     { flexDirection: 'row', gap: 12 },
  avgItem:    { flex: 1, backgroundColor: '#27272a', borderRadius: 10, padding: 14, alignItems: 'center' },
  avgLabel:   { fontSize: 11, color: '#71717a', marginBottom: 4 },
  avgValue:   { fontSize: 18, fontWeight: '700', color: GOLD },
  logoutBtn:  { alignSelf: 'center', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ef4444', marginTop: 8 },
  logoutText: { color: '#ef4444', fontWeight: '600', fontSize: 15 },
})
