import React, { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, SafeAreaView,
  SectionList, TouchableOpacity,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { getServiceRecords, getStaffProfile } from '../../lib/storage'

const GOLD = '#C9A84C'
const FILTERS = ['all', 'service', 'tip', 'product']

export default function HistoryScreen() {
  const [sections, setSections] = useState([])
  const [filter, setFilter]     = useState('all')
  const [staffName, setStaffName] = useState('')

  useFocusEffect(
    useCallback(() => {
      let mounted = true
      ;(async () => {
        const profile = await getStaffProfile()
        if (!mounted || !profile) return
        setStaffName(profile.name)

        const all = await getServiceRecords()
        const mine = all.filter(r => r.staff_name === profile.name)

        // Group by date
        const grouped = {}
        for (const r of mine) {
          if (!grouped[r.date]) grouped[r.date] = []
          grouped[r.date].push(r)
        }

        const secs = Object.entries(grouped)
          .sort((a, b) => b[0].localeCompare(a[0]))
          .map(([date, data]) => ({
            title: date,
            data,
            services: data.filter(d => d.entry_type === 'service'),
            tips: data.filter(d => d.entry_type === 'tip'),
            products: data.filter(d => d.entry_type === 'product'),
          }))

        if (mounted) setSections(secs)
      })()
      return () => { mounted = false }
    }, [])
  )

  const filtered = filter === 'all'
    ? sections
    : sections
        .map(sec => ({
          ...sec,
          data: sec.data.filter(d => d.entry_type === filter),
        }))
        .filter(sec => sec.data.length > 0)

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short',
    })
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Filter pills */}
      <View style={s.filterRow}>
        {FILTERS.map(f => (
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

      <SectionList
        sections={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>No entries yet</Text>
            <Text style={s.emptyHint}>Add services from the Today tab</Text>
          </View>
        }
        renderSectionHeader={({ section }) => {
          const rev = section.services.reduce((s, e) => s + e.amount, 0)
          const tip = section.tips.reduce((s, e) => s + e.amount, 0)
          return (
            <View style={s.sectionHeader}>
              <Text style={s.sectionDate}>{formatDate(section.title)}</Text>
              <View style={s.sectionStats}>
                <Text style={s.sectionSvc}>{section.services.length} svc</Text>
                <Text style={s.sectionRev}>₹{rev.toLocaleString('en-IN')}</Text>
                {tip > 0 && <Text style={s.sectionTip}>+₹{tip} tips</Text>}
                {section.products.length > 0 && <Text style={s.sectionProd}>{section.products.length} prd</Text>}
              </View>
            </View>
          )
        }}
        renderItem={({ item }) => (
          <View style={s.row}>
            <View style={[s.badge, item.entry_type === 'tip' ? s.tipBadge : item.entry_type === 'product' ? s.prodBadge : s.svcBadge]}>
              <Text style={[s.badgeText, item.entry_type === 'product' && { color: '#a78bfa' }]}>
                {item.entry_type === 'tip' ? 'TIP' : item.entry_type === 'product' ? 'PRD' : 'SVC'}
              </Text>
            </View>
            <Text style={s.amt}>₹{Number(item.amount).toLocaleString('en-IN')}</Text>
            <Text style={[s.pay, item.payment_type === 'cash' ? s.cash : s.paytm]}>
              {item.payment_type === 'cash' ? 'cash' : 'online'}
            </Text>
            <Text style={s.time}>{item.time?.slice(0, 5) ?? ''}</Text>
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
  sectionStats:     { flexDirection: 'row', gap: 8, alignItems: 'center' },
  sectionSvc:       { fontSize: 12, color: '#71717a' },
  sectionRev:       { fontSize: 13, fontWeight: '700', color: GOLD },
  sectionTip:       { fontSize: 12, color: '#4CAF7D' },
  sectionProd:      { fontSize: 12, color: '#a78bfa' },
  row:              { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1e1e1e' },
  badge:            { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  svcBadge:         { backgroundColor: '#27272a' },
  tipBadge:         { backgroundColor: '#14532d' },
  prodBadge:        { backgroundColor: 'rgba(167,139,250,0.15)' },
  badgeText:        { fontSize: 10, fontWeight: '700', color: '#71717a' },
  amt:              { flex: 1, fontSize: 15, fontWeight: '600', color: '#e4e4e7' },
  pay:              { fontSize: 12 },
  paytm:            { color: '#60a5fa' },
  cash:             { color: '#d97706' },
  time:             { fontSize: 12, color: '#52525b' },
  empty:            { alignItems: 'center', paddingTop: 60 },
  emptyText:        { fontSize: 16, fontWeight: '600', color: '#52525b' },
  emptyHint:        { fontSize: 13, color: '#3f3f46', marginTop: 6 },
})
