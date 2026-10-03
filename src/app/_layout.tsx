import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SplashOverlay } from '@/components/splash-overlay';
import { FinanceProvider } from '@/data/finance-provider';
import { DATABASE_NAME, migrateDbIfNeeded } from '@/db/schema';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

SplashScreen.preventAutoHideAsync();

/** Mounted only once `SQLiteProvider` has opened and migrated the database. */
function DatabaseReady({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return null;
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const theme = useTheme();
  const [dbReady, setDbReady] = useState(false);

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.primary,
      background: theme.background,
      card: theme.backgroundElement,
      text: theme.text,
      border: theme.border,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
          <FinanceProvider>
            <DatabaseReady onReady={() => setDbReady(true)} />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="add" options={{ presentation: 'modal' }} />
            </Stack>
          </FinanceProvider>
        </SQLiteProvider>
        <SplashOverlay ready={dbReady} />
        <StatusBar style={dbReady ? 'auto' : 'dark'} />
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
