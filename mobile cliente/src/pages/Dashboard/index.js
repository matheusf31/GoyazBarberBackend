import React, { useEffect, useState } from 'react';
import { withNavigationFocus } from '@react-navigation/compat';

import api from '~/services/api';

import Background from '~/components/Background';
import Appointment from '~/components/Appointment';

import { Container, Title, List } from './styles';

function Dashboard({ isFocused }) {
  const [appointments, setAppointments] = useState([]);
  const [isFetching, setIsFetching] = useState(false);

  async function loadAppointments() {
    const response = await api.get('appointments');
    setAppointments(response.data);
  }

  useEffect(() => {
    if (isFocused) {
      loadAppointments();
    }
  }, [isFocused]);

  async function handleAppointmentsRefresh(Fetching) {
    if (Fetching) {
      setIsFetching(true);
    }

    await loadAppointments();

    if (Fetching) {
      setIsFetching(false);
    }
  }

  async function handleCancel(id) {
    const response = await api.delete(`appointments/${id}`);

    setAppointments(
      appointments.map(appointment =>
        appointment.id === id
          ? {
              ...appointment,
              canceled_at: response.data.canceled_at,
            }
          : appointment
      )
    );

    handleAppointmentsRefresh(false);
  }

  return (
    <Background>
      <Container>
        <Title>Agendamentos</Title>

        <List
          data={appointments}
          onRefresh={() => handleAppointmentsRefresh(true)}
          refreshing={isFetching}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <Appointment data={item} onCancel={() => handleCancel(item.id)} />
          )}
        />
      </Container>
    </Background>
  );
}

export default withNavigationFocus(Dashboard);
