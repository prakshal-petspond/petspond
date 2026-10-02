const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Force a single copy of native-view packages so Metro never registers
// RNCSafeAreaProvider / screens twice in this monorepo.
const singletons = [
  'react',
  'react-native',
  'react-native-safe-area-context',
  'react-native-screens',
];

const monorepoRoot = path.resolve(__dirname, '../..');
config.resolver.extraNodeModules = Object.fromEntries(
  singletons.map((name) => [
    name,
    path.dirname(
      require.resolve(`${name}/package.json`, {
        paths: [__dirname, monorepoRoot],
      }),
    ),
  ]),
);

module.exports = config;
