// commands/listEventos.js
module.exports = {
    data: {
        name: 'eventos',
        description: 'Lista todos os eventos futuros'
    },
    async execute(interaction, db) {
        // Defer reply para evitar timeout do Discord
        await interaction.deferReply();

        db.all(`SELECT * FROM eventos ORDER BY data, hora`, [], (err, rows) => {
            if (err) {
                console.error(err);
                return interaction.editReply('❌ Erro ao buscar eventos.');
            }

            if (!rows || rows.length === 0) {
                return interaction.editReply('📅 Nenhum evento cadastrado.');
            }

            const lista = rows.map((e, i) =>
                `${i + 1}. [${e.tipo === 'prova' ? '📘 Prova' : '📝 Trabalho'}] ${e.materia} - ${e.descricao} → ${e.data}${e.hora ? ' às ' + e.hora : ''}`
            ).join('\n');

            interaction.editReply(`📅 **Eventos futuros:**\n${lista}`);
        });
    }
};
