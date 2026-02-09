import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts';

export default function HomeScreen() {
  const t = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: t.colors.background }]}>
      <Text style={[styles.title, { color: t.colors.primary }]}>Petspond</Text>
      <Text style={[styles.subtitle, { color: t.colors.muted }]}>User App – onboarding & pets</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
});
