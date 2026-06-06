// Push ke GitHub menggunakan isomorphic-git (pure JS, tidak perlu git binary)
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'node_push.txt');
const log = (msg) => {
  fs.appendFileSync(logFile, msg + '\n');
  console.log(msg);
};

// Clear log
fs.writeFileSync(logFile, '=== NODE GIT PUSH ===\n');

async function main() {
  try {
    // Try to install isomorphic-git if needed
    log('Checking for isomorphic-git...');

    let git;
    try {
      git = require('isomorphic-git');
      log('isomorphic-git already available');
    } catch(e) {
      log('Installing isomorphic-git...');
      execSync('npm install isomorphic-git @isomorphic-git/http-node --no-save', {
        cwd: __dirname,
        stdio: 'pipe',
        timeout: 60000
      });
      git = require('isomorphic-git');
      log('isomorphic-git installed');
    }

    const http = require('@isomorphic-git/http-node');

    // Stage all files
    log('Staging all files...');
    const statusMatrix = await git.statusMatrix({ fs, dir: __dirname });
    const filesToAdd = statusMatrix
      .filter(([filepath, head, workdir, stage]) => workdir !== stage || head !== workdir)
      .map(([filepath]) => filepath);

    log('Files to add: ' + filesToAdd.length);

    for (const file of filesToAdd) {
      try {
        await git.add({ fs, dir: __dirname, filepath: file });
      } catch(e) { /* skip */ }
    }

    // Commit
    log('Committing...');
    const sha = await git.commit({
      fs,
      dir: __dirname,
      message: 'feat: referral and checkout system',
      author: { name: 'Reynathaniel', email: 'secrettrader011200@gmail.com' }
    });
    log('Committed: ' + sha);

    // Push - requires credentials
    // Try using stored credentials from git credential manager
    log('Pushing to GitHub...');

    // Get token from git credential store
    let token = '';
    try {
      const credOutput = execSync('git credential fill', {
        input: 'protocol=https\nhost=github.com\n\n',
        cwd: __dirname,
        timeout: 5000
      }).toString();
      const match = credOutput.match(/password=(.+)/);
      if (match) token = match[1].trim();
      log('Token from credential store: ' + (token ? 'found' : 'not found'));
    } catch(e) {
      log('Could not get token from credential store: ' + e.message.substring(0, 100));
    }

    if (!token) {
      log('ERROR: No GitHub token available. Push cannot proceed without credentials.');
      log('Please run: git push origin main');
      process.exit(1);
    }

    await git.push({
      fs,
      http,
      dir: __dirname,
      remote: 'origin',
      ref: 'main',
      onAuth: () => ({ username: 'Reynathaniel', password: token }),
    });

    log('=== PUSH SUCCESS! ===');

  } catch(err) {
    log('ERROR: ' + err.message);
    log(err.stack || '');
  }
}

main();
