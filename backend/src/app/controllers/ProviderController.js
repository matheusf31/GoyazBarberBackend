/*
  Novo controller pois quero listar apenas um tipo de usuário (os providers)
  No controller de usuário é listado todo tipo de usuário
*/

import * as Yup from 'yup';
import User from '../models/User';
import File from '../models/File';

class ProviderController {
  async index(req, res) {
    const providers = await User.findAll({
      where: { provider: true },
      attributes: ['id', 'name', 'email', 'avatar_id', 'phone'],
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['name', 'path', 'url'],
        },
      ],
    });

    return res.json(providers);
  }

  async store(req, res) {
    const phoneRegExp = /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/;

    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      phone: Yup.string()
        .required()
        .matches(phoneRegExp, 'Número de telefone inválido'),
    });

    // Se retornar false é pq o body não está valido e entra no if
    if (!(await schema.isValid(req.body))) {
      return res
        .status(400)
        .json({ error: 'Erro de validação. Verifique seus dados.' });
    }

    const userIsProvider = await User.findByPk(req.userId);

    if (!userIsProvider.provider) {
      return res.status(401).json({ error: 'Você não é um provedor' });
    }

    const userExists = await User.findOne({
      where: {
        email: req.body.email,
      },
    });

    // Interrompe o fluxo se já existir um usuário
    if (userExists) {
      return res.status(400).json({ error: 'Usuário já existe.' });
    }

    const { id, name, email, provider, phone } = await User.create(req.body);

    return res.json({ id, name, email, provider, phone });
  }
}

export default new ProviderController();
