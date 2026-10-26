const readline = require('node:readline');
function hiddenPassword(label = 'Password: ') {
  if (process.platform === 'win32' && process.env.DCORHOME_PASSWORD_UI === 'dialog') {
    return new Promise((resolve, reject) => {
      require('node:child_process').execFile('powershell.exe', ['-NoProfile', '-STA', '-ExecutionPolicy', 'Bypass', '-File', require('node:path').join(__dirname, 'member-password-dialog.ps1'), label], {
        windowsHide: true, encoding: 'utf8', maxBuffer: 8192,
        env: { ...process.env, DCORHOME_PASSWORD_PIPE: '1' },
      }, (error, output) => {
        // Captured pipe is a memory-only transport, never forwarded to stdout/logs.
        if (error) return reject(Error('The local password dialog could not open.'));
        try { const result = JSON.parse(output.replace(/^\uFEFF/, '')); if (result.cancelled) return reject(Error('Cancelled.')); resolve(result.password); }
        catch { reject(Error('The local password dialog did not complete.')); }
      });
    });
  }
  if (!process.stdin.isTTY || !process.stdout.isTTY) return Promise.reject(Error('An interactive terminal is required.'));
  return new Promise((resolve, reject) => {
    const input = process.stdin, previous = Boolean(input.isRaw); let value = '';
    readline.emitKeypressEvents(input); input.setRawMode(true); input.resume(); process.stdout.write(label);
    function finish(error) {
      input.removeListener('keypress', key); input.setRawMode(previous); input.pause(); process.stdout.write('\n');
      if (error) reject(error); else resolve(value);
    }
    function key(text, event = {}) {
      if (event.ctrl && event.name === 'c') return finish(Error('Cancelled.'));
      if (event.name === 'return' || event.name === 'enter') return finish();
      if (event.name === 'backspace') value = value.slice(0, -1);
      else if (text && !event.ctrl && !event.meta && !/[\x00-\x1f\x7f]/.test(text)) value += text;
    }
    input.on('keypress', key);
  });
}
module.exports = { hiddenPassword };
