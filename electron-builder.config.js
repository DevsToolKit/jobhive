const path = require('path');
const fs = require('fs');
const { version } = require('./package.json');

function normalizeChannel(value) {
  return value?.trim().toLowerCase() || null;
}

function getChannelFromVersion(appVersion) {
  const prerelease = appVersion?.split('-')[1];

  if (!prerelease) {
    return 'latest';
  }

  return prerelease.split('.')[0].trim().toLowerCase() || 'latest';
}

function getReleaseChannel() {
  return normalizeChannel(process.env.JOBHIVE_UPDATE_CHANNEL) || getChannelFromVersion(version);
}

function getGitHubReleaseType(channel) {
  const explicitReleaseType = process.env.JOBHIVE_RELEASE_TYPE?.trim().toLowerCase();

  if (explicitReleaseType === 'draft' || explicitReleaseType === 'prerelease' || explicitReleaseType === 'release') {
    return explicitReleaseType;
  }

  return channel === 'latest' ? 'release' : 'prerelease';
}

function getPublishConfig() {
  const updateUrl = process.env.JOBHIVE_UPDATE_URL?.trim();
  const githubOwner = process.env.JOBHIVE_UPDATE_GITHUB_OWNER?.trim();
  const githubRepo = process.env.JOBHIVE_UPDATE_GITHUB_REPO?.trim();
  const githubPrivate = process.env.JOBHIVE_UPDATE_GITHUB_PRIVATE === 'true';
  const channel = getReleaseChannel();

  if (updateUrl) {
    return [
      {
        provider: 'generic',
        url: updateUrl,
        channel,
      },
    ];
  }

  if (githubOwner && githubRepo) {
    return [
      {
        provider: 'github',
        owner: githubOwner,
        repo: githubRepo,
        private: githubPrivate,
        channel,
        releaseType: getGitHubReleaseType(channel),
      },
    ];
  }

  return undefined;
}

function getElectronLanguages() {
  const configured = process.env.JOBHIVE_ELECTRON_LANGUAGES?.trim();

  if (!configured) {
    return ['en-US'];
  }

  return configured
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function getExtraResources() {
  const resources = [
    {
      from: 'src/backend',
      to: 'backend',
      filter: ['**/*', '!**/__pycache__/**', '!**/venv/**', '!**/.venv/**', '!**/.*', '!**/*.pyc'],
    },
  ];

  const pythonRuntimeDir = path.join(__dirname, 'resources', 'python-runtime');
  if (fs.existsSync(pythonRuntimeDir)) {
    resources.push({
      from: 'resources/python-runtime',
      to: 'python-runtime',
      filter: ['**/*'],
    });
  }

  return resources;
}

module.exports = {
  appId: 'com.jobhive.app',
  productName: 'JobHive',
  directories: {
    output: 'dist',
    buildResources: 'resources',
  },
  files: [
    'src/main/**/*',
    'src/renderer/dist/**/*',
    '!src/backend/**/*',
    '!**/*.map',
    '!**/*.md',
    '!**/tests/**',
  ],
  extraResources: getExtraResources(),
  mac: {
    category: 'public.app-category.business',
    target: [
      { target: 'dmg', arch: ['x64', 'arm64'] },
      { target: 'zip', arch: ['x64', 'arm64'] },
    ],
    darkModeSupport: true,
    hardenedRuntime: true,
    gatekeeperAssess: false,
    artifactName: '${productName}-Mac-${version}-${arch}.${ext}',
    minimumSystemVersion: '10.15',
  },
  dmg: {
    contents: [
      { x: 130, y: 220 },
      { x: 410, y: 220, type: 'link', path: '/Applications' },
    ],
    window: {
      width: 540,
      height: 380,
    },
  },
  win: {
    target: ['nsis', 'portable'],
    icon: 'resources/icon.ico',
    artifactName: '${productName}-Setup-${version}.${ext}',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    perMachine: false,
    artifactName: '${productName}-Setup-${version}.${ext}',
  },
  portable: {
    artifactName: '${productName}-Portable-${version}.${ext}',
  },
  publish: getPublishConfig(),
  detectUpdateChannel: false,
  generateUpdatesFilesForAllChannels: true,
  npmRebuild: false,
  electronLanguages: getElectronLanguages(),
  asarUnpack: ['**/*.node', '**/python-runtime/**', '**/backend/**'],
};
