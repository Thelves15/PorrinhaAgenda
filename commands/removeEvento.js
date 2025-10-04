const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removeevento')
        .setDescription('Remove um evento pelo ID')
        .addIntegerOption(option =>
            option.setName('id')
                .setDescription('ID do evento')
                .setRequired(true)),

    async execute(interaction, db) {
        const id = interaction.options.getInteger('id');
        await interaction.deferReply({ ephemeral: true });

        db.run(`DELETE FROM eventos WHERE id = ?`, [id], function(err) {
            if (err) {
                console.error(err);
                return interaction.editReply('❌ Erro ao remover evento.');
            }

            if (this.changes === 0) {
                return interaction.editReply(`❌ Nenhum evento encontrado com o ID ${id}.`);
            }

            interaction.editReply(`✅ Evento #${id} removido com sucesso.`);
        });
    }
};
