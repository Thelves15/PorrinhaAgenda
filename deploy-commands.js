require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

// Define todos os comandos
const commands = [
    new SlashCommandBuilder()
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

    new SlashCommandBuilder()
        .setName('eventos')
        .setDescription('Lista todos os eventos futuros'),

    new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove um evento pelo ID')
        .addIntegerOption(option =>
            option.setName('id')
                  .setDescription('ID do evento a ser removido')
                  .setRequired(true))
].map(command => command.toJSON());

// Cria instância do REST para registrar comandos
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Atualizando comandos (slash)...');

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );

        console.log('✅ Comandos registrados com sucesso!');
    } catch (error) {
        console.error(error);
    }
})();
