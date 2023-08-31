const jwt = require('jsonwebtoken');

const getEmailFromToken = (token) => {
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        return decodedToken.email;
    } catch (error) {
        return null;
    }
};

module.exports = {
    getEmailFromToken
};
