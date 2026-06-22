const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};

const verifyPassword = async (password, hashed) => {
    return await bcrypt.compare(password, hashed);
};

const createToken = (data) => {
    return jwt.sign(
        {
            id: data.id,
            email: data.email,
            nombre: data.nombre,
            rol: data.rol
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );
};

module.exports = {
    hashPassword,
    verifyPassword,
    createToken
};