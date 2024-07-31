import React from 'react';
import Button from '@mui/material/Button';

const AttendeeStatus = ({ status, setStatus }) => {
    return (
        <div style={styles.container}>
            <div style={styles.header}>You are currently listed as:</div>
            <div style={styles.buttonContainer}>
                <Button sx={styles.button} variant={status=='Accepted' ? 'contained' : 'outlined'} color="success" onClick={() => setStatus('Accepted')}>
                    Attending
                </Button>
                <Button sx={styles.button} variant={status=='Maybe' ? 'contained' : 'outlined'} color="warning" onClick={() => setStatus('Maybe')}>
                    Maybe
                </Button>
                <Button sx={styles.button} variant={status=='Declined' ? 'contained' : 'outlined'} color="error" onClick={() => setStatus('Declined')}>
                    Regrets
                </Button>
            </div>
        </div>

    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    header: {
        fontSize: '1rem',
        textAlign: 'center',
        margin: '.5rem',
        marginTop: '1rem',
    },
    buttonContainer: {
        display: 'flex',
        justifyContent: 'center',
    },
    button: {
        margin: '0.5rem',
        fontSize: '1rem',
        maxWidth: '400px',
        '@media (max-width: 600px)': {
            fontSize: '0.5rem',
        }
    }
};

export default AttendeeStatus;