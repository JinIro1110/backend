const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.mailtrap.io',
    port: 2525,
    auth: {
        user: '3147e2b22e5e69',
        pass: '351d7661ec5b29'
    }
});

exports.sendEmail = (to, subject, html) => {
    const mailOptions = {
        from: 'TEAM-BRIDGE@example.com',
        to,
        subject,
        html
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
};
