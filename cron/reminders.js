const moment = require('moment');

module.exports = (client, db) => {
    const canalLembretes = process.env.CANAL_LEMBRETES;

    cron.schedule('0 8 * * *', () => { // todo dia às 8h
        db.all(`SELECT * FROM eventos`, [], async (err, rows) => {
            if (err) return console.error(err);

            const hoje = moment();
            for (const evento of rows) {
                const dataEvento = moment(evento.data, 'DD/MM/YYYY');
                const diffDias = dataEvento.diff(hoje, 'days');

                let texto = null;
                if (diffDias === 7) {
                    texto = `📢 Atenção, falta 7 dias para [${evento.tipo === 'prova' ? '📘 Prova' : '📝 Trabalho'}] ${evento.materia} - ${evento.descricao} (${evento.data}${evento.hora ? ' às ' + evento.hora : ''})`;
                } else if (diffDias === 3) {
                    texto = `⏳ Faltam 3 dias para [${evento.tipo === 'prova' ? '📘 Prova' : '📝 Trabalho'}] ${evento.materia} - ${evento.descricao}`;
                } else if (diffDias === 1) {
                    texto = `⚡ Amanhã tem [${evento.tipo === 'prova' ? '📘 Prova' : '📝 Trabalho'}] ${evento.materia} - ${evento.descricao}`;
                } else if (diffDias === 0) {
                    texto = `🔥 Hoje rola [${evento.tipo === 'prova' ? '📘 Prova' : '📝 Trabalho'}] ${evento.materia} - ${evento.descricao}! Boa sorte!`;
                }

                if (texto) {
                    try {
                        const canal = await client.channels.fetch(canalLembretes);
                        canal.send(texto);
                    } catch (err) {
                        console.error('Erro ao enviar lembrete:', err);
                    }
                }
            }
        });
    });
};
