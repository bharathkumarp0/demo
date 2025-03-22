const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const app = express();
const PORT = 3000;

let users = []; // In-memory user storage
let resetTokens = {}; // In-memory reset token storage

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Mock email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-email-password'
    }
});

app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ email, password: hashedPassword });
    res.json({ success: true });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.user = user;
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Invalid email or password' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.post('/request-reset', (req, res) => {
    const { email } = req.body;
    const user = users.find(u => u.email === email);
    if (user) {
        const token = crypto.randomBytes(20).toString('hex');
        resetTokens[token] = email;
        const resetLink = `http://localhost:${PORT}/reset-password?token=${token}`;
        transporter.sendMail({
            to: email,
            subject: 'Password Reset',
            text: `Click the following link to reset your password: ${resetLink}`
        });
        res.json({ success: true, message: 'Password reset link sent to your email.' });
    } else {
        res.json({ success: false, message: 'Email not found.' });
    }
});

app.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    const email = resetTokens[token];
    if (email) {
        const user = users.find(u => u.email === email);
        if (user) {
            user.password = await bcrypt.hash(newPassword, 10);
            delete resetTokens[token];
            res.json({ success: true, message: 'Password reset successful.' });
        } else {
            res.json({ success: false, message: 'User not found.' });
        }
    } else {
        res.json({ success: false, message: 'Invalid or expired token.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});