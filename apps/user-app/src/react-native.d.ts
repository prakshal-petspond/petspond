/**
 * Fallback declaration so TypeScript finds types for 'react-native' when
 * the IDE resolves from monorepo root and misses the package's "types" field.
 */
declare module 'react-native';

/** React Native / Metro global in development */
declare const __DEV__: boolean;
