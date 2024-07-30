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
};