// commands/removeEvento.js
module.exports = {
    data: {
        name: 'removeevento',
        description: 'Remove um evento pelo ID',
        options: [
            {
                name: 'id',
                type: 4, // tipo inteiro
                description: 'ID do evento a ser removido',
                required: true
            }
        ]
    },
    async execute(interaction, db) {
        await interaction.deferReply({ ephemeral: true }); // evita timeout

        const id = interaction.options.getInteger('id');

        db.run(`DELETE FROM eventos WHERE id = ?`, [id], function(err) {
            if (err) {
                console.error(err);
                return interaction.editReply('❌ Erro ao remover evento.');
            }

            if (this.changes === 0) {
                return interaction.editReply(`❌ Nenhum evento encontrado com ID #${id}.`);
            }

            interaction.editReply(`✅ Evento #${id} removido com sucesso!`);
        });
    }
};
