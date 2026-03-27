import React, { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { getServiceRecords, getStaffList } from '../../lib/storage'

const GOLD = '#e6c364'
const GOLD_DIM = '#c9a84c'
const BG = '#0f0e0c'
const SURFACE_CONTAINER = '#211f1d'
const SURFACE_LOW = '#1d1b19'
const ON_SURFACE = '#e6e2de'
const ON_SURFACE_VAR = '#d0c5b2'

export default function AdminDashboardScreen() {
  const [records, setRecords] = useState([])
  const [activeStaff, setActiveStaff] = useState([])

  useFocusEffect(
    useCallback(() => {
      let mounted = true
      ;(async () => {
        const recs = await getServiceRecords()
        const staff = await getStaffList()
        if (!mounted) return
        setRecords(recs)
        setActiveStaff(staff)
      })()
      return () => { mounted = false }
    }, [])
  )

  const services = records.filter(r => r.entry_type === 'service')
  const tips = records.filter(r => r.entry_type === 'tip')
  const totalRevenue = services.reduce((s, r) => s + Number(r.amount), 0)
  const totalTips = tips.reduce((s, r) => s + Number(r.amount), 0)
  const totalPaytm = services.filter(r => r.payment_type !== 'cash').reduce((s, r) => s + Number(r.amount), 0)
  const totalCash = services.filter(r => r.payment_type === 'cash').reduce((s, r) => s + Number(r.amount), 0)
  const paytmPct = totalRevenue > 0 ? Math.round((totalPaytm / totalRevenue) * 100) : 0

  // Leaderboard — only active staff
  const activeNames = new Set(activeStaff.map(s => s.name))
  const staffRevenue = {}
  services.forEach(r => {
    if (activeNames.has(r.staff_name)) {
      staffRevenue[r.staff_name] = (staffRevenue[r.staff_name] || 0) + Number(r.amount)
    }
  })
  const leaderboard = Object.entries(staffRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Bar chart by day
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const dayTotals = {}
  services.forEach(r => {
    const d = new Date(r.date)
    const day = days[d.getDay()]
    dayTotals[day] = (dayTotals[day] || 0) + Number(r.amount)
  })
  const maxDay = Math.max(...Object.values(dayTotals), 1)

  const fmt = (n) => n >= 100000 ? (n/100000).toFixed(1) + 'L' : n >= 1000 ? (n/1000).toFixed(1) + 'k' : n.toLocaleString('en-IN')

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>

        {/* Header */}
        <View style={s.hero}>
          <Text style={s.heroTitle}>Dashboard</Text>
          <View style={s.badges}>
            <View style={s.liveBadge}>
              <View style={s.liveDot} />
              <Text style={s.liveText}>ALL TIME</Text>
            </View>
          </View>
        </View>

        {/* KPI Cards */}
        <View style={s.kpiGrid}>
          {[
            { icon: '💰', label: 'TOTAL REVENUE', value: `₹${fmt(totalRevenue)}` },
            { icon: '✂️', label: 'SERVICES', value: `${services.length}` },
            { icon: '👥', label: 'STAFF ACTIVE', value: `${activeStaff.length}` },
            { icon: '🤝', label: 'TOTAL TIPS', value: `₹${fmt(totalTips)}` },
          ].map((kpi, i) => (
            <View key={i} style={s.kpiCard}>
              <View style={s.kpiAccent} />
              <Text style={s.kpiIcon}>{kpi.icon}</Text>
              <Text style={s.kpiLabel}>{kpi.label}</Text>
              <Text style={s.kpiValue}>{kpi.value}</Text>
            </View>
          ))}
        </View>

        {/* Revenue Chart */}
        <View style={s.chartCard}>
          <Text style={s.chartTitle}>Revenue Trend</Text>
          <Text style={s.chartSub}>Weekly distribution</Text>
          <View style={s.barChart}>
            {days.map(day => {
              const val = dayTotals[day] || 0
              const pct = maxDay > 0 ? (val / maxDay) * 100 : 0
              return (
                <View key={day} style={s.barCol}>
                  <View style={s.barTrack}>
                    <View style={[s.bar, { height: `${Math.max(pct, 3)}%` }]} />
                  </View>
                  <Text style={s.barLabel}>{day}</Text>
                </View>
              )
            })}
          </View>
        </View>

        {/* Payment Split */}
        <View style={s.chartCard}>
          <Text style={s.chartTitle}>Payment Methods</Text>
          <View style={s.splitRow}>
            <View style={s.donut}>
              <Text style={s.donutPct}>{paytmPct}%</Text>
              <Text style={s.donutLabel}>DIGITAL</Text>
            </View>
            <View style={s.splitLegend}>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: GOLD }]} />
                <Text style={s.legendText}>Online</Text>
                <Text style={s.legendValue}>₹{fmt(totalPaytm)}</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: '#363432' }]} />
                <Text style={s.legendText}>Cash</Text>
                <Text style={s.legendValue}>₹{fmt(totalCash)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <View style={s.chartCard}>
            <Text style={s.chartTitle}>Leaderboard</Text>
            <View style={s.leaderboard}>
              {leaderboard.map(([name, rev], i) => {
                const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                const badgeBg = i === 0 ? GOLD : i === 1 ? '#a1a1aa' : '#78716c'
                return (
                  <View key={name} style={s.leaderItem}>
                    <View style={s.leaderLeft}>
                      <View style={s.leaderAvatarWrap}>
                        <View style={s.leaderAvatar}>
                          <Text style={s.leaderInitials}>{initials}</Text>
                        </View>
                        <View style={[s.rankBadge, { backgroundColor: badgeBg }]}>
                          <Text style={s.rankText}>{i + 1}</Text>
                        </View>
                      </View>
                      <Text style={s.leaderName}>{name}</Text>
                    </View>
                    <Text style={s.leaderRev}>₹{fmt(rev)}</Text>
                  </View>
                )
              })}
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: BG },
  scroll:          { padding: 20, gap: 24, paddingBottom: 32 },
  hero:            { gap: 8 },
  heroTitle:       { fontSize: 28, fontWeight: '800', color: ON_SURFACE, letterSpacing: -0.5 },
  badges:          { flexDirection: 'row' },
  liveBadge:       { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: SURFACE_CONTAINER, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(77,70,55,0.1)' },
  liveDot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: GOLD },
  liveText:        { fontSize: 10, fontWeight: '600', color: ON_SURFACE_VAR, letterSpacing: 2 },
  kpiGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpiCard:         { width: '47%', backgroundColor: SURFACE_CONTAINER, padding: 20, borderRadius: 24, gap: 8, position: 'relative', overflow: 'hidden' },
  kpiAccent:       { position: 'absolute', top: 0, left: 0, width: 3, height: '100%', backgroundColor: GOLD, opacity: 0.4 },
  kpiIcon:         { fontSize: 18 },
  kpiLabel:        { fontSize: 9, color: ON_SURFACE_VAR, fontWeight: '500', letterSpacing: 2 },
  kpiValue:        { fontSize: 28, fontWeight: '700', color: ON_SURFACE, letterSpacing: -0.5 },
  chartCard:       { backgroundColor: SURFACE_CONTAINER, borderRadius: 24, padding: 24, gap: 4 },
  chartTitle:      { fontSize: 17, fontWeight: '700', color: ON_SURFACE },
  chartSub:        { fontSize: 11, color: ON_SURFACE_VAR },
  barChart:        { flexDirection: 'row', height: 180, gap: 6, marginTop: 20, alignItems: 'flex-end' },
  barCol:          { flex: 1, alignItems: 'center', gap: 6 },
  barTrack:        { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar:             { width: '100%', backgroundColor: 'rgba(230,195,100,0.15)', borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  barLabel:        { fontSize: 9, color: ON_SURFACE_VAR, fontWeight: '500' },
  splitRow:        { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 16 },
  donut:           { width: 120, height: 120, borderRadius: 60, borderWidth: 12, borderColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  donutPct:        { fontSize: 24, fontWeight: '700', color: ON_SURFACE },
  donutLabel:      { fontSize: 9, color: ON_SURFACE_VAR, letterSpacing: 2 },
  splitLegend:     { flex: 1, gap: 12 },
  legendItem:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot:       { width: 8, height: 8, borderRadius: 4 },
  legendText:      { flex: 1, fontSize: 12, color: ON_SURFACE },
  legendValue:     { fontSize: 12, fontWeight: '700', color: ON_SURFACE },
  leaderboard:     { gap: 8, marginTop: 12 },
  leaderItem:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1d1b19', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(77,70,55,0.1)' },
  leaderLeft:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  leaderAvatarWrap:{ position: 'relative' },
  leaderAvatar:    { width: 44, height: 44, borderRadius: 22, backgroundColor: GOLD_DIM, alignItems: 'center', justifyContent: 'center' },
  leaderInitials:  { fontSize: 14, fontWeight: '700', color: '#3d2e00' },
  rankBadge:       { position: 'absolute', bottom: -4, right: -4, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#1d1b19' },
  rankText:        { fontSize: 9, fontWeight: '800', color: '#000' },
  leaderName:      { fontSize: 14, fontWeight: '700', color: ON_SURFACE },
  leaderRev:       { fontSize: 14, fontWeight: '700', color: GOLD },
})
