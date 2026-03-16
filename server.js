const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const app = express();
// Render, çalışacağı portu PORT çevre değişkeni ile verir.
const port = process.env.PORT || 3000;

// 'public' klasöründeki tüm statik dosyaları (index.html, css, js) sun.
// Ana sayfa isteği geldiğinde 'public/index.html' otomatik olarak sunulur.
app.use(express.static(path.join(__dirname, 'public')));

// Ana sayfa için açık rota (Garanti olsun diye ekliyoruz)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// /api/data endpoint'i: CSV dosyasını okur ve JSON olarak gönderir.
app.get('/api/data', (req, res) => {
    // URL parametresine bak: /api/data?kaynak=instagram ise yeni dosyayı oku, yoksa eskisini.
    const veriKaynagi = req.query.kaynak;
    // Varsayılan olarak Instagram verisi (sinavlar2.csv) gösterilir.
    // Eğer ?kaynak=detayli parametresi varsa detaylı liste (sinavlar.csv) gösterilir.
    const dosyaAdi = (veriKaynagi === 'detayli') ? 'sinavlar.csv' : 'sinavlar2.csv';
    const filePath = path.join(__dirname, dosyaAdi);

    if (!fs.existsSync(filePath)) {
        console.error(`HATA: ${dosyaAdi} dosyası sunucuda bulunamadı!`);
        return res.status(404).json({ error: `Veri dosyası (${dosyaAdi}) bulunamadı.` });
    }

    const results = [];

    fs.createReadStream(filePath)
        .pipe(csv({
            // Google Sheets genelde virgül (,) kullanır.
            // Eğer Excel'den farklı kaydettiyseniz ve noktalı virgül (;) kullanıyorsa bunu değiştirin.
            separator: ',',
            mapHeaders: ({ header }) => {
                // Başlıkları standart hale getir ve DERS ADI'nı DERS yap
                const h = header.trim().toLocaleUpperCase('tr');
                if (h === 'DERS ADI' || h === 'DERS') return 'DERS'; // Frontend "DERS" bekliyor
                return h;
            }
        }))
            .on('data', (data) => {
                // Sadece geçerli bir TARİH sütunu olan satırları al
                if (data.TARİH && data.TARİH.trim() && !data.TARİH.startsWith('-') && !data.TARİH.startsWith('---')) {
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
});

app.listen(port, () => {
    console.log(`Sunucu http://localhost:${port} adresinde çalışıyor`);
});
