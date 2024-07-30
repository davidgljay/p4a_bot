import AttendeeStatus from './AttendeeStatus';

const meta = {
  component: AttendeeStatus,
};

export default meta;

export const Default = {
  args: {
    status: 'Accepted',
    setStatus: () => {}
  }
};