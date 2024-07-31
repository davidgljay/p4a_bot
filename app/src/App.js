import PotluckForm from "./components/PotluckForm";

this.state = {
  fname: null,
  start_time: null,
  address: null,
  status: null,
  dietaryRequirements: null,
  dishSignups: [],
  userDishSignup: null,
  groupDietReqs: [],
  numGuests: null
}

componentDidMount() {
  fetch('http://localhost:3001/potluck')
    .then(response => response.json())
    .then(data => {
      this.setState({
        fname: data.fname,
        start_time: data.start_time,
        address: data.address,
        status: data.status,
        dietaryRequirements: data.dietary_requirements,
        dishSignups: data.dish_signups,
        groupDietReqs: data.group_dietary_requirements,
        numGuests: data.num_guests
      });
    });
}

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
} 

function App() {
  return (
    <div className="App">
      <PotluckForm {...this.state} uploadForm={uploadForm}/>
    </div>
  );
}

export default App;
