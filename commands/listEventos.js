const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('eventos')
        .setDescription('Lista todos os eventos futuros'),

    async execute(interaction, db) {
        await interaction.deferReply({ ephemeral: true });
        db.all(`SELECT * FROM eventos ORDER BY data, hora`, [], (err, rows) => {
            if (err) {
                console.error(err);
                return interaction.editReply('❌ Erro ao listar eventos.');
            }

            if (rows.length === 0) {
                return interaction.editReply('📅 Nenhum evento encontrado.');
            }

            let mensagem = '📅 **Próximos eventos:**\n';
            rows.forEach(row => {
                const emoji = row.tipo === 'prova' ? '📘' : '📝';
                mensagem += `#${row.id} [${emoji} ${row.tipo}] ${row.materia} - ${row.descricao} → ${row.data}${row.hora ? ' às ' + row.hora : ''}\n`;
            });

            interaction.editReply(mensagem);
        });
    }
};
