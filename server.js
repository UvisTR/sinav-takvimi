const express = require('express');
const https = require('https'); // İnternetten veri çekmek için gerekli
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
    // Öncelik Render'daki Environment Variable, yoksa varsayılan (test için)
    const csvUrl = process.env.CSV_URL;

    if (!csvUrl) {
        console.error('HATA: CSV_URL tanımlanmamış! Render Environment Variables ayarlarını kontrol edin.');
        return res.status(500).json({ error: 'Veri kaynağı (CSV_URL) bulunamadı.' });
    }
    
    const results = [];

    https.get(csvUrl, (response) => {
        response.pipe(csv({ 
            separator: ',', // Google Sheets genelde virgül kullanır. Eğer noktalı virgül ise ';' yapın.
            mapHeaders: ({ header }) => header.trim() 
        }))
            .on('data', (data) => results.push(data))
            .on('end', () => {
                res.json(results);
            })
            .on('error', (error) => {
                console.error('CSV okuma hatası:', error);
                res.status(500).json({ error: 'Veri çekilirken hata oluştu.' });
            });
    }).on('error', (e) => {
        console.error('Bağlantı hatası:', e);
        res.status(500).json({ error: 'Sunucu veri kaynağına bağlanamadı.' });
    });
});

app.listen(port, () => {
    console.log(`Sunucu http://localhost:${port} adresinde çalışıyor`);
});
