const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addevento')
        .setDescription('Adiciona uma prova ou trabalho ao calendário')
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
                  .setDescription('Horário do evento (opcional)')
                  .setRequired(false)),
    async execute(interaction, db) {
        const tipo = interaction.options.getString('tipo');
        const materia = interaction.options.getString('materia');
        const descricao = interaction.options.getString('descricao');
        const data = interaction.options.getString('data');
        const hora = interaction.options.getString('hora') || '';

        // Inserir no banco de dados
        const sql = `INSERT INTO eventos (tipo, materia, descricao, data, hora) VALUES (?, ?, ?, ?, ?)`;
        db.run(sql, [tipo, materia, descricao, data, hora], function(err) {
            if (err) {
                console.error(err);
                return interaction.reply({ content: 'Erro ao registrar o evento.', ephemeral: true });
            }

            interaction.reply({
                content: `✅ Evento registrado: [${tipo === 'prova' ? '📘 Prova' : '📝 Trabalho'}] ${materia} - ${descricao} em ${data}${hora ? ' às ' + hora : ''}`
            });
        });
    }
};
