const { google } = require('googleapis');

async function getEventAttendees(calendarId, eventId) {
    try {
        // Create a new instance of the Google Calendar API
        const calendar = google.calendar({ version: 'v3' });

        // Get the event details
        const response = await calendar.events.get({
            calendarId, // Replace with your calendar ID
            eventId,
        });

        // Get the attendees from the event
        const attendees = response.data.attendees;

        console.log('Attendees:', attendees);
        return attendees;
    } catch (error) {
        console.error('Error getting attendees:', error);
        return [];
    }
}

// Function to update attendees of a Google Calendar event
async function updateEventAttendees(calendarId, eventId, attendees) {
    try {
        // Create a new instance of the Google Calendar API
        const calendar = google.calendar({ version: 'v3' });

        // Update the event with the new attendees
        await calendar.events.patch({
            calendarId, // Replace with your calendar ID
            eventId,
            requestBody: {
                attendees,
            },
        });

        console.log('Attendees updated successfully!');
    } catch (error) {
        console.error('Error updating attendees:', error);
    }
}

// Function to authenticate with Google Calendar if not already authenticated
function authenticate(access_token, refresh_token) {
    // Check if the user is already authenticated
    if (!google.auth.getClient()) {

        // Set the credentials for the client
        auth.setCredentials({
            access_token: access_token,
            refresh_token: refresh_token,
        });
        // Set the client for the Google Calendar API
        google.options({ auth });
    }
}

module.exports = {
    getEventAttendees,
    updateEventAttendees,
    authenticate
};