const comentarioService = require('./comentario.service');

const create = async (req, res) => {
  try {
    const id_usuario = req.usuario.id;
    const { id_estabelecimento, comentario } = req.body;

    if (!id_estabelecimento || !comentario) {
      return res.status(400).json({ message: 'ID do estabelecimento e comentário são obrigatórios.' });
    }

    const novoComentario = await comentarioService.upsertComentario(id_usuario, id_estabelecimento, comentario);
    res.status(201).json(novoComentario);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar comentário.' });
  }
};

module.exports = { create };