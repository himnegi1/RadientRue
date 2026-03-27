import React, { useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, Platform,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { getStaffProfile, getWeeklySettlement, clearRole } from '../../lib/storage'

const GOLD = '#e6c364'
const BG = '#0f0e0c'
const SURFACE_LOW = '#1d1b19'
const ON_SURFACE = '#e6e2de'
const ON_SURFACE_VAR = '#d0c5b2'

export default function ProfileScreen({ onLogout }) {
  const [profile, setProfile] = useState(null)
  const [settlement, setSettlement] = useState(null)

  useFocusEffect(
    useCallback(() => {
      let mounted = true
      ;(async () => {
        const p = await getStaffProfile()
        if (!mounted || !p) return
        setProfile(p)
        const s = await getWeeklySettlement(p.name)
        if (mounted) setSettlement(s)
      })()
      return () => { mounted = false }
    }, [])
  )

  async function handleLogout() {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        await clearRole()
        if (onLogout) onLogout()
      }
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout', style: 'destructive',
          onPress: async () => {
            await clearRole()
            if (onLogout) onLogout()
          },
        },
      ])
    }
  }

  if (!profile) return null

  const initial = profile.name.charAt(0).toUpperCase()

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  function formatDay(dateStr) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-IN', { weekday: 'short' })
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>

        {/* Profile Header */}
        <View style={s.header}>
          <View style={s.avatarRing}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initial}</Text>
            </View>
          </View>
          <Text style={s.name}>{profile.name}</Text>
          <Text style={s.role}>Staff Member</Text>
        </View>

        {/* Weekly Settlement */}
        {settlement && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>WEEKLY SETTLEMENT</Text>
              <Text style={s.weekRange}>
                {formatDate(settlement.weekStart)} – {formatDate(settlement.weekEnd)}
              </Text>
            </View>

            {/* Total Payout */}
            <View style={s.payoutCard}>
              <Text style={s.payoutLabel}>DUE NEXT MONDAY</Text>
              <Text style={s.payoutValue}>₹{settlement.totalPayout.toLocaleString('en-IN')}</Text>
              <Text style={s.payoutDate}>{formatDate(settlement.payDay)}</Text>
            </View>

            {/* Breakdown */}
            <View style={s.breakdownGrid}>
              {/* Target */}
              <View style={s.breakdownCard}>
                <Text style={s.breakdownIcon}>🎯</Text>
                <Text style={s.breakdownLabel}>TARGET BONUS</Text>
                <Text style={s.breakdownValue}>₹{settlement.targetBonus.toLocaleString('en-IN')}</Text>
                <Text style={s.breakdownHint}>10% on days ≥ ₹3,000</Text>
              </View>

              {/* Tips */}
              <View style={s.breakdownCard}>
                <Text style={s.breakdownIcon}>🤝</Text>
                <Text style={s.breakdownLabel}>TIPS</Text>
                <Text style={s.breakdownValue}>₹{settlement.totalTips.toLocaleString('en-IN')}</Text>
                <Text style={s.breakdownHint}>From logged tips</Text>
              </View>

              {/* Products */}
              <View style={s.breakdownCard}>
                <Text style={s.breakdownIcon}>🧴</Text>
                <Text style={s.breakdownLabel}>PRODUCTS</Text>
                <Text style={s.breakdownValue}>₹{(settlement.productBonus || 0).toLocaleString('en-IN')}</Text>
                <Text style={s.breakdownHint}>{settlement.productCount || 0} sold × ₹30</Text>
              </View>

              {/* OT */}
              <View style={s.breakdownCard}>
                <Text style={s.breakdownIcon}>⏰</Text>
                <Text style={s.breakdownLabel}>OVERTIME</Text>
                <Text style={s.breakdownValue}>₹{(settlement.otAmount || 0).toLocaleString('en-IN')}</Text>
                <Text style={s.breakdownHint}>Entered by admin</Text>
              </View>
            </View>

            {/* Daily Target Breakdown */}
            {settlement.dailyBreakdown.length > 0 && (
              <View style={s.dailyCard}>
                <Text style={s.dailyTitle}>DAILY TARGET</Text>
                {settlement.dailyBreakdown.map(day => (
                  <View key={day.date} style={s.dailyRow}>
                    <Text style={s.dailyDay}>{formatDay(day.date)}</Text>
                    <Text style={s.dailyDate}>{formatDate(day.date)}</Text>
                    <Text style={[s.dailyTotal, day.qualified && { color: GOLD }]}>
                      ₹{day.total.toLocaleString('en-IN')}
                    </Text>
                    {day.qualified ? (
                      <Text style={s.dailyBonus}>+₹{day.bonus}</Text>
                    ) : (
                      <Text style={s.dailyMiss}>—</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>⎋  LOGOUT</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: BG },
  scroll:          { padding: 20, gap: 24, paddingBottom: 32 },
  header:          { alignItems: 'center', gap: 8, marginBottom: 8 },
  avatarRing:      { position: 'relative' },
  avatar:          { width: 96, height: 96, borderRadius: 48, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: GOLD },
  avatarText:      { fontSize: 40, fontWeight: '800', color: '#3d2e00' },
  name:            { fontSize: 30, fontWeight: '700', color: ON_SURFACE, letterSpacing: -0.5 },
  role:            { fontSize: 14, color: '#71717a', fontWeight: '500' },

  section:         { gap: 12 },
  sectionHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  sectionTitle:    { fontSize: 11, fontWeight: '700', color: '#71717a', letterSpacing: 2 },
  weekRange:       { fontSize: 11, fontWeight: '700', color: GOLD },

  payoutCard:      { backgroundColor: SURFACE_LOW, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: GOLD + '33' },
  payoutLabel:     { fontSize: 9, color: ON_SURFACE_VAR, letterSpacing: 2, fontWeight: '700' },
  payoutValue:     { fontSize: 36, fontWeight: '800', color: GOLD, marginTop: 4, letterSpacing: -1 },
  payoutDate:      { fontSize: 12, color: ON_SURFACE_VAR, marginTop: 4 },

  breakdownGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  breakdownCard:   { width: '47%', backgroundColor: SURFACE_LOW, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#27272a' },
  breakdownIcon:   { fontSize: 18, marginBottom: 8 },
  breakdownLabel:  { fontSize: 9, color: '#71717a', letterSpacing: 1.5, marginBottom: 4 },
  breakdownValue:  { fontSize: 20, fontWeight: '700', color: ON_SURFACE },
  breakdownHint:   { fontSize: 10, color: '#52525b', marginTop: 4 },

  dailyCard:       { backgroundColor: SURFACE_LOW, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#27272a' },
  dailyTitle:      { fontSize: 9, color: '#71717a', letterSpacing: 1.5, marginBottom: 12, fontWeight: '700' },
  dailyRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#27272a', gap: 8 },
  dailyDay:        { fontSize: 12, fontWeight: '600', color: ON_SURFACE_VAR, width: 36 },
  dailyDate:       { fontSize: 12, color: '#52525b', flex: 1 },
  dailyTotal:      { fontSize: 14, fontWeight: '700', color: ON_SURFACE, width: 70, textAlign: 'right' },
  dailyBonus:      { fontSize: 12, fontWeight: '700', color: '#22c55e', width: 55, textAlign: 'right' },
  dailyMiss:       { fontSize: 12, color: '#52525b', width: 55, textAlign: 'right' },

  logoutBtn:       { alignSelf: 'stretch', paddingVertical: 16, borderRadius: 14, borderWidth: 1, borderColor: '#ffb4ab', alignItems: 'center', marginTop: 8 },
  logoutText:      { color: '#ffb4ab', fontWeight: '700', fontSize: 13, letterSpacing: 2 },
})
