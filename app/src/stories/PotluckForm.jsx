import React from 'react';
import { storiesOf } from '@storybook/react';
import PotluckForm from '../components/PotluckForm';

storiesOf('PotluckForm', module)
    .add('Default', (args) => (
        <PotluckForm {...args}/>
    ));