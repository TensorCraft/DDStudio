const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    underscore: '\x1b[4m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',
    hidden: '\x1b[8m',
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
};

class xlog {
    constructor() { }

    debug(msg) {
        const stack = this._getStack();
        console.debug(`[${new Date().toISOString()}] ${colors.cyan}DEBUG ${colors.dim}${stack} ${msg}`);
    }

    info(msg) {
        const stack = this._getStack();
        console.info(`[${new Date().toISOString()}] ${colors.yellow}INFO${colors.green} ${stack} ${msg}`);
    }

    error(msg) {
        const stack = this._getStack();
        console.error(`[${new Date().toISOString()}] ${colors.red}ERROR${colors.white} ${stack} ${msg}`);
    }

    _getStack() {
        // get the stack trace and extract the file name, function name, and line number
        const trace = new Error().stack.split('\n')[3].trim();
        const parts = trace.match(/at (.*) \((.*):(\d+):(\d+)\)/);
        if (parts === null) {
          return '';
        }
        const file = parts[2].split('/').pop();
        const fn = parts[1];
        const line = parts[3];
        return `${colors.dim}[${file}:${line} ${fn}]${colors.reset}`;
      }
      
}

module.exports = new xlog();
