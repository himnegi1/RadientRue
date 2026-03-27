import React, { useState, useRef } from 'react'
import {
  View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native'
import { setRole, saveStaffProfile } from '../lib/storage'

const STAFF_PINS = {
  '1234': { name: 'Akram Khan' },
  '2345': { name: 'Azad' },
  '3456': { name: 'Sawan Kumar' },
  '4567': { name: 'Sonu' },
  '5678': { name: 'Umer' },
}
const ADMIN_PIN = '9999'

export default function LoginScreen({ onLogin }) {
  const [pin, setPin]         = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const busy = useRef(false)

  async function attemptLogin(code) {
    if (busy.current) return
    busy.current = true
    setLoading(true)
    setError('')

    // Small delay for visual feedback
    await new Promise(r => setTimeout(r, 300))

    if (code === ADMIN_PIN) {
      await setRole('admin')
      await saveStaffProfile({ name: 'Admin', pin: code })
      onLogin('admin')
      return
    }

    const staff = STAFF_PINS[code]
    if (staff) {
      await setRole('staff')
      await saveStaffProfile({ name: staff.name, pin: code })
      onLogin('staff')
      return
    }

    setError('Invalid PIN. Try again.')
    setPin('')
    setLoading(false)
    busy.current = false
  }

  function pressKey(key) {
    if (loading) return
    setError('')

    if (key === '⌫') {
      setPin(p => p.slice(0, -1))
      return
    }

    if (pin.length >= 4) return
    const next = pin + key
    setPin(next)

    // Auto-submit on 4 digits
    if (next.length === 4) {
      attemptLogin(next)
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <Text style={s.logo}>Radiant Rue</Text>
        <Text style={s.sub}>Enter your 4-digit PIN</Text>

        {/* PIN dots */}
        <View style={s.dots}>
          {[0,1,2,3].map(i => (
            <View key={i} style={[s.dot, pin.length > i && s.dotFilled]} />
          ))}
        </View>

        {error ? <Text style={s.error}>{error}</Text> : null}

        {/* Keypad */}
        <View style={s.keypad}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
            k === '' ? <View key={i} style={s.keyEmpty} /> : (
              <TouchableOpacity key={i} style={s.key} onPress={() => pressKey(k)} activeOpacity={0.6}>
                <Text style={s.keyText}>{k}</Text>
              </TouchableOpacity>
            )
          ))}
        </View>

        {loading && (
          <ActivityIndicator color="#C9A84C" style={{ marginTop: 24 }} />
        )}

        <Text style={s.hint}>Staff: use your assigned PIN{'\n'}Admin: 9999</Text>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#0f0e0c' },
  container:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logo:       { fontSize: 28, fontWeight: '700', color: '#C9A84C', letterSpacing: 1, marginBottom: 6 },
  sub:        { fontSize: 14, color: '#71717a', marginBottom: 40 },
  dots:       { flexDirection: 'row', gap: 16, marginBottom: 16 },
  dot:        { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#3f3f46' },
  dotFilled:  { backgroundColor: '#C9A84C', borderColor: '#C9A84C' },
  error:      { color: '#ef4444', fontSize: 13, marginBottom: 16 },
  keypad:     { flexDirection: 'row', flexWrap: 'wrap', width: 240, gap: 12, marginBottom: 32 },
  key:        { width: 68, height: 68, borderRadius: 34, backgroundColor: '#27272a', alignItems: 'center', justifyContent: 'center' },
  keyEmpty:   { width: 68, height: 68 },
  keyText:    { fontSize: 22, color: '#e4e4e7', fontWeight: '500' },
  hint:       { color: '#3f3f46', fontSize: 11, textAlign: 'center', marginTop: 32, lineHeight: 18 },
})
