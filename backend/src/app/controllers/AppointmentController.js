import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format } from 'date-fns';
import pt from 'date-fns/locale/pt';

import Appointment from '../models/Appointment';
import File from '../models/File';
import User from '../models/User';
import Notification from '../schemas/Notification';

class AppointmentController {
  async index(req, res) {
    /**
     * essa listagem é para o usuário comum
     * enviar o tipo do corte (só corte ou corte e barba)
     */

    const { page = 1 } = req.query;

    const appointments = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'],
      limit: 20,
      offset: (page - 1) * 20, // pular (ou não) 20 registros para listar apenas 20
      attributes: ['id', 'date'],
      include: [
        {
          model: User, // para retornar os dados do relacionamento
          as: 'provider', // qual dos relacionamentos
          attributes: ['id', 'name'], // quais atributos que quero buscar
          include: [
            {
              model: File, // para retornar o avatar do provedor
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });

    return res.json(appointments);
  }

  async store(req, res) {
    /**
     * colocar se o corte é apenas corte ou é corte e barba
     * fazer a verificação se nenhum foi marcado (invalido)
     * fazer a verificação se os dois foram marcados (invalido)
     */

    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { provider_id, date } = req.body;

    // Checando se provider_id é um provedor
    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider) {
      return res
        .status(400)
        .json({ error: 'You can only appointment with providers ' });
    }

    /* 
      parseISO vai transformar a string passada no req.body em um objeto DATE
      startOfHower vai pegar apenas o início da hora
      OBSERVAÇÃO: PROVAVELMENTE TEREI QUE ALTERAR ESSA LINHA PARA SE ENCAIXAR COM OS HORÁRIOS DO THIAGO
      aqui no caso ele faz uma verificação do tipo: se eu tenho um horário pras 18 e estou tentando marcar
      pra 18:30 eu não poderei marcar;
    */

    // Checando se a data/hora escolhida está ANTES da data/hora atual
    const hourStart = startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permited' });
    }

    // Checando se o provedor já não tem um agendamento marcado pro mesmo horário
    const checkAvailability = await Appointment.findOne({
      where: { provider_id, canceled_at: null, date: hourStart },
    });

    if (checkAvailability) {
      return res
        .status(400)
        .json({ error: 'Appointment date is not available' });
    }

    // Como passou todas as verificações vou criar o agendamento na DB
    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date: hourStart,
    });

    /**
     * Notify appointment provider
     */

    const user = await User.findByPk(req.userId);
    const formatedDate = format(hourStart, "'dia' dd 'de' MMMM', às' H:mm'h'", {
      locale: pt,
    });

    await Notification.create({
      content: `Novo agendamento de ${user.name} para ${formatedDate}`,
      user: provider_id,
    });

    return res.json(appointment);
  }
}

export default new AppointmentController();
