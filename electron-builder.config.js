function getPublishConfig() {
  const updateUrl = process.env.JOBHIVE_UPDATE_URL?.trim();
  const githubOwner = process.env.JOBHIVE_UPDATE_GITHUB_OWNER?.trim();
  const githubRepo = process.env.JOBHIVE_UPDATE_GITHUB_REPO?.trim();
  const githubPrivate = process.env.JOBHIVE_UPDATE_GITHUB_PRIVATE === 'true';

  if (updateUrl) {
    return [
      {
        provider: 'generic',
        url: updateUrl,
        channel: process.env.JOBHIVE_UPDATE_CHANNEL?.trim() || 'latest',
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
        releaseType: 'release',
      },
    ];
  }

  return undefined;
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
  },
  publish: getPublishConfig(),
  generateUpdatesFilesForAllChannels: true,
  npmRebuild: false,
  asarUnpack: ['**/*.node', '**/python-runtime/**', '**/backend/**'],
};
