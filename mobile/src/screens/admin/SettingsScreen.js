import React, { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity, Alert, TextInput, Platform, Switch,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { clearRole, getStaffList, getDisabledStaffList, addStaff, disableStaff, enableStaff, resetAllData } from '../../lib/storage'

const GOLD = '#e6c364'
const BG = '#0f0e0c'
const SURFACE_HIGH = '#2b2a27'
const ON_SURFACE = '#e6e2de'
const ON_SURFACE_VAR = '#d0c5b2'
const OUTLINE_VAR = '#4d4637'
const ERROR = '#ffb4ab'

export default function AdminSettingsScreen({ onLogout: onLogoutProp }) {
  const [activeStaff, setActiveStaff] = useState([])
  const [disabledStaff, setDisabledStaff] = useState([])
  const [showDisabled, setShowDisabled] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [adding, setAdding] = useState(false)

  useFocusEffect(
    useCallback(() => { loadStaff() }, [])
  )

  async function loadStaff() {
    const active = await getStaffList()
    const disabled = await getDisabledStaffList()
    setActiveStaff(active)
    setDisabledStaff(disabled)
  }

  async function handleLogout() {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        await clearRole()
        if (onLogoutProp) onLogoutProp()
      }
    } else {
      Alert.alert('Logout', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: async () => { await clearRole(); if (onLogoutProp) onLogoutProp() } },
      ])
    }
  }

  async function handleResetData() {
    const doReset = async () => {
      await resetAllData()
      const msg = 'All service records, attendance & OT data deleted.'
      if (Platform.OS === 'web') window.alert(msg)
      else Alert.alert('Done', msg)
    }
    if (Platform.OS === 'web') {
      if (window.confirm('DELETE all service records, attendance & OT data?\n\nStaff accounts will be kept. This cannot be undone.')) doReset()
    } else {
      Alert.alert('Reset All Data', 'DELETE all service records, attendance & OT data?\n\nStaff accounts will be kept. This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Everything', style: 'destructive', onPress: doReset },
      ])
    }
  }

  async function handleAddStaff() {
    if (!newName.trim()) {
      if (Platform.OS === 'web') window.alert('Enter staff name')
      else Alert.alert('Error', 'Enter staff name')
      return
    }
    setAdding(true)
    const staff = await addStaff(newName.trim(), newPhone.trim())
    setAdding(false)
    if (staff) {
      const msg = `${staff.name}\nPIN: ${staff.pin}\n\nShare this PIN with them.`
      if (Platform.OS === 'web') window.alert(msg)
      else Alert.alert('Staff Added', msg)
      setNewName('')
      setNewPhone('')
      setShowAddForm(false)
      loadStaff()
    }
  }

  function handleDisableStaff(staff) {
    const doDisable = async () => { await disableStaff(staff.id); loadStaff() }
    if (Platform.OS === 'web') {
      if (window.confirm(`Disable ${staff.name}? They won't be able to login but data is preserved.`)) doDisable()
    } else {
      Alert.alert('Disable Staff', `Disable ${staff.name}?\n\nThey won't be able to login but all data is preserved.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disable', style: 'destructive', onPress: doDisable },
      ])
    }
  }

  function handleEnableStaff(staff) {
    const doEnable = async () => { await enableStaff(staff.id); loadStaff() }
    if (Platform.OS === 'web') {
      if (window.confirm(`Re-enable ${staff.name}?`)) doEnable()
    } else {
      Alert.alert('Enable Staff', `Re-enable ${staff.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Enable', onPress: doEnable },
      ])
    }
  }

  function StaffCard({ staff, disabled }) {
    const initials = staff.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    return (
      <View style={[s.staffCard, disabled && s.staffCardDisabled]}>
        <View style={s.staffLeft}>
          <View style={[s.staffAvatar, disabled && { opacity: 0.4 }]}>
            <Text style={s.staffInitials}>{initials}</Text>
          </View>
          <View>
            <Text style={[s.staffName, disabled && { opacity: 0.5 }]}>{staff.name}</Text>
            <View style={s.pinRow}>
              <Text style={s.pinLabel}>PIN: </Text>
              <Text style={s.pinValue}>{staff.pin}</Text>
            </View>
          </View>
        </View>
        {disabled ? (
          <TouchableOpacity style={s.enableBtn} onPress={() => handleEnableStaff(staff)}>
            <Text style={s.enableText}>Enable</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.disableBtn} onPress={() => handleDisableStaff(staff)}>
            <Text style={s.disableText}>Disable</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        <View style={s.hero}>
          <Text style={s.heroTitle}>Settings</Text>
          <Text style={s.heroSub}>Manage staff and preferences.</Text>
        </View>

        {/* Staff Management */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>STAFF MANAGEMENT</Text>

          {showAddForm ? (
            <View style={s.addCard}>
              <Text style={s.addCardLabel}>New Staff</Text>
              <View style={s.formFields}>
                <View style={s.fieldGroup}>
                  <Text style={s.fieldLabel}>FULL NAME</Text>
                  <TextInput style={s.fieldInput} placeholder="e.g. Sawan Kumar" placeholderTextColor="#52525b" value={newName} onChangeText={setNewName} />
                </View>
                <View style={s.fieldGroup}>
                  <Text style={s.fieldLabel}>PHONE</Text>
                  <TextInput style={s.fieldInput} placeholder="+91 XXXXX XXXXX" placeholderTextColor="#52525b" value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" />
                </View>
              </View>
              <TouchableOpacity style={[s.addBtn, adding && { opacity: 0.5 }]} onPress={handleAddStaff} disabled={adding}>
                <Text style={s.addBtnText}>{adding ? 'Adding...' : 'Add & Generate PIN'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowAddForm(false)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={s.addTrigger} onPress={() => setShowAddForm(true)}>
              <Text style={s.addTriggerText}>+ New Staff</Text>
            </TouchableOpacity>
          )}

          {/* Active Staff */}
          {activeStaff.map(staff => <StaffCard key={staff.id} staff={staff} disabled={false} />)}
          {activeStaff.length === 0 && <Text style={s.emptyText}>No active staff.</Text>}

          {/* Disabled Staff Toggle */}
          {disabledStaff.length > 0 && (
            <View style={s.toggleRow}>
              <Text style={s.toggleLabel}>Show disabled staff ({disabledStaff.length})</Text>
              <Switch
                value={showDisabled}
                onValueChange={setShowDisabled}
                trackColor={{ false: '#27272a', true: GOLD + '55' }}
                thumbColor={showDisabled ? GOLD : '#52525b'}
              />
            </View>
          )}
          {showDisabled && disabledStaff.map(staff => <StaffCard key={staff.id} staff={staff} disabled={true} />)}
        </View>

        {/* Danger Zone */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>DANGER ZONE</Text>
          <TouchableOpacity style={s.dangerCard} onPress={handleResetData}>
            <Text style={s.dangerText}>🗑  Reset All Data</Text>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
          <Text style={s.dangerHint}>Deletes all services, attendance & OT records. Staff accounts are kept.</Text>
        </View>

        {/* Account */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>ACCOUNT</Text>
          <TouchableOpacity style={s.logoutCard} onPress={handleLogout}>
            <Text style={s.logoutText}>⎋  Logout</Text>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>ABOUT</Text>
          <View style={s.aboutCard}>
            <View>
              <Text style={s.aboutTitle}>Radiant Rue</Text>
              <Text style={s.aboutSub}>V1.0.0 • Supabase Cloud</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: BG },
  scroll:          { padding: 20, gap: 28, paddingBottom: 32 },
  hero:            { gap: 4 },
  heroTitle:       { fontSize: 28, fontWeight: '700', color: ON_SURFACE, letterSpacing: -0.5 },
  heroSub:         { fontSize: 13, color: ON_SURFACE_VAR },
  section:         { gap: 12 },
  sectionTitle:    { fontSize: 11, fontWeight: '700', color: GOLD, letterSpacing: 2 },
  addTrigger:      { backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a', borderRadius: 16, padding: 16, borderLeftWidth: 4, borderLeftColor: GOLD },
  addTriggerText:  { fontSize: 14, fontWeight: '600', color: ON_SURFACE },
  addCard:         { backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a', borderRadius: 16, padding: 20, gap: 14, borderLeftWidth: 4, borderLeftColor: GOLD },
  addCardLabel:    { fontSize: 14, fontWeight: '600', color: ON_SURFACE },
  formFields:      { gap: 14 },
  fieldGroup:      { gap: 4 },
  fieldLabel:      { fontSize: 9, fontWeight: '700', color: ON_SURFACE_VAR, letterSpacing: 1.5 },
  fieldInput:      { backgroundColor: BG, borderBottomWidth: 1, borderBottomColor: OUTLINE_VAR, paddingVertical: 8, fontSize: 14, color: ON_SURFACE },
  addBtn:          { backgroundColor: GOLD, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  addBtnText:      { color: '#3d2e00', fontWeight: '700', fontSize: 14 },
  cancelText:      { color: ON_SURFACE_VAR, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  staffCard:       { backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  staffCardDisabled: { borderColor: '#1a1a1a' },
  staffLeft:       { flexDirection: 'row', alignItems: 'center', gap: 14 },
  staffAvatar:     { width: 40, height: 40, borderRadius: 20, backgroundColor: SURFACE_HIGH, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: OUTLINE_VAR },
  staffInitials:   { fontSize: 14, fontWeight: '700', color: GOLD },
  staffName:       { fontSize: 14, fontWeight: '700', color: ON_SURFACE },
  pinRow:          { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  pinLabel:        { fontSize: 11, color: ON_SURFACE_VAR },
  pinValue:        { fontSize: 12, fontWeight: '700', color: GOLD, letterSpacing: 3 },
  disableBtn:      { padding: 8 },
  disableText:     { fontSize: 12, fontWeight: '600', color: ERROR },
  enableBtn:       { backgroundColor: GOLD + '22', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  enableText:      { fontSize: 12, fontWeight: '600', color: GOLD },
  toggleRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  toggleLabel:     { fontSize: 13, color: ON_SURFACE_VAR },
  emptyText:       { fontSize: 13, color: '#52525b', paddingVertical: 8 },
  dangerCard:      { backgroundColor: '#18181b', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dangerText:      { fontSize: 14, fontWeight: '700', color: ERROR },
  dangerHint:      { fontSize: 11, color: '#52525b', paddingHorizontal: 4 },
  logoutCard:      { backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoutText:      { fontSize: 14, fontWeight: '700', color: ERROR },
  chevron:         { fontSize: 18, color: 'rgba(208,197,178,0.3)' },
  aboutCard:       { backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a', borderRadius: 16, padding: 16 },
  aboutTitle:      { fontSize: 14, fontWeight: '700', color: ON_SURFACE },
  aboutSub:        { fontSize: 11, color: ON_SURFACE_VAR, marginTop: 2 },
})
