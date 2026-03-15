const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const app = express();
// Render, çalışacağı portu PORT çevre değişkeni ile verir.
const port = process.env.PORT || 3000;

// 'public' klasöründeki statik dosyaları (css, js) sun.
app.use(express.static(path.join(__dirname, 'public')));

// Ana sayfa isteğinde templates/index.html dosyasını gönder
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

// /api/data endpoint'i: CSV dosyasını okur ve JSON olarak gönderir.
app.get('/api/data', (req, res) => {
    const results = [];
    const filePath = path.join(__dirname, 'sinavlar.csv');

    if (!fs.existsSync(filePath)) {
        console.error('Hata: sinavlar.csv dosyası bulunamadı!');
        return res.status(404).json({ error: 'Veri dosyası sunucuda bulunamadı.' });
    }

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            res.json(results);
        })
        .on('error', (error) => {
            console.error('CSV okuma hatası:', error);
            res.status(500).json({ error: 'CSV dosyası işlenirken bir hata oluştu.' });
        });
});

app.listen(port, () => {
    console.log(`Sunucu http://localhost:${port} adresinde çalışıyor`);
});