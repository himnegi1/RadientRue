import React, { useState, useRef } from 'react'
import {
  View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, ImageBackground,
} from 'react-native'
import { setRole, saveStaffProfile, verifyPin } from '../lib/storage'

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

    await new Promise(r => setTimeout(r, 300))

    const staff = await verifyPin(code)
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

    if (next.length === 4) {
      attemptLogin(next)
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        {/* Branding */}
        <View style={s.brandSection}>
          <View style={s.iconCircle}>
            <Text style={s.iconText}>✿</Text>
          </View>
          <Text style={s.logo}>Radiant Rue</Text>
          <Text style={s.sub}>ENTER YOUR 4-DIGIT PIN</Text>
        </View>

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
                <Text style={[s.keyText, k === '⌫' && s.keyBackspace]}>{k}</Text>
              </TouchableOpacity>
            )
          ))}
        </View>

        {loading && (
          <ActivityIndicator color="#79545c" style={{ marginTop: 24 }} />
        )}

        <Text style={s.hint}>Forgot PIN?</Text>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#fff8f8' },
  container:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  brandSection: { alignItems: 'center', marginBottom: 48 },
  iconCircle:   { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f5eced', borderWidth: 1, borderColor: 'rgba(121,84,92,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  iconText:     { fontSize: 28, color: '#79545c' },
  logo:         { fontSize: 36, fontWeight: '900', color: '#e2b4bd', letterSpacing: -1, fontStyle: 'italic' },
  sub:          { fontSize: 12, color: '#817476', fontWeight: '500', letterSpacing: 2, marginTop: 12, opacity: 0.8 },
  dots:         { flexDirection: 'row', gap: 24, marginBottom: 16 },
  dot:          { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: '#d3c2c5', backgroundColor: '#efe6e7' },
  dotFilled:    { backgroundColor: '#79545c', borderColor: '#79545c', shadowColor: '#79545c', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 12 },
  error:        { color: '#ba1a1a', fontSize: 13, marginBottom: 16, fontWeight: '500' },
  keypad:       { flexDirection: 'row', flexWrap: 'wrap', width: 260, gap: 12, marginTop: 32, marginBottom: 32 },
  key:          { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  keyEmpty:     { width: 76, height: 76 },
  keyText:      { fontSize: 28, color: '#1f1a1b', fontWeight: '300' },
  keyBackspace: { fontSize: 22 },
  hint:         { color: '#79545c', fontSize: 14, fontWeight: '600', marginTop: 16, letterSpacing: 0.5 },
})
