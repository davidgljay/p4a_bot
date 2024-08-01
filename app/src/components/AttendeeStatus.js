import React from 'react';
import Button from '@mui/material/Button';

const AttendeeStatus = ({ status, setStatus }) => {
    return (
        <div style={styles.container}>
            <div style={styles.header}>You are currently listed as:</div>
            <div style={styles.buttonContainer}>
                <Button sx={styles.button} variant={status ==='accepted' ? 'contained' : 'text'} color="success" onClick={() => setStatus('accepted')}>
                    Attending
                </Button>
                <Button sx={styles.button} variant={status=='tentative' ? 'contained' : 'text'} color="warning" onClick={() => setStatus('tentative')}>
                    Maybe
                </Button>
                <Button sx={styles.button} variant={status=='declined' ? 'contained' : 'text'} color="error" onClick={() => setStatus('declined')}>
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
        flexWrap: 'wrap',
    },
    button: {
        margin: '0.5rem',
        fontSize: '1rem',
        maxWidth: '400px',
    }
};

export default AttendeeStatus;