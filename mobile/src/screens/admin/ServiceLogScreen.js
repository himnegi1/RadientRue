import React, { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, SafeAreaView,
  SectionList, TouchableOpacity, Switch,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { getServiceRecords, getStaffList } from '../../lib/storage'

const GOLD = '#e6c364'
const ON_SURFACE = '#e6e2de'
const ON_SURFACE_VAR = '#d0c5b2'

export default function AdminServiceLogScreen() {
  const [sections, setSections] = useState([])
  const [filter, setFilter]     = useState('all')
  const [activeNames, setActiveNames] = useState(new Set())
  const [showDisabled, setShowDisabled] = useState(false)
  const [hasDisabled, setHasDisabled] = useState(false)

  useFocusEffect(
    useCallback(() => {
      let mounted = true
      ;(async () => {
        const records = await getServiceRecords()
        const staff = await getStaffList()
        if (!mounted) return

        const names = new Set(staff.map(s => s.name))
        setActiveNames(names)

        // Check if any records are from non-active staff
        const disabledRecords = records.some(r => !names.has(r.staff_name))
        setHasDisabled(disabledRecords)

        // Group by date
        const grouped = {}
        for (const r of records) {
          if (!grouped[r.date]) grouped[r.date] = []
          grouped[r.date].push(r)
        }

        const secs = Object.entries(grouped)
          .sort((a, b) => b[0].localeCompare(a[0]))
          .map(([date, data]) => ({ title: date, data }))

        if (mounted) setSections(secs)
      })()
      return () => { mounted = false }
    }, [])
  )

  // Apply filters
  let filtered = sections
  if (filter !== 'all') {
    filtered = filtered
      .map(sec => ({ ...sec, data: sec.data.filter(d => d.entry_type === filter) }))
      .filter(sec => sec.data.length > 0)
  }
  if (!showDisabled) {
    filtered = filtered
      .map(sec => ({ ...sec, data: sec.data.filter(d => activeNames.has(d.staff_name)) }))
      .filter(sec => sec.data.length > 0)
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Filters */}
      <View style={s.filterContainer}>
        <View style={s.filterRow}>
          {['all', 'service', 'tip', 'product'].map(f => (
            <TouchableOpacity
              key={f}
              style={[s.filterBtn, filter === f && s.filterActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>
                {f === 'all' ? 'All' : f === 'service' ? 'Services' : f === 'tip' ? 'Tips' : 'Products'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {hasDisabled && (
          <View style={s.toggleRow}>
            <Text style={s.toggleLabel}>Show disabled staff</Text>
            <Switch
              value={showDisabled}
              onValueChange={setShowDisabled}
              trackColor={{ false: '#27272a', true: GOLD + '55' }}
              thumbColor={showDisabled ? GOLD : '#52525b'}
            />
          </View>
        )}
      </View>

      <SectionList
        sections={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={<View style={s.empty}><Text style={s.emptyText}>No entries</Text></View>}
        renderSectionHeader={({ section }) => {
          const svc = section.data.filter(d => d.entry_type === 'service')
          const rev = svc.reduce((s, e) => s + Number(e.amount), 0)
          return (
            <View style={s.sectionHeader}>
              <Text style={s.sectionDate}>{formatDate(section.title)}</Text>
              <Text style={s.sectionTotal}>{section.data.length} entries · ₹{rev.toLocaleString('en-IN')}</Text>
            </View>
          )
        }}
        renderItem={({ item }) => {
          const isDisabledStaff = !activeNames.has(item.staff_name)
          return (
            <View style={[s.row, isDisabledStaff && { opacity: 0.5 }]}>
              <View style={[s.badge, item.entry_type === 'tip' ? s.tipBadge : item.entry_type === 'product' ? s.prodBadge : s.svcBadge]}>
                <Text style={[s.badgeText, item.entry_type === 'product' && { color: '#a78bfa' }]}>
                  {item.entry_type === 'tip' ? 'TIP' : item.entry_type === 'product' ? 'PRD' : 'SVC'}
                </Text>
              </View>
              <View style={s.rowMid}>
                <Text style={s.staffLabel}>{item.staff_name}</Text>
                <Text style={s.timeLabel}>{item.time?.slice(0, 5) ?? ''}</Text>
              </View>
              <Text style={[s.payLabel, item.payment_type === 'cash' ? s.cash : s.paytm]}>
                {item.payment_type === 'cash' ? 'cash' : 'online'}
              </Text>
              <Text style={s.amtLabel}>₹{Number(item.amount).toLocaleString('en-IN')}</Text>
            </View>
          )
        }}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: '#0f0e0c' },
  filterContainer:  { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  filterRow:        { flexDirection: 'row', gap: 8 },
  filterBtn:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#3f3f46' },
  filterActive:     { backgroundColor: GOLD + '22', borderColor: GOLD },
  filterText:       { color: '#71717a', fontWeight: '600', fontSize: 13 },
  filterTextActive: { color: GOLD },
  toggleRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  toggleLabel:      { fontSize: 13, color: ON_SURFACE_VAR },
  list:             { paddingHorizontal: 16, paddingBottom: 24 },
  sectionHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, marginTop: 8 },
  sectionDate:      { fontSize: 14, fontWeight: '700', color: ON_SURFACE },
  sectionTotal:     { fontSize: 12, color: '#71717a' },
  row:              { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1e1e1e' },
  badge:            { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  svcBadge:         { backgroundColor: '#27272a' },
  tipBadge:         { backgroundColor: '#14532d' },
  prodBadge:        { backgroundColor: 'rgba(167,139,250,0.15)' },
  badgeText:        { fontSize: 10, fontWeight: '700', color: '#71717a' },
  rowMid:           { flex: 1 },
  staffLabel:       { fontSize: 14, fontWeight: '600', color: ON_SURFACE },
  timeLabel:        { fontSize: 11, color: '#52525b', marginTop: 1 },
  payLabel:         { fontSize: 12, marginRight: 8 },
  paytm:            { color: '#60a5fa' },
  cash:             { color: '#d97706' },
  amtLabel:         { fontSize: 15, fontWeight: '700', color: ON_SURFACE, minWidth: 60, textAlign: 'right' },
  empty:            { alignItems: 'center', paddingTop: 60 },
  emptyText:        { fontSize: 16, fontWeight: '600', color: '#52525b' },
})
