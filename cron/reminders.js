// cron/reminders.js
const cron = require('node-cron');
const moment = require('moment');

module.exports = (client, db) => {
    // Rodar todo dia às 8h
    cron.schedule('0 8 * * *', async () => {
        const canalLembretes = await client.channels.fetch(process.env.CANAL_LEMBRETES);

        const hoje = moment().startOf('day');

        db.all(`SELECT * FROM eventos`, [], (err, rows) => {
            if (err) return console.error(err);

            if (!rows || rows.length === 0) return;

            rows.forEach(evento => {
                const dataEvento = moment(evento.data, 'DD/MM/YYYY');
                const diffDias = dataEvento.diff(hoje, 'days');

                let mensagem = '';

                if (diffDias === 7) {
                    mensagem = `📢 Atenção, estudantes!\nFalta **1 semana** para [${evento.tipo === 'prova' ? '📘 Prova' : '📝 Trabalho'}] ${evento.materia} - ${evento.descricao} (${evento.data}${evento.hora ? ' às ' + evento.hora : ''}).\nSe ainda não começou a estudar, abra os PDFs e finja que entendeu! 😂📚`;
                } else if (diffDias === 3) {
                    mensagem = `⏰ O relógio tá correndo!\nEm apenas **3 dias** chega [${evento.tipo === 'prova' ? '📘 Prova' : '📝 Trabalho'}] ${evento.materia} - ${evento.descricao} (${evento.data}${evento.hora ? ' às ' + evento.hora : ''}).\nJá revisou ou ainda tá na negação? ⏳🔥`;
                } else if (diffDias === 1) {
                    mensagem = `⚡ Última chamada!\nAmanhã é [${evento.tipo === 'prova' ? '📘 Prova' : '📝 Trabalho'}] ${evento.materia} - ${evento.descricao} (${evento.data}${evento.hora ? ' às ' + evento.hora : ''}).\nBoa sorte! Até a colinha precisa ser estudada. 🤫📖`;
                } else if (diffDias === 0) {
                    mensagem = `🔥 CHEGOU O DIA!\nHoje rola [${evento.tipo === 'prova' ? '📘 Prova' : '📝 Trabalho'}] ${evento.materia} - ${evento.descricao} (${evento.data}${evento.hora ? ' às ' + evento.hora : ''}).\nSeja na raça, na fé ou no café, a vitória é garantida! ☕💪`;
                }

                if (mensagem) canalLembretes.send(mensagem);
            });
        });
    });
};
