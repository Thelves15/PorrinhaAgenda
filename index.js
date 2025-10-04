require('dotenv').config();
const { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, Collection } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    partials: [Partials.Channel]
});

// Collection para comandos
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

// Caminho absoluto para SQLite
const dbPath = path.join(process.cwd(), 'database', 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Erro ao abrir DB:', err.message);
    else console.log('Conectado ao banco SQLite!');
});

// Criar tabela se não existir
db.run(`CREATE TABLE IF NOT EXISTS eventos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT,
    materia TEXT,
    descricao TEXT,
    data TEXT,
    hora TEXT
)`, () => console.log('Tabela eventos pronta!'));

// Função para criar evento
async function criarEvento(db, tipo, materia, descricao, data, hora, interaction) {
    db.run(`INSERT INTO eventos (tipo, materia, descricao, data, hora) VALUES (?, ?, ?, ?, ?)`,
        [tipo, materia, descricao, data, hora],
        function(err) {
            if (err) return interaction.editReply({ content: '❌ Erro ao registrar evento.', flags: 64 });
            interaction.editReply({ content: `✅ Evento registrado: [${tipo}] ${materia} - ${descricao} em ${data} ${hora || ''}`, flags: 64 });
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
                new ButtonBuilder()
                    .setCustomId('addProva')
                    .setLabel('Adicionar Prova')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('addTrabalho')
                    .setLabel('Adicionar Trabalho')
                    .setStyle(ButtonStyle.Success)
            );

        // Pega mensagens fixadas
        const pinnedMessages = await canalAgenda.messages.fetchPins();
        const jaFixada = pinnedMessages.find(msg => msg.author.id === client.user.id);

        if (!jaFixada) {
            const mensagem = await canalAgenda.send({
                content: '📌 **PorrinhaAgenda**\nClique nos botões para adicionar provas ou trabalhos!',
                components: [row]
            });
            await mensagem.pin();
        }

    } catch (err) {
        console.error('Erro ao enviar/fixar mensagem:', err);
    }

    // Inicia cron de lembretes
    require('./cron/reminders')(client, db);
});

// Interações
client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isButton()) {
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
            await command.execute(interaction, db);
        }
    } catch (err) {
        console.error('Erro na interação:', err);
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({ content: '❌ Algo deu errado.', ephemeral: true });
        } else {
            await interaction.reply({ content: '❌ Algo deu errado.', ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
