const cron = require('node-cron');
const moment = require('moment');

module.exports = (client, db) => {

    // Roda a cada minuto
    cron.schedule('* * * * *', () => {

        db.all('SELECT * FROM eventos', [], (err, rows) => {
            if (err) return console.error(err);

            const hoje = moment().format('DD/MM/YYYY');

            rows.forEach(evento => {
                if (!evento.enviado) {
                    const canal = client.channels.cache.get(process.env.CANAL_AGENDA);
                    if (canal && canal.isTextBased() && evento.data === hoje) {
                        canal.send(`🚨 Hoje tem [${evento.tipo}] ${evento.materia} - ${evento.descricao}!`);
                        db.run('UPDATE eventos SET enviado=1 WHERE id=?', [evento.id]);
                    }
                }
            });

        });

    });
};
