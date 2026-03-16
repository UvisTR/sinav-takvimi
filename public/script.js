// HTML elementlerine referanslar
const searchInput = document.getElementById('searchInput');
const detayliListeCheckbox = document.getElementById('detayliListe');
const table = document.getElementById('examTable');
const loadingDiv = document.getElementById('loading');

// Tüm verileri saklamak için bir dizi
let allData = [];

// Olay dinleyicileri
// 1. Sayfa ilk yüklendiğinde verileri çek
document.addEventListener('DOMContentLoaded', () => {
    fetchData();
});

// 2. Onay kutusunun durumu her değiştiğinde verileri yeniden çek
detayliListeCheckbox.addEventListener('change', () => {
    fetchData();
});

// 3. Arama kutusuna her harf girildiğinde tabloyu filtrele
searchInput.addEventListener('input', (e) => {
    renderTable(e.target.value);
});

/**
 * Sunucudan veri çeken ana fonksiyon.
 * Onay kutusunun durumuna göre doğru API endpoint'ini çağırır.
 */
async function fetchData() {
    loadingDiv.style.display = 'block'; // "Yükleniyor..." mesajını göster
    table.style.display = 'none'; // Eski tabloyu gizle
    
    // Onay kutusu işaretli mi?
    const isDetailed = detayliListeCheckbox.checked;
    // İşaretliyse detaylı listeyi (`?kaynak=detayli`), değilse varsayılan (Instagram) listeyi iste
    const url = isDetailed ? '/api/data?kaynak=detayli' : '/api/data';

    // Eğer detaylı liste seçili DEĞİLSE (yani özet liste gösteriliyorsa), arama kutusunu gizle
    if (!isDetailed) {
        searchInput.style.display = 'none'; // Arama kutusunu gizle
        searchInput.value = ''; // İçindeki metni temizle ki eski arama kalmasın
    } else {
        searchInput.style.display = 'block'; // Detaylı liste seçiliyse arama kutusunu göster
    }

    try {
        const response = await fetch(url); // Veriyi çek
        const data = await response.json(); // JSON formatına çevir
        allData = data; // Gelen veriyi global değişkene ata
        renderTable(searchInput.value); // Tabloyu yeni veriyle ve mevcut arama metniyle oluştur
    } catch (error) {
        console.error('Veri çekme hatası:', error);
        loadingDiv.textContent = 'Veriler yüklenirken bir hata oluştu.';
    } finally {
        loadingDiv.style.display = 'none'; // "Yükleniyor..." mesajını gizle
        table.style.display = 'table'; // Yeni tabloyu göster
    }
}

/**
 * Gelen verilere göre HTML tablosunu oluşturan fonksiyon.
 * @param {string} filterText - Tabloyu filtrelemek için kullanılacak arama metni.
 */
function renderTable(filterText = '') {
    const tbody = table.querySelector('tbody');
    const thead = table.querySelector('thead');
    tbody.innerHTML = ''; // Tablo içeriğini temizle
    thead.innerHTML = ''; // Tablo başlığını temizle

    if (allData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">Veri bulunamadı.</td></tr>';
        return;
    }

    // 1. Tablo Başlıklarını Oluştur (Dinamik olarak)
    const headers = Object.keys(allData[0]);
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = headers.map(h => `<th>${h}</th>`).join('');
    thead.appendChild(headerRow);

    // 2. Tablo Satırlarını Oluştur
    const filter = filterText.trim().toLowerCase();

    allData.forEach(row => {
        // Arama kutusu boşsa veya satır arama metnini içeriyorsa satırı ekle
        const rowValues = Object.values(row).join(' ').toLowerCase();
        if (rowValues.includes(filter)) {
            const tr = document.createElement('tr');
            tr.innerHTML = headers.map(h => `<td>${row[h] || ''}</td>`).join('');
            tbody.appendChild(tr);
        }
    });
}