import React, { useEffect, useState } from 'react';
import TopBar from './TopBar';
import {Button, Container, ThemeProvider} from '@mui/material';
import moment from 'moment';
import AttendeeStatus from './AttendeeStatus';
import DietaryRequirement from './DietaryRequirement';
import DishSignup from './DishSignup';
import theme from '../theme';


const PotluckForm = ({fname, eventStart, eventAddress, status, dishSignups, userDishType, userDietReqs, groupDietReqs, numGuests, userDishText, uploadForm}) => {
    const [statusState, setStatus] = useState(status);
    const [userDietReqsState, setUserDietReqsState] = useState(userDietReqs);
    const [userDishTypeState, setUserDishType] = useState(userDishType);
    const [dishSignupsState, setDishSignups] = useState(dishSignups);
    const [submitted, setSubmitted] = useState(false);
    const [userDishTextState, setUserDishTextState] = useState(userDishText);
    const time = moment(eventStart).format('h:mm A');
    const day = moment(eventStart).format('dddd, MMMM Do');
    const map_url = `https://www.google.com/maps/search/?api=1&query=${eventAddress}`;

    useEffect(() => {
        console.log('Status updated:', statusState);
    }, [statusState]);
    
    useEffect(() => {
        setSubmitted(false);
        let deepCopy = [];
        for (let i = 0; i < dishSignups.length; i++) {
            deepCopy[i] = {...dishSignups[i]};
        }
        setDishSignups(deepCopy.map((dish, index) => {
            if (dish.title === userDishTypeState) {
                dish.have =  dishSignups[index].have + 1;
            }
            return dish;
        }));
    }, [userDishTypeState]);

    const handleSubmit = () => {setSubmitted(true)};

    return (
        <ThemeProvider theme={theme}>
            <div>
                <TopBar/>
                <Container maxWith='sm' sx={styles.container}>
                    <div style={styles.headerText}>
                        {fname && <h2>Hi {fname},</h2>}
                        <div >You have an upcoming dinner at <b>{time}</b> on <b>{day}</b>. {eventAddress && <span>It will take place at <a href={map_url} target="_blank">{eventAddress}</a>.</span>}</div>
                    </div>
                    <AttendeeStatus status={statusState} setStatus={setStatus}/>
                    <DietaryRequirement userDietReqs={userDietReqsState} setUserDietReqs={setUserDietReqsState}/>
                    <DishSignup dishSignups={dishSignupsState} setUserDishType={setUserDishType} userDishType={userDishTypeState} groupDietReqs={groupDietReqs} numGuests={numGuests} userDishText={userDishTextState} setUserDishText={setUserDishTextState}/>
                    <Button variant='contained' color='success' onClick={() => handleSubmit()}>Submit</Button>
                    {submitted && userDishTypeState && <div style={styles.header}>Thank you for signing up! See you at the dinner.</div>}
                    {submitted && !userDishTypeState && <div style={{...styles.header, color: 'red'}}>Please select a dish to bring.</div>}
                </Container>
            </div>
        </ThemeProvider>
    );
};

const styles = {
    headerText: {
        marginBottom: '2rem',
        textAlign: 'left'
    },
    container: {
        margin: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        '@media (max-width: 600px)': {
            margin: '0px',
        }
    },
    header: {
        fontSize: '1rem',
        textAlign: 'center',
        margin: '.5rem',
        marginTop: '1.5rem',
    },
}

export default PotluckForm;