const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addevento')
        .setDescription('Adiciona uma prova ou trabalho')
        .addStringOption(option =>
            option.setName('tipo')
                .setDescription('Tipo de evento: prova ou trabalho')
                .setRequired(true)
                .addChoices(
                    { name: 'Prova', value: 'prova' },
                    { name: 'Trabalho', value: 'trabalho' }
                ))
        .addStringOption(option =>
            option.setName('materia')
                .setDescription('Nome da disciplina')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('descricao')
                .setDescription('Descrição do evento')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('data')
                .setDescription('Data do evento (DD/MM/YYYY)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('hora')
                .setDescription('Hora do evento (HH:MM) opcional')
                .setRequired(false)),

    async execute(interaction, db) {
        const tipo = interaction.options.getString('tipo');
        const materia = interaction.options.getString('materia');
        const descricao = interaction.options.getString('descricao');
        const data = interaction.options.getString('data');
        const hora = interaction.options.getString('hora') || '';

        try {
            await interaction.deferReply({ ephemeral: true });
            db.run(`INSERT INTO eventos (tipo, materia, descricao, data, hora) VALUES (?, ?, ?, ?, ?)`,
                [tipo, materia, descricao, data, hora],
                function(err) {
                    if (err) {
                        console.error(err);
                        interaction.editReply({ content: '❌ Erro ao registrar evento.' });
                    } else {
                        interaction.editReply({ content: `✅ Evento registrado (#${this.lastID}): [${tipo}] ${materia} - ${descricao} em ${data} ${hora}` });
                    }
                });
        } catch (err) {
            console.error(err);
            await interaction.editReply({ content: '❌ Ocorreu um erro.' });
        }
    }
};
