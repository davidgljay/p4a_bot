import Button from '@mui/material/Button';
import Input from '@mui/material/Input';

const DishSignup = ({dishSignups, setUserDishType , userDishType, groupDietReqs, userDishText, setUserDishText, numGuests}) => {

    const getCurrentlyNeededDishes = (dishSignups) => {
        const neededDishes = dishSignups.filter(dish => dish.have < dish.need );
        return neededDishes;
    }

    const getUseMoreDishes = (dishSignups) => {
        const useMoreDishes = dishSignups.filter(dish => dish.have >= dish.need );
        return useMoreDishes;
    }

    return (
        <div style={styles.container}>
            <h3 style={{marginBottom: '0px'}}>What would you like to bring?</h3>
               {getCurrentlyNeededDishes(dishSignups).length > 0 && <div style={styles.header}>Currently Needed</div>}
                <div style={styles.buttonContainer}>
                    {getCurrentlyNeededDishes(dishSignups).map((dish, index) => (
                        <Button color="success" onClick={() => setUserDishType(dish.title)} variant={ dish.title == userDishType ? 'contained' : 'text' } key={index}>{dish.title} ({dish.have}/{dish.need})</Button>
                    ))}
                </div>
                {getUseMoreDishes(dishSignups).length > 0 && <div style={styles.header}>Could Use More</div>}
                <div style={styles.buttonContainer}>
                    {getUseMoreDishes(dishSignups).map((dish, index) => (
                        <Button color="success" onClick={() => setUserDishType(dish.title)} variant={ dish.title == userDishType ? 'contained' : 'text' } key={index}>{dish.title}  ({dish.have}/{dish.need})</Button>
                    ))}
                </div>
                <div style={{fontStyle: 'italic', marginTop: '60px', marginBottom: '10px'}}>We expect {numGuests} guests with the following dietary requirements:</div>
                <div >{groupDietReqs.length > 0 ? groupDietReqs.join(' | ') : <div>None Provided So Far</div>}</div>
                <div style={styles.header}>What are you planning to bring?</div>
                <div style={styles.inputContainer}>
                    <Input style={styles.input} type="text" placeholder='Store bought is fine!' value={userDishText} onChange={(e) => setUserDishText(e.target.value)}/>
                </div>
            </div>

    );
};


const styles = {
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
        marginTop: '60px',
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
        width: '400px'
    },
    inputContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    }

};

export default DishSignup;