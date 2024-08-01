import React from "react";
import PotluckForm from "./components/PotluckForm";
import CircularProgress from '@mui/material/CircularProgress';


class App extends React.Component {
  state = {
    loaded: false,
    fname: null,
    event_start: null,
    address: null,
    status: null,
    dietaryRequirements: null,
    dishSignups: [],
    userDishSignup: null,
    groupDietReqs: [],
    numGuests: null,
    err: null
  };

  componentDidMount() {
    //Get data to populat the form. Data expected of format:
    // {
    //   fname: First name of the registered user,
    //   event_start: Start time of the event,
    //   event_address: address of the event,
    //   status: Registered user status,
    //   user_diet_req: Dietary requirements of the registered user,
    //   user_dish_type: Dish type of the registered user,
    //   user_dish_text: Dish text of the registered user,
    //   dish_types: array of dish types with the number needed of each dish.
    //   event_registrations: [{
    //     status: Status of the registered user,
    //     name: Name of the registered user,
    //     dish_text: Dish of the registered user,
    //     dish_type: Dish type of the registered user,
    //     diet_req: Dietary requirements of the registered user,
    // }]
    // }

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    fetch('http://localhost:5001/potlucks4change/us-central1/get_registration?client_org=p4c&id=' + id)
      .then(response => {
        console.log('Response:', response);
        if (!response.ok) {
          throw new Error('Failed to load form');
        }
        return response.json();
      })
      .then(data => {
        console.log('Recieved data:', data);
        let dishSignups = [];
        for (let i = 0; i < data.dish_types.length; i++) {
          dishSignups.push({
            title: data.dish_types[i].type,
            have: 0,
            need: data.dish_types[i].need
          });
          for (let j = 0; j < data.event_registrations.length; j++) {
            if (data.event_registrations[j].dish_type && data.event_registrations[j].dish_type.downcase() === data.dish_types[i].type.downcase()) {
              dishSignups[i].have++;
            }
          }
        }

        let groupDietReqs = [];
        let numGuests = 0;
        for (let i = 0; i < data.event_registrations.length; i++) {
          if (data.event_registrations[i].diet_req) {
            groupDietReqs.push(data.event_registrations[i].diet_req);
          }
          numGuests++
        }
        
        this.setState({
          fname: data.fname,
          eventStart: data.event_start,
          eventAddress: data.address,
          status: data.status,
          userDietReq: data.user_diet_req,
          userDishType: data.user_dish_type,
          userDishText: data.user_dish_text,
          dishSignups,
          groupDietReqs,
          numGuests,
          loaded: true
        });
    })
    .catch(err => {
      console.log('Error loading form:', err);
      this.setState({
        err,
        loaded: true
      })
    });
  };

  uploadForm = (userDishType, userDietReqs, userDishText, status) => {
    fetch('http://localhost:3001/potluck', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_org: 'p4c',
        registration_id: id,
        user_dish_type: userDishType,
        user_diet_reqs: userDietReqs,
        user_dish_text: userDishText,
        status
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log(data);
    });
  };

  render() {
    const {loaded, err} = this.state;
    return (
        <div className="App" style={styles.container}>
          {!loaded && <CircularProgress/>}
          {loaded && !err && <PotluckForm {...this.state} uploadForm={this.uploadForm}/> }
          {err && <div>
              <h1>Error loading form</h1>
              <div>{err.toString()}</div>
            </div>}
        </div>
    );
};
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  header: {
    marginTop: '20px',
    fontSize: '20px',
    fontWeight: 'bold'
  }
};

export default App;
