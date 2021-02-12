const { createLogger, format, transports } = require('winston');
const winston = require('winston');
require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');

const { NODE_ENV, APP_NAME } = process.env;
const env = NODE_ENV || 'development';
const filename = path.join('log', `${APP_NAME}-%DATE%.log`);
const transport = new (winston.transports.DailyRotateFile)({
	filename,
	datePattern: 'YYYY-MM-DD-HH',
	zippedArchive: true,
	maxSize: '20m',
	maxFiles: '14d'
});

// Create the log directory if it does not exist
if (!fs.existsSync('log')) {
	fs.mkdirSync('log');
}

const logger = createLogger({
	// change level if in dev environment versus production
	level: env === 'development' ? 'debug' : 'info',
	format: format.combine(
		format.timestamp({
			format: 'YYYY-MM-DD HH:mm:ss'
		}),
		format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
	),
	transports: [
		new transports.Console({
			level: 'info',
			format: format.combine(
				format.colorize(),
				format.printf(
					info => `${info.timestamp} ${info.level}: ${info.message}`
				)
			)
		}),
		transport,
	]
});

logger.stream = {
	write: function (message, encoding) {
		logger.info(message.trim());
		if (encoding) logger.info(encoding);
	}
};
module.exports = logger;