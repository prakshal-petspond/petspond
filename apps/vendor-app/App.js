const React = require('react');
const { registerRootComponent } = require('expo');
const { ExpoRoot } = require('expo-router');

function App() {
  const ctx = require.context('./app');
  return React.createElement(ExpoRoot, { context: ctx });
}

registerRootComponent(App);
