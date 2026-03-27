import React, { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import {
  getServiceRecords, getAttendance, getAllStaffNames,
} from '../../lib/storage'

const GOLD = '#C9A84C'

export default function AdminDashboardScreen() {
  const [todayStats, setTodayStats] = useState(null)
  const [monthStats, setMonthStats] = useState(null)
  const [staffToday, setStaffToday] = useState([])

  const today = new Date().toISOString().slice(0, 10)
  const month = today.slice(0, 7) // YYYY-MM

  useFocusEffect(
    useCallback(() => {
      let mounted = true
      ;(async () => {
        const records = await getServiceRecords()
        const attendance = await getAttendance()

        if (!mounted) return

        // Today
        const todayRecs = records.filter(r => r.date === today)
        const todaySvc  = todayRecs.filter(r => r.entry_type === 'service')
        const todayTips = todayRecs.filter(r => r.entry_type === 'tip')
        setTodayStats({
          services: todaySvc.length,
          revenue:  todaySvc.reduce((s, r) => s + r.amount, 0),
          tips:     todayTips.reduce((s, r) => s + r.amount, 0),
          cash:     todaySvc.filter(r => r.payment_type === 'cash').reduce((s, r) => s + r.amount, 0),
          paytm:    todaySvc.filter(r => r.payment_type === 'paytm').reduce((s, r) => s + r.amount, 0),
        })

        // This month
        const monthRecs = records.filter(r => r.date.startsWith(month))
        const monthSvc  = monthRecs.filter(r => r.entry_type === 'service')
        const monthTips = monthRecs.filter(r => r.entry_type === 'tip')
        const uniqueDays = new Set(monthRecs.map(r => r.date))
        setMonthStats({
          services:  monthSvc.length,
          revenue:   monthSvc.reduce((s, r) => s + r.amount, 0),
          tips:      monthTips.reduce((s, r) => s + r.amount, 0),
          activeDays: uniqueDays.size,
        })

        // Per-staff today breakdown
        const staffMap = {}
        for (const r of todayRecs) {
          if (!staffMap[r.staff_name]) staffMap[r.staff_name] = { services: 0, revenue: 0, tips: 0, clockedIn: false }
          if (r.entry_type === 'service') {
            staffMap[r.staff_name].services++
            staffMap[r.staff_name].revenue += r.amount
          } else {
            staffMap[r.staff_name].tips += r.amount
          }
        }

        // Check attendance for today
        const todayAtt = attendance.filter(a => a.date === today)
        for (const a of todayAtt) {
          if (!staffMap[a.staff_name]) staffMap[a.staff_name] = { services: 0, revenue: 0, tips: 0, clockedIn: false }
          if (a.login_time) staffMap[a.staff_name].clockedIn = true
          if (a.logout_time) staffMap[a.staff_name].clockedIn = false
        }

        const staffArr = Object.entries(staffMap)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.revenue - a.revenue)

        if (mounted) setStaffToday(staffArr)
      })()
      return () => { mounted = false }
    }, [today, month])
  )

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>

        <Text style={s.heading}>Dashboard</Text>
        <Text style={s.dateText}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>

        {/* Today KPIs */}
        {todayStats && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Today</Text>
            <View style={s.kpiRow}>
              <KPI label="Services" value={todayStats.services} />
              <KPI label="Revenue" value={`₹${todayStats.revenue.toLocaleString('en-IN')}`} gold />
              <KPI label="Tips" value={`₹${todayStats.tips.toLocaleString('en-IN')}`} />
            </View>
            <View style={s.kpiRow}>
              <KPI label="Cash" value={`₹${todayStats.cash.toLocaleString('en-IN')}`} />
              <KPI label="Paytm" value={`₹${todayStats.paytm.toLocaleString('en-IN')}`} />
            </View>
          </View>
        )}

        {/* Month KPIs */}
        {monthStats && (
          <View style={s.card}>
            <Text style={s.cardTitle}>This Month</Text>
            <View style={s.kpiRow}>
              <KPI label="Services" value={monthStats.services} />
              <KPI label="Revenue" value={`₹${monthStats.revenue.toLocaleString('en-IN')}`} gold />
              <KPI label="Tips" value={`₹${monthStats.tips.toLocaleString('en-IN')}`} />
            </View>
            <View style={s.kpiRow}>
              <KPI label="Active Days" value={monthStats.activeDays} />
              {monthStats.activeDays > 0 && (
                <KPI label="Avg/Day" value={`₹${Math.round(monthStats.revenue / monthStats.activeDays).toLocaleString('en-IN')}`} gold />
              )}
            </View>
          </View>
        )}

        {/* Staff Today */}
        {staffToday.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Staff Today</Text>
            {staffToday.map(st => (
              <View key={st.name} style={s.staffRow}>
                <View style={s.staffLeft}>
                  <View style={[s.statusDot, st.clockedIn ? s.dotGreen : s.dotGray]} />
                  <Text style={s.staffName}>{st.name}</Text>
                </View>
                <Text style={s.staffSvc}>{st.services} svc</Text>
                <Text style={s.staffRev}>₹{st.revenue.toLocaleString('en-IN')}</Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  )
}

function KPI({ label, value, gold }) {
  return (
    <View style={s.kpi}>
      <Text style={s.kpiLabel}>{label}</Text>
      <Text style={[s.kpiValue, gold && { color: GOLD }]}>{value}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#0f0e0c' },
  scroll:     { padding: 16, gap: 14, paddingBottom: 24 },
  heading:    { fontSize: 22, fontWeight: '700', color: '#e4e4e7' },
  dateText:   { fontSize: 13, color: '#71717a', marginBottom: 4 },
  card:       { backgroundColor: '#18181b', borderRadius: 16, padding: 16, gap: 12 },
  cardTitle:  { fontSize: 15, fontWeight: '600', color: '#e4e4e7', marginBottom: 2 },
  kpiRow:     { flexDirection: 'row', gap: 10 },
  kpi:        { flex: 1, backgroundColor: '#27272a', borderRadius: 10, padding: 12, alignItems: 'center' },
  kpiLabel:   { fontSize: 11, color: '#71717a', marginBottom: 4 },
  kpiValue:   { fontSize: 16, fontWeight: '700', color: '#e4e4e7' },
  staffRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  staffLeft:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot:  { width: 8, height: 8, borderRadius: 4 },
  dotGreen:   { backgroundColor: '#4CAF7D' },
  dotGray:    { backgroundColor: '#52525b' },
  staffName:  { fontSize: 14, fontWeight: '600', color: '#e4e4e7' },
  staffSvc:   { fontSize: 12, color: '#71717a', marginRight: 12 },
  staffRev:   { fontSize: 14, fontWeight: '700', color: GOLD, minWidth: 70, textAlign: 'right' },
})
