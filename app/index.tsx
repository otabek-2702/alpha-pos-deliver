import React from 'react';
import { Redirect } from 'expo-router';
import { useAppStore } from '@/store/appStore';

export default function Index() {
  const loggedIn = useAppStore((s) => s.loggedIn);
  return <Redirect href={loggedIn ? '/orders' : '/login'} />;
}
