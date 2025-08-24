const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Configure Metro to work properly in monorepo
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Prevent Metro from watching unnecessary directories
config.resolver.blockList = [
  /node_modules\/.*\/node_modules/,
  /\.git\//,
  /packages\/back\//,
];

// Enable pnpm + monorepo resolution and package exports
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

// Help Metro resolve expo-router/entry correctly in monorepos
try {
  const expoRouterEntry = require.resolve('expo-router/entry', { paths: [projectRoot] });
  config.resolver.extraNodeModules = {
    ...(config.resolver.extraNodeModules || {}),
    'expo-router/entry': expoRouterEntry,
    react: require.resolve('react', { paths: [projectRoot] }),
    'react-dom': require.resolve('react-dom', { paths: [projectRoot] }),
  };
} catch (_) { }

// Alias missing native deps to shims for web/dev fallback
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  'react-native-keyboard-controller': path.resolve(projectRoot, 'shims/react-native-keyboard-controller.ts'),
};

module.exports = config;
