import { load } from "js-yaml";
import PotluckForm from "./components/PotluckForm";
import CircularProgress from '@material-ui/core/CircularProgress';


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
    //   dishtypes: array of dish types with the number needed of each dish.
    //   event_registrations: [{
    //     status: Status of the registered user,
    //     name: Name of the registered user,
    //     dish_text: Dish of the registered user,
    //     dish_type: Dish type of the registered user,
    //     diet_req: Dietary requirements of the registered user,
    // }]
    // }

    fetch('http://localhost:3001/potluck')
      .then(response => response.json())
      .then(data => {
        let dishSignups = [];
        for (let i = 0; i < data.dishtypes.length; i++) {
          dishSignups.push({
            title: data.dishtypes[i],
            have: 0,
            need: data.dishtypes[i].need
          });
          for (let j = 0; j < data.event_registrations.length; j++) {
            if (data.event_registrations[j].dish_type.downcase() === data.dishtypes[i].downcase() && data.event_registrations[j].status.downcase() === 'accepted') {
              dishSignups[i].have++;
            }
          }
        }

        let groupDietReqs = [];
        numGuests = 0;
        for (let i = 0; i < data.event_registrations.length; i++) {
          if (data.event_registrations[i].status.downcase() !== 'accepted') {
            continue;
          }
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
      this.setState({
        err,
        loaded: true
      });
  };

  uploadForm = (userDishSignup, dietReqs, dishText, status) => {
    fetch('http://localhost:3001/potluck', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userDishSignup,
        dietReqs,
        dishText,
        status
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log(data);
    });
  };

  render() {
    return (
      <div className="App">
        {loaded && !err ? <PotluckForm {...this.state} uploadForm={uploadForm}/> : <CircularProgress/>}
        {err && <div>
            <h1>Error loading form</h1>
            <div>{err}</div>
          </div>}
      </div>
    );
};
};

export default App;
