require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const cron = require('node-cron');
const fs = require('fs');
const moment = require('moment');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    partials: [Partials.Channel]
});

// Collection para comandos
client.commands = new Collection();

// Carrega comandos
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

// SQLite
const db = new sqlite3.Database('./database/database.sqlite', (err) => {
    if (err) console.error(err.message);
    else console.log('Conectado ao banco SQLite!');
});

db.run(`CREATE TABLE IF NOT EXISTS eventos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT,
    materia TEXT,
    descricao TEXT,
    data TEXT,
    hora TEXT
)`, () => console.log('Tabela eventos pronta!'));

// Função criar evento (para modal)
async function criarEvento(db, tipo, materia, descricao, data, hora, interaction) {
    db.run(`INSERT INTO eventos (tipo, materia, descricao, data, hora) VALUES (?, ?, ?, ?, ?)`,
        [tipo, materia, descricao, data, hora],
        function(err) {
            if (err) return interaction.editReply({ content: '❌ Erro ao registrar evento.', ephemeral: true });
            interaction.editReply({ content: `✅ Evento registrado (#${this.lastID}): [${tipo}] ${materia} - ${descricao} em ${data} ${hora || ''}`, ephemeral: true });
        }
    );
}

// Bot pronto
client.once('clientReady', async () => {
    console.log(`Bot ${client.user.tag} está online!`);

    try {
        const canalAgenda = await client.channels.fetch(process.env.CANAL_AGENDA);
        if (!canalAgenda.isTextBased()) return console.error('CANAL_AGENDA não é um canal de texto.');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('addProva').setLabel('Adicionar Prova').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('addTrabalho').setLabel('Adicionar Trabalho').setStyle(ButtonStyle.Success)
            );

        const pinnedMessages = await canalAgenda.messages.fetchPins();
        const jaFixada = pinnedMessages.find?.(msg => msg.author.id === client.user.id);

        if (!jaFixada) {
            const mensagem = await canalAgenda.send({
                content: '📌 **PorrinhaAgenda**\nClique nos botões para adicionar provas ou trabalhos!',
                components: [row]
            });
            await mensagem.pin();
        }
    } catch (err) {
        console.error('Erro ao enviar mensagem de botões:', err);
    }

    // Inicia cron de lembretes
    require('./cron/reminders')(client, db);
});

// Interações
client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        if (interaction.customId === 'addProva' || interaction.customId === 'addTrabalho') {
            const modal = new ModalBuilder()
                .setCustomId(interaction.customId)
                .setTitle(interaction.customId === 'addProva' ? 'Adicionar Prova' : 'Adicionar Trabalho');

            const materiaInput = new TextInputBuilder().setCustomId('materia').setLabel('Matéria').setStyle(TextInputStyle.Short).setRequired(true);
            const descricaoInput = new TextInputBuilder().setCustomId('descricao').setLabel('Descrição').setStyle(TextInputStyle.Short).setRequired(true);
            const dataInput = new TextInputBuilder().setCustomId('data').setLabel('Data (DD/MM/YYYY)').setStyle(TextInputStyle.Short).setRequired(true);
            const horaInput = new TextInputBuilder().setCustomId('hora').setLabel('Hora (HH:MM) opcional').setStyle(TextInputStyle.Short).setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(materiaInput),
                new ActionRowBuilder().addComponents(descricaoInput),
                new ActionRowBuilder().addComponents(dataInput),
                new ActionRowBuilder().addComponents(horaInput)
            );

            await interaction.showModal(modal);
        }
    } else if (interaction.isModalSubmit()) {
        const tipo = interaction.customId === 'addProva' ? 'prova' : 'trabalho';
        const materia = interaction.fields.getTextInputValue('materia');
        const descricao = interaction.fields.getTextInputValue('descricao');
        const data = interaction.fields.getTextInputValue('data');
        const hora = interaction.fields.getTextInputValue('hora');

        await interaction.deferReply({ ephemeral: true });
        criarEvento(db, tipo, materia, descricao, data, hora, interaction);
    } else if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction, db);
        } catch (err) {
            console.error(err);
            await interaction.reply({ content: '❌ Erro ao executar comando.', ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
