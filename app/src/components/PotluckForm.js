import React, { useEffect, useState } from 'react';
import TopBar from './TopBar';
import {Button, Container} from '@mui/material';
import moment from 'moment';
import AttendeeStatus from './AttendeeStatus';
import DietaryRequirement from './DietaryRequirement';
import DishSignup from './DishSignup';

const PotluckForm = ({fname, start_time, address, status, dishSignups, userDishSignup, dietReqs, groupDietReqs, numGuests}) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [dish, setDish] = useState('');
    const [statusState, setStatus] = useState(status);
    const [dietaryRequirements, setDietaryRequirements] = useState(dietReqs);
    const [userDishSignupState, setUserDishSignup] = useState(userDishSignup);
    const [dishSignupsState, setDishSignups] = useState(dishSignups);
    const [submitted, setSubmitted] = useState(false);
    const time = moment(start_time).format('h:mm A');
    const day = moment(start_time).format('dddd, MMMM Do');
    const map_url = `https://www.google.com/maps/search/?api=1&query=${address}`;

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
            if (dish.title === userDishSignupState) {
                dish.have =  dishSignups[index].have + 1;
            }
            return dish;
        }));
    }, [userDishSignupState]);

    const handleSubmit = () => {setSubmitted(true)};

    return (
        <div>
            <TopBar/>
            <Container maxWith='sm' style={styles.container}>
                <div style={styles.headerText}>
                    <h2>Hi {fname},</h2>
                    <div >You have an upcoming dinner at <b>{time}</b> on <b>{day}</b>. It will take place at <a href={map_url} target="_blank">{address}</a>.</div>
                </div>
                <AttendeeStatus status={statusState} setStatus={setStatus}/>
                <DietaryRequirement dietReq={dietaryRequirements} setDietReq={setDietaryRequirements}/>
                <DishSignup dishSignups={dishSignupsState} setUserDishSignup={setUserDishSignup} userDishSignup={userDishSignupState} groupDietReqs={groupDietReqs} numGuests={numGuests}/>
                <Button variant='contained' color='success' onClick={() => handleSubmit()}>Submit</Button>
                {submitted && userDishSignupState && <div style={styles.header}>Thank you for signing up! See you at the dinner.</div>}
                {submitted && !userDishSignupState && <div style={{...styles.header, color: 'red'}}>Please select a dish to bring.</div>}
            </Container>
        </div>
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
        textAlign: 'center'
    },
    header: {
        fontSize: '1rem',
        textAlign: 'center',
        margin: '.5rem',
        marginTop: '1.5rem',
    },
}

export default PotluckForm;