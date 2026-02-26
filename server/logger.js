const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, 'app.log');

const formatTime = () => new Date().toISOString();

const log = (level, message, meta = {}) => {
    const logEntry = {
        timestamp: formatTime(),
        level,
        message,
        ...meta
    };
    
    const logString = JSON.stringify(logEntry) + '\n';
    
    // Console output for development
    if (process.env.NODE_ENV !== 'test') {
        const color = level === 'ERROR' ? '\x1b[31m' : level === 'WARN' ? '\x1b[33m' : '\x1b[32m';
        console.log(`${color}[${level}] ${message}\x1b[0m`, meta && Object.keys(meta).length ? meta : '');
    }

    // File output for persistence
    fs.appendFile(logFile, logString, (err) => {
        if (err) console.error("Failed to write to log file:", err);
    });
};

module.exports = {
    info: (msg, meta) => log('INFO', msg, meta),
    warn: (msg, meta) => log('WARN', msg, meta),
    error: (msg, meta) => log('ERROR', msg, meta),
    debug: (msg, meta) => log('DEBUG', msg, meta)
};