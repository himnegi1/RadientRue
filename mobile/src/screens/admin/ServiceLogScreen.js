import React, { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, SafeAreaView,
  SectionList, TouchableOpacity,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { getServiceRecords } from '../../lib/storage'

const GOLD = '#C9A84C'

export default function AdminServiceLogScreen() {
  const [sections, setSections] = useState([])
  const [filter, setFilter]     = useState('all') // all | service | tip

  useFocusEffect(
    useCallback(() => {
      let mounted = true
      ;(async () => {
        const records = await getServiceRecords()
        if (!mounted) return

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

  const filtered = filter === 'all'
    ? sections
    : sections
        .map(sec => ({ ...sec, data: sec.data.filter(d => d.entry_type === filter) }))
        .filter(sec => sec.data.length > 0)

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Filter */}
      <View style={s.filterRow}>
        {['all', 'service', 'tip'].map(f => (
          <TouchableOpacity
            key={f}
            style={[s.filterBtn, filter === f && s.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>
              {f === 'all' ? 'All' : f === 'service' ? 'Services' : 'Tips'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionList
        sections={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>No entries recorded</Text>
          </View>
        }
        renderSectionHeader={({ section }) => {
          const svc = section.data.filter(d => d.entry_type === 'service')
          const tips = section.data.filter(d => d.entry_type === 'tip')
          const rev = svc.reduce((s, e) => s + e.amount, 0)
          return (
            <View style={s.sectionHeader}>
              <Text style={s.sectionDate}>{formatDate(section.title)}</Text>
              <Text style={s.sectionTotal}>
                {section.data.length} entries · ₹{rev.toLocaleString('en-IN')}
              </Text>
            </View>
          )
        }}
        renderItem={({ item }) => (
          <View style={s.row}>
            <View style={[s.badge, item.entry_type === 'tip' ? s.tipBadge : s.svcBadge]}>
              <Text style={s.badgeText}>{item.entry_type === 'tip' ? 'TIP' : 'SVC'}</Text>
            </View>
            <View style={s.rowMid}>
              <Text style={s.staffLabel}>{item.staff_name}</Text>
              <Text style={s.timeLabel}>{item.time?.slice(0, 5) ?? ''}</Text>
            </View>
            <Text style={[s.payLabel, item.payment_type === 'cash' ? s.cash : s.paytm]}>
              {item.payment_type}
            </Text>
            <Text style={s.amtLabel}>₹{item.amount.toLocaleString('en-IN')}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: '#0f0e0c' },
  filterRow:        { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  filterBtn:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#3f3f46' },
  filterActive:     { backgroundColor: GOLD + '22', borderColor: GOLD },
  filterText:       { color: '#71717a', fontWeight: '600', fontSize: 13 },
  filterTextActive: { color: GOLD },
  list:             { paddingHorizontal: 16, paddingBottom: 24 },
  sectionHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, marginTop: 8 },
  sectionDate:      { fontSize: 14, fontWeight: '700', color: '#e4e4e7' },
  sectionTotal:     { fontSize: 12, color: '#71717a' },
  row:              { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1e1e1e' },
  badge:            { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  svcBadge:         { backgroundColor: '#27272a' },
  tipBadge:         { backgroundColor: '#14532d' },
  badgeText:        { fontSize: 10, fontWeight: '700', color: '#71717a' },
  rowMid:           { flex: 1 },
  staffLabel:       { fontSize: 14, fontWeight: '600', color: '#e4e4e7' },
  timeLabel:        { fontSize: 11, color: '#52525b', marginTop: 1 },
  payLabel:         { fontSize: 12, marginRight: 8 },
  paytm:            { color: '#60a5fa' },
  cash:             { color: '#d97706' },
  amtLabel:         { fontSize: 15, fontWeight: '700', color: '#e4e4e7', minWidth: 60, textAlign: 'right' },
  empty:            { alignItems: 'center', paddingTop: 60 },
  emptyText:        { fontSize: 16, fontWeight: '600', color: '#52525b' },
})
