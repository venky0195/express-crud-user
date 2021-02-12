const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
	try {
		const token = req.headers.authorization;
		const decodedToken = jwt.verify(token, process.env.JWT_KEY);
		req.user_data = { email: decodedToken.email, _id: decodedToken._id, user_name: decodedToken.user_name };
		next();
	} catch (error) {
		res.status(401).json({ message: 'Access Denied: You are not authenticated!' });
	}
};  
