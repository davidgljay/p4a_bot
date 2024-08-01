import React from 'react';
import PotluckForm from './PotluckForm';

const meta = {
  title: 'Components/PotluckForm',
  component: PotluckForm,
  argTypes: {
    status: {
      control: {
        type: 'select',
        options: ['Accepted', 'Declined', 'Maybe'],
      },
      defaultValue: 'Accepted',
    },
  },
};

export default meta;

const Template = (args) => <PotluckForm {...args} />;

export const Default = Template.bind({});
Default.args = {
  fname: 'Susan',
  start_time: '2022-01-01T18:00:00',
  address: '123 Main St, Springfield',
  status: 'Accepted',
  dietReqs: '',
  dishSignups: [
    {
      title: 'entree',
      have: 1,
      need: 2
    },
    {
      title: 'salad',
      have: 2,
      need: 2
    },
    {
      title: 'dessert',
      have: 0,
      need: 1
    },
    {
      title: 'alcoholic drink',
      have: 2,
      need: 2
    },
    {
      title: 'nonalcoholic drink',
      have: 2,
      need: 2
    }
  ],
  userDishSignup: 'entree',
  groupDietReqs: ['vegan', 'vegetarian', 'gluten free', 'shellfish allergy'],
  numGuests: 10
};

export const NoSignups = Template.bind({});
NoSignups.args = {
  fname: 'Susan',
  start_time: '2022-01-01T18:00:00',
  address: '123 Main St, Springfield',
  status: 'Accepted',
  dietReqs: '',
  dishSignups: [
    {
      title: 'entree',
      have: 0,
      need: 2
    },
    {
      title: 'salad',
      have: 0,
      need: 2
    },
    {
      title: 'dessert',
      have: 0,
      need: 1
    },
    {
      title: 'alcoholic drink',
      have: 0,
      need: 2
    },
    {
      title: 'nonalcoholic drink',
      have: 0,
      need: 2
    }
  ],
  userDishSignup: null,
  groupDietReqs: [],
  numGuests: 10
};