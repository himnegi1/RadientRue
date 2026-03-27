import React, { useState, useEffect, useCallback } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import AsyncStorage from '@react-native-async-storage/async-storage'

import LoginScreen    from '../screens/LoginScreen'
import StaffNavigator from './StaffNavigator'
import AdminNavigator from './AdminNavigator'

const Stack = createNativeStackNavigator()

export default function RootNavigator() {
  const [role, setRole] = useState(null) // null | 'staff' | 'admin'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const r = await AsyncStorage.getItem('rr_role')
      setRole(r)
      setLoading(false)
    })()
  }, [])

  if (loading) return null

  function handleLogin(newRole) {
    setRole(newRole)
  }

  function handleLogout() {
    setRole(null)
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!role ? (
          <Stack.Screen name="Login">
            {props => <LoginScreen {...props} onLogin={handleLogin} />}
          </Stack.Screen>
        ) : role === 'staff' ? (
          <Stack.Screen name="StaffApp">
            {() => <StaffNavigator onLogout={handleLogout} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="AdminApp">
            {() => <AdminNavigator onLogout={handleLogout} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
