const express = require('express');
const https = require('https');
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
    // Link zaten Render'da tanımlı olduğu için doğrudan oradan alıyoruz.
    const csvUrl = process.env.CSV_URL;

    console.log('Veri isteği alındı. CSV_URL:', csvUrl ? 'Tanımlı (Mevcut)' : 'TANIMSIZ (Eksik)');

    if (!csvUrl) {
        console.error('HATA: CSV_URL tanımlanmamış! Render panelinden Environment Variables kısmını kontrol edin.');
        return res.status(500).json({ error: 'Veri kaynağı (CSV_URL) bulunamadı.' });
    }

    const results = [];

    https.get(csvUrl, (stream) => {
        stream.pipe(csv({
            // Google Sheets genelde virgül (,) kullanır.
            // Eğer Excel'den farklı kaydettiyseniz ve noktalı virgül (;) kullanıyorsa bunu değiştirin.
            separator: ',',
            mapHeaders: ({ header }) => {
                // Başlıkları standart hale getir ve DERS ADI'nı DERS yap
                const h = header.trim().toLocaleUpperCase('tr');
                if (h === 'DERS ADI') return 'DERS'; // Frontend "DERS" bekliyor
                return h;
            }
        }))
            .on('data', (data) => {
                // Sadece geçerli bir TARİH sütunu olan satırları al
                if (data.TARİH && data.TARİH.trim()) {
                    results.push(data);
                }
            })
            .on('end', () => {
                console.log(`Veri çekme işlemi bitti. Toplam ${results.length} satır veri bulundu.`);
                if (results.length === 0) console.warn("UYARI: Hiç veri bulunamadı! Google Sheets linkinin 'Web'de Yayınla' (CSV) formatında olduğundan emin olun.");
                else console.log("Örnek ilk kayıt:", results[0]); // Debug için ilk kaydı loga yaz
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
