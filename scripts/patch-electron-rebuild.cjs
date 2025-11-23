const path = require('node:path');
const fs = require('fs-extra');

const LOCK_FILES = ['yarn.lock', 'package-lock.json', 'pnpm-lock.yaml'];

function patchGetProjectRootPath(searchModule) {
  if (!searchModule || typeof searchModule.getProjectRootPath !== 'function') {
    return;
  }

  const original = searchModule.getProjectRootPath;

  async function findClosestLockfile(startDir) {
    let currentDir = path.resolve(startDir);

    while (true) {
      // Check all lock files in the current directory before walking upwards.
      for (const filename of LOCK_FILES) {
        const candidate = path.join(currentDir, filename);
        try {
          if (await fs.pathExists(candidate)) {
            return currentDir;
          }
        } catch {
          // Ignore FS errors and keep searching upwards.
        }
      }

      const parent = path.dirname(currentDir);
      if (parent === currentDir) {
        break;
      }
      currentDir = parent;
    }

    return startDir;
  }

  searchModule.getProjectRootPath = function patchedGetProjectRootPath(cwd) {
    return findClosestLockfile(cwd).catch(() => original(cwd));
  };
}

try {
  const searchModulePath = require.resolve('@electron/rebuild/lib/search-module');
  const searchModule = require(searchModulePath);
  patchGetProjectRootPath(searchModule);
} catch {
  // If the module cannot be resolved we silently ignore the error.
}
