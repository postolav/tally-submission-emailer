import logAction from './logger';

const nodemailer = require('nodemailer');
const express = require('express');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');


const app = express();
app.use(express.json());

// Email transporter using Gmail SMTP
// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: { user: 'team@uniportal.io', pass: 'jodz uwoa gpar sgms' }
// });


// Reading HTML template
const readHTMLFile = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, { encoding: 'utf-8' }, (err, html) => {
            if (err) reject(err);
            else resolve(html);
        });
    });
};

// Sending the email
const sendEmail = async (toEmail, subject, templateName, replacements) => {
    try {
        const html = await readHTMLFile(path.join(__dirname, 'templates', `${templateName}.hbs`));
        const template = handlebars.compile(html);
        const htmlToSend = template(replacements);

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: true, // initial value was false
            auth: { user: 'team@uniportal.io', pass: 'jodz uwoa gpar sgms' }
        });

        const mailOptions = {
            from: 'team@uniportal.io',
            to: toEmail,
            subject: subject,
            html: htmlToSend
        };

        const info = await transporter.sendMail(mailOptions);
        logAction('Email sent to ', toEmail, ' :', info.response);
    } catch (error) {
        logAction('Error sending email:', error);
    }
};

// Webhook endpoint
app.post('/webhook', (req, res) => {
    // Verify signature
    const receivedSignature = req.headers['tally-signature'];
    const signingSecret = 'ac0ed02d-dcb0-4f62-a50b-6233151e02fa';

    const calculatedSignature = createHmac('sha256', signingSecret)
        .update(JSON.stringify(req.body))
        .digest('base64');

    if (receivedSignature === calculatedSignature) {
        // Signature is valid, process the body
        const message = 'Webhook received & processed successfully';
        res.status(200).send(message);
        logAction(message);
    } else {
        const message = 'Invalid signature';
        res.status(401).send(message);
        logAction(message);
    }

    // const hmac = crypto.createHmac('sha256', process.env.signingSecret);
    // const digest = hmac.update(JSON.stringify(req.body)).digest('base64');

    // if (signature !== digest) return res.status(401).send('Invalid signature');

    // Extract respondent email from payload
    const { fields } = req.body.data;
    const respondentEmail = fields.find(field => field.label === "Your Email"); // Matching form email field ID
    const respondentName = fields.find(field => field.label === "Your Name"); // Matching form email field ID


    //Send email
    // transporter.sendMail({
    //     from: 'team@uniportal.io',
    //     to: respondentEmail,
    //     subject: '', // TODO include email subject
    //     html: '' // TODO include email body
    // });

    sendEmail(respondentEmail, '🚀 One Step Closer to Stress-Free Workflows', 'welcomeEmail', { firstName: respondentName });

    res.sendStatus(200);
});

app.listen(3000);