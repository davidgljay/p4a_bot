const { google } = require('googleapis');

// Function to update attendees of a Google Calendar event
async function updateEventAttendees(eventId, attendees) {
    try {
        // Create a new instance of the Google Calendar API
        const calendar = google.calendar({ version: 'v3' });

        // Construct the request body with the updated attendees
        const requestBody = {
            attendees: attendees.map((attendee) => ({ email: attendee })),
        };

        // Update the event with the new attendees
        await calendar.events.patch({
            calendarId: 'primary', // Replace with your calendar ID
            eventId,
            requestBody,
        });

        console.log('Attendees updated successfully!');
    } catch (error) {
        console.error('Error updating attendees:', error);
    }
}

// Function to authenticate with Google Calendar if not already authenticated
function authenticate() {
    // Check if the user is already authenticated
    if (!google.auth.getClient()) {
        // If not authenticated, create a new OAuth2 client
        const auth = new google.auth.OAuth2(
            'YOUR_CLIENT_ID',
            'YOUR_CLIENT_SECRET',
            'YOUR_REDIRECT_URL'
        );
        // Set the credentials for the client
        auth.setCredentials({
            access_token: 'YOUR_ACCESS_TOKEN',
            refresh_token: 'YOUR_REFRESH_TOKEN',
        });
        // Set the client for the Google Calendar API
        google.options({ auth });
    }
}

// Call the authenticate function before using any Google Calendar API methods
authenticate();

module.exports = {
    updateEventAttendees,
};