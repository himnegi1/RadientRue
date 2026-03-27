import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import StaffHomeScreen    from '../screens/staff/HomeScreen'
import StaffHistoryScreen from '../screens/staff/HistoryScreen'
import ProfileScreen      from '../screens/staff/ProfileScreen'

const Tab = createBottomTabNavigator()

const COLORS = { active: '#C9A84C', inactive: '#52525b', bg: '#18181b' }

export default function StaffNavigator({ onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: COLORS.bg, borderTopColor: '#27272a' },
        tabBarActiveTintColor: COLORS.active,
        tabBarInactiveTintColor: COLORS.inactive,
        headerStyle: { backgroundColor: '#0f0e0c' },
        headerTintColor: '#e4e4e7',
      }}
    >
      <Tab.Screen name="Home"    component={StaffHomeScreen}    options={{ title: 'Today' }} />
      <Tab.Screen name="History" component={StaffHistoryScreen} options={{ title: 'My Log' }} />
      <Tab.Screen name="Profile" options={{ title: 'Profile' }}>
        {() => <ProfileScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  )
}
