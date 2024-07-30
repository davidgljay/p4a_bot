import React, { useEffect, useState } from 'react';
import TopBar from './TopBar';
import {Container} from '@mui/material';
import moment from 'moment';
import AttendeeStatus from './AttendeeStatus';

const PotluckForm = ({fname, start_time, address, status}) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [dish, setDish] = useState('');
    const [statusState, setStatus] = useState(status);
    const time = moment(start_time).format('h:mm A');
    const day = moment(start_time).format('dddd, MMMM Do');
    const map_url = `https://www.google.com/maps/search/?api=1&query=${address}`;

    useEffect(() => {
        console.log('Status updated:', statusState);
        // Add any additional logic you want to run when statusState updates
    }, [statusState]); // Dependency array with statusState


    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission logic here
        console.log('Form submitted!');
        console.log('Name:', name);
        console.log('Email:', email);
        console.log('Dish:', dish);
    };

    return (
        <div>
            <TopBar/>
            <Container maxWith='sm'>
                <h2>Hi {fname},</h2>
                <div>You have an upcoming dinner at <b>{time}</b> on <b>{day}</b>. It will take place at <a href={map_url} target="_blank">{address}</a>.</div>
                <AttendeeStatus status={statusState} setStatus={setStatus}/>
                <form onSubmit={handleSubmit}>
                    <label>
                        Name:
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                    </label>
                    <br />
                    <label>
                        Email:
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </label>
                    <br />
                    <label>
                        Dish:
                        <input type="text" value={dish} onChange={(e) => setDish(e.target.value)} />
                    </label>
                    <br />
                    <button type="submit">Submit</button>
                </form>
            </Container>
        </div>
    );
};

export default PotluckForm;