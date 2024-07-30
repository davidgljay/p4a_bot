import React from 'react';
import Button from '@mui/material/Button';

const AttendeeStatus = ({ status, setStatus }) => {
    return (
        <div>
            <p>You are currently listed as:</p>
            <div style={styles.buttonContainer}>
                <Button style={styles.button} variant={status=='Accepted' ? 'contained' : 'outlined'} color="success" onClick={() => setStatus('Accepted')}>
                    Attending
                </Button>
                <Button style={styles.button} variant={status=='Maybe' ? 'contained' : 'outlined'} color="warning" onClick={() => setStatus('Maybe')}>
                    Maybe
                </Button>
                <Button style={styles.button} variant={status=='Declined' ? 'contained' : 'outlined'} color="error" onClick={() => setStatus('Declined')}>
                    Regrets
                </Button>
            </div>
        </div>

    );
};

const styles = {
    buttonContainer: {
        display: 'flex',
        justifyContent: 'center',
    },
    button: {
        margin: '0.5rem',
        width: '1200px',
    }
};

export default AttendeeStatus;