import React, { useState, useEffect } from 'react'
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
    AsyncStorage.getItem('rr_role').then(r => {
      setRole(r)
      setLoading(false)
    })
  }, [])

  if (loading) return null

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!role ? (
          <Stack.Screen name="Login">
            {props => <LoginScreen {...props} onLogin={setRole} />}
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
