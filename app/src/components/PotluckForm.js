import React, { useState } from 'react';
import TopBar from './TopBar';
import {Container} from '@mui/material';
import moment from 'moment';

const PotluckForm = ({fname, start_time, address}) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [dish, setDish] = useState('');
    const time = moment(start_time).format('h:mm A');
    const day = moment(start_time).format('dddd, MMMM Do');

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
                <div>You have an upcoming dinner at <b>{time}</b> on <b>{day}</b>. It will take place at {address}.</div>
                
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