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

module.exports = {
  appId: 'com.jobhive.app',
  productName: 'JobHive',
  directories: {
    output: 'dist',
    buildResources: 'resources',
  },
  files: ['src/main/**/*', 'src/renderer/dist/**/*', '!src/backend/**/*'],
  extraResources: [
    {
      from: 'resources/python-runtime',
      to: 'python-runtime',
      filter: ['**/*'],
    },
    {
      from: 'src/backend',
      to: 'backend',
      filter: ['**/*', '!**/__pycache__/**', '!**/venv/**', '!**/.*'],
    },
  ],
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
