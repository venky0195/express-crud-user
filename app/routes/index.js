const userRoutes = require('./user_routes');

module.exports = (app) => {
	app.use(process.env.APIVERSION,
		userRoutes,
	)
};