import React, { useState } from 'react';



const PotluckForm = ({title}) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [dish, setDish] = useState('');

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
            <h1>{title}</h1>
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
        </div>
    );
};

export default PotluckForm;