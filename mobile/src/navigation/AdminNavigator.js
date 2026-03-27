import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import AdminDashboardScreen from '../screens/admin/DashboardScreen'
import AdminStaffScreen     from '../screens/admin/StaffScreen'
import AdminServiceLogScreen from '../screens/admin/ServiceLogScreen'
import AdminSettingsScreen  from '../screens/admin/SettingsScreen'

const Tab = createBottomTabNavigator()

const COLORS = { active: '#C9A84C', inactive: '#52525b', bg: '#18181b' }

export default function AdminNavigator({ onLogout }) {
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
      <Tab.Screen name="Dashboard"  component={AdminDashboardScreen}  options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Staff"      component={AdminStaffScreen}      options={{ title: 'Staff' }} />
      <Tab.Screen name="ServiceLog" component={AdminServiceLogScreen} options={{ title: 'Services' }} />
      <Tab.Screen name="Settings" options={{ title: 'Settings' }}>
        {() => <AdminSettingsScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  )
}
