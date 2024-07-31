import DishSignup from './DishSignup';

const meta = {
  component: DishSignup,
};

export default meta;

export const Default = {
  args: {
    dishSignups: [
      {
        title: 'main',
        have: 1,
        need: 2
      },
      {
        title: 'side',
        have: 2,
        need: 2
      },
      {
        title: 'dessert',
        have: 0,
        need: 1
      },
      {
        title: 'drink',
        have: 2,
        need: 2
      }
    ],
    setDishSignup: () => {},
    userDishSignup: 'main',
    groupDietReq: [],
    numGuests: 10
  }
};

export const NoDishSignups = {
  args: {
    dishSignups: [
      {
        title: 'main',
        have: 0,
        need: 2
      },
      {
        title: 'side',
        have: 0,
        need: 2
      },
      {
        title: 'dessert',
        have: 0,
        need: 1
      },
      {
        title: 'drink',
        have: 0,
        need: 2
      }
    ],
    setDishSignup: () => {},
    userDishSignup: null,
    groupDietReq: ['vegan', 'vegetarian', 'gluten free', 'shellfish allergy'],
    numGuests: 10
  }
};

export const FullDishSignups = {
  args: {
    dishSignups: [
      {
        title: 'main',
        have: 2,
        need: 2
      },
      {
        title: 'side',
        have: 2,
        need: 2
      },
      {
        title: 'dessert',
        have: 1,
        need: 1
      },
      {
        title: 'drink',
        have: 2,
        need: 2
      }
    ],
    setDishSignup: () => {},
    userDishSignup: 'drink',
    groupDietReq: ['vegan', 'vegetarian', 'gluten free', 'shellfish allergy'],
    numGuests: 10
  }
};