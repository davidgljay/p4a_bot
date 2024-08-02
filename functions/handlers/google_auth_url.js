const { OAuth2Client } = require('google-auth-library');
const { google } = require('googleapis');
const clientConfig = require('../config/client_config.js');

const g_auth_config = clientConfig['p4c'].google_oauth;

const CLIENT_ID = g_auth_config.client_id;
const CLIENT_SECRET = g_auth_config.client_secret;
const REDIRECT_URI =  g_auth_config.redirect_uri;

function googleAuthUrl() {
    const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

    const scopes = [
        'https://www.googleapis.com/auth/calendar.events',
    ];

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
    });

    return authUrl;
}

function googleAuthCallback(code) {
    const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

    oauth2Client.getToken(code, (err, token) => {
        if (err) {
            console.error('Error retrieving access token', err);
            return;
        }

        oauth2Client.setCredentials(token);

        console.log('Access token:', token.access_token);
        console.log('Refresh token:', token.refresh_token);
    });
}

module.exports = { googleAuthUrl, googleAuthCallback }; ;