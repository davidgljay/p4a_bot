import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Input from '@mui/material/Input';

const DietaryRequirement = ({dietReq, setDietReq}) => {
    const [addPreference, setAddPreference] = useState(null);

    useEffect(() => {
        if (dietReq != '') {
            setAddPreference(true);
        }
    }, [dietReq]);
    
    

    return (
        <div style={styles.container}>
            {addPreference === null && 
                <div>
                    <div style={styles.header}>Do you have any dietary requirements?</div>
                    <div style={styles.buttonContainer}>
                        <Button sx={styles.button} color='primary' onClick={() => setAddPreference(true)}>Yes</Button>
                        <Button sx={styles.button} color='primary' onClick={() => setAddPreference(false)}>No</Button>
                    </div>
                </div>
         }
            
            {addPreference && 
                <div style={styles.inputContainer}>
                    <div style={styles.header}><i>Please be sure to clearly state any dietary requirements, including allergies.</i></div>
                    <Input style={styles.input} type="text" placeholder='e.g. Vegetarian' value={dietReq}/>
                </div>
            }
            {addPreference == false && <div sx={styles.header}>Thanks for letting us know!</div>}
        </div>
    );
};

const styles = {
    container: {
        margin: '2rem'
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
        width: '100%',
    },
    button: {
        margin: '0.5rem',
        fontSize: '.75rem',
    },
    input: {
        marginTop: '1rem',
        width: '100%',
        maxWidth: '400px'
    },
    inputContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    }

};

export default DietaryRequirement;