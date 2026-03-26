import React from 'react'
import { View, Text, StyleSheet, SafeAreaView } from 'react-native'

export default function HistoryScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <Text style={s.title}>My Service Log</Text>
        <Text style={s.sub}>Coming soon — your full history will appear here.</Text>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#0f0e0c' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title:  { fontSize: 20, fontWeight: '700', color: '#e4e4e7', marginBottom: 8 },
  sub:    { fontSize: 14, color: '#71717a', textAlign: 'center' },
})
