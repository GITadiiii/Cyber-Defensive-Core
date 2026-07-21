const Officer = require('../models/Officer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// POST /api/v1/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Missing email or password" });
        }

        const officer = await Officer.findOne({ email });
        if (!officer) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, officer.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const token = jwt.sign(
            { officerId: officer._id, email: officer.email },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });

        return res.status(200).json({ success: true, email: officer.email });

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// POST /api/v1/auth/logout
const logout = (req, res) => {
    res.clearCookie('token');
    return res.status(200).json({ success: true });
};

module.exports = { login, logout };