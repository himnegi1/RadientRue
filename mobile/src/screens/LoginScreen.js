import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// TODO: replace with Supabase auth once backend is set up
// For now: PIN 0000 = staff, PIN 9999 = admin (demo only)
const DEMO_STAFF_PIN = '0000'
const DEMO_ADMIN_PIN = '9999'

export default function LoginScreen({ onLogin }) {
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (pin.length < 4) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 400)) // simulate auth

    let role = null
    if (pin === DEMO_ADMIN_PIN) role = 'admin'
    else if (pin.length === 4) role = 'staff' // any 4-digit PIN = staff in demo

    if (!role) {
      Alert.alert('Invalid PIN', 'Please check your PIN and try again.')
      setLoading(false)
      return
    }

    await AsyncStorage.setItem('rr_role', role)
    onLogin(role)
  }

  function pressKey(key) {
    if (key === '⌫') { setPin(p => p.slice(0, -1)); return }
    if (pin.length >= 4) return
    setPin(p => p + key)
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <Text style={s.logo}>Radiant Rue</Text>
        <Text style={s.sub}>Enter your PIN to continue</Text>

        {/* PIN dots */}
        <View style={s.dots}>
          {[0,1,2,3].map(i => (
            <View key={i} style={[s.dot, pin.length > i && s.dotFilled]} />
          ))}
        </View>

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

        {loading ? (
          <ActivityIndicator color="#C9A84C" style={{ marginTop: 24 }} />
        ) : (
          <TouchableOpacity
            style={[s.btn, pin.length < 4 && s.btnDisabled]}
            onPress={handleLogin}
            disabled={pin.length < 4}
          >
            <Text style={s.btnText}>Login</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#0f0e0c' },
  container:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logo:       { fontSize: 28, fontWeight: '700', color: '#C9A84C', letterSpacing: 1, marginBottom: 6 },
  sub:        { fontSize: 14, color: '#71717a', marginBottom: 40 },
  dots:       { flexDirection: 'row', gap: 16, marginBottom: 40 },
  dot:        { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#3f3f46' },
  dotFilled:  { backgroundColor: '#C9A84C', borderColor: '#C9A84C' },
  keypad:     { flexDirection: 'row', flexWrap: 'wrap', width: 240, gap: 12, marginBottom: 32 },
  key:        { width: 68, height: 68, borderRadius: 34, backgroundColor: '#27272a', alignItems: 'center', justifyContent: 'center' },
  keyEmpty:   { width: 68, height: 68 },
  keyText:    { fontSize: 22, color: '#e4e4e7', fontWeight: '500' },
  btn:        { backgroundColor: '#C9A84C', paddingHorizontal: 48, paddingVertical: 14, borderRadius: 12 },
  btnDisabled:{ backgroundColor: '#3f3f46' },
  btnText:    { color: '#0f0e0c', fontWeight: '700', fontSize: 16 },
})
