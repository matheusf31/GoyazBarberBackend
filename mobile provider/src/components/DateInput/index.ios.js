import React, { useState, useMemo } from 'react';
import { Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import pt from 'date-fns/locale/pt';

import Icon from 'react-native-vector-icons/MaterialIcons';

import { Container, DateButton, DateText, Picker } from './styles';

export default function DateInput({ date, onChange }) {
  const [opened, setOpened] = useState(false);

  const dateFormatted = useMemo(
    () => format(date, "dd 'de' MMM 'de' yyyy", { locale: pt }),
    [date]
  );

  const handleChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setOpened(Platform.OS === 'ios');

    if (date !== undefined) {
      onChange(currentDate);
    }
  };

  return (
    <Container>
      <DateButton onPress={() => setOpened(!opened)}>
        <Icon name="event" color="#FFF" size={20} />
        <DateText>{dateFormatted}</DateText>
      </DateButton>

      {opened && (
        <Picker>
          <DateTimePicker
            date={date}
            onChange={handleChange}
            minimumDate={new Date()}
            minuteInterval={30}
            locale="pt"
            mode="date"
          />
        </Picker>
      )}
    </Container>
  );
}
