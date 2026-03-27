import React, { useState, useEffect, useCallback } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { AppState } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

import LoginScreen    from '../screens/LoginScreen'
import StaffNavigator from './StaffNavigator'
import AdminNavigator from './AdminNavigator'

const Stack = createNativeStackNavigator()

export default function RootNavigator() {
  const [role, setRole] = useState(null) // null | 'staff' | 'admin'
  const [loading, setLoading] = useState(true)

  const checkRole = useCallback(async () => {
    const r = await AsyncStorage.getItem('rr_role')
    setRole(r)
    setLoading(false)
  }, [])

  useEffect(() => {
    checkRole()
  }, [checkRole])

  // Re-check role when app comes back to foreground (handles logout)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkRole()
    })
    return () => sub.remove()
  }, [checkRole])

  // Also poll periodically to catch logout from within the app
  // This is a simple approach; a context/event system would be cleaner
  useEffect(() => {
    const interval = setInterval(checkRole, 1000)
    return () => clearInterval(interval)
  }, [checkRole])

  if (loading) return null

  function handleLogin(newRole) {
    setRole(newRole)
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!role ? (
          <Stack.Screen name="Login">
            {props => <LoginScreen {...props} onLogin={handleLogin} />}
          </Stack.Screen>
        ) : role === 'staff' ? (
          <Stack.Screen name="StaffApp" component={StaffNavigator} />
        ) : (
          <Stack.Screen name="AdminApp" component={AdminNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
