import axios from 'axios';
import Papa from 'papaparse';

// Google Sheets'i CSV olarak dışa aktarma URL'ini oluştur
const getGoogleSheetsCSVUrl = (sheetId, gid = 0) => {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
};

// CSV verilerini işleme fonksiyonu
const processMenuData = (csvData) => {
  const data = [];
  
  try {
    // Başlık satırını kontrol et - "TARİH" sütununu bul
    const headers = csvData[0];
    console.log('Headers:', headers);
    
    if (!headers || !Array.isArray(headers)) {
      throw new Error('Geçersiz CSV başlık yapısı');
    }

    const dateIndex = headers.findIndex(header => 
      header && typeof header === 'string' && 
      header.toString().toLowerCase().includes('tarih'));
    
    console.log('Date Index:', dateIndex);
    
    if (dateIndex === -1) {
      throw new Error('CSV dosyasında tarih sütunu bulunamadı.');
    }
    
    // Her bir satırı işle (başlık satırını atla)
    for (let i = 1; i < csvData.length; i++) {
      const row = csvData[i];
      
      // Boş satırları ve imza satırlarını atla
      if (!row || !Array.isArray(row) || row.every(cell => !cell || !cell.toString().trim()) || 
          (row[0] && row[0].toString().toLowerCase().includes('diyetisyen'))) {
        continue;
      }
      
      const dateStr = row[dateIndex];
      if (!dateStr) continue;
      
      // Tarih formatını kontrol et ve dönüştür
      const dateObj = parseDate(dateStr.toString());
      if (!dateObj) continue;
      
      // Menü öğelerini ve kalorileri topla
      const menuItems = [];
      for (let j = 0; j < row.length; j++) {
        if (j !== dateIndex && row[j] && row[j].toString().trim()) {
          const cell = row[j].toString().trim();
          const nextCell = row[j + 1] ? row[j + 1].toString().trim() : '';
          
          // Eğer sonraki hücre kalori bilgisi içeriyorsa
          if (nextCell.toLowerCase().includes('kkal')) {
            const calories = parseInt(nextCell);
            if (!isNaN(calories)) {
              menuItems.push(`${cell} ${calories}KKAL`);
              j++; // Kalori hücresini atla
            } else {
              menuItems.push(cell);
            }
          } else {
            menuItems.push(cell);
          }
        }
      }
      
      if (menuItems.length > 0) {
        data.push({
          date: dateObj,
          items: menuItems
        });
      }
    }
    
    return data;
  } catch (error) {
    console.error('CSV işleme hatası:', error);
    console.log('CSV Data:', csvData);
    throw error;
  }
};

// Tarih ayrıştırma fonksiyonu (farklı formatları destekler)
const parseDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') {
    console.log('Invalid date string:', dateStr);
    return null;
  }
  
  // Tarih formatını temizle
  const cleanDateStr = dateStr.trim();
  console.log('Parsing date:', cleanDateStr);
  
  // Türkçe tarih formatları için ayrıştırma
  const patterns = [
    // DD.MM.YYYY
    {
      regex: /(\d{1,2})[\.](\d{1,2})[\.](\d{4})/,
      format: (match) => new Date(match[3], match[2] - 1, match[1])
    },
    // DD/MM/YYYY
    {
      regex: /(\d{1,2})[\/](\d{1,2})[\/](\d{4})/,
      format: (match) => new Date(match[3], match[2] - 1, match[1])
    },
    // DD MMMM YYYY (örn: 10 Mart 2025)
    {
      regex: /(\d{1,2})\s+(Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)\s+(\d{4})/i,
      format: (match) => {
        const months = {
          'ocak': 0, 'şubat': 1, 'mart': 2, 'nisan': 3, 'mayıs': 4, 'haziran': 5,
          'temmuz': 6, 'ağustos': 7, 'eylül': 8, 'ekim': 9, 'kasım': 10, 'aralık': 11
        };
        return new Date(match[3], months[match[2].toLowerCase()], match[1]);
      }
    }
  ];
  
  for (const pattern of patterns) {
    const match = cleanDateStr.match(pattern.regex);
    if (match) {
      const date = pattern.format(match);
      console.log('Matched date:', date);
      return date;
    }
  }
  
  // Diğer genel formatlar için JS Date objesini kullan
  const date = new Date(cleanDateStr);
  const isValid = !isNaN(date.getTime());
  console.log('JS Date parse result:', date, 'isValid:', isValid);
  return isValid ? date : null;
};

// Ana fonksiyon: Menü verilerini getir
export const fetchMenuData = async () => {
  try {
    // Google Sheets ID'si
    const sheetId = '1h0bA-ByWSHOF5CGWMgsHPkSZ7WgiXMyTwrZlcu6Po0E';
    
    // Alternatif URL formatları - birini deneyelim
    const urls = [
      `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=0`,
      `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`,
      `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&id=${sheetId}&gid=0`
    ];
    
    let response = null;
    let error = null;
    
    // Her URL'yi sırayla dene
    for (const url of urls) {
      try {
        console.log('Fetching from URL:', url);
        response = await axios.get(url, {
          headers: {
            'Accept': 'text/csv,application/json;q=0.9,*/*;q=0.8',
            'Content-Type': 'text/csv; charset=utf-8'
          }
        });
        
        console.log('Response received:', response.status);
        
        // Başarılı yanıt aldıysak döngüden çık
        if (response.status === 200 && response.data) {
          break;
        }
      } catch (err) {
        console.error(`Error fetching from ${url}:`, err.message);
        error = err;
      }
    }
    
    // Hiçbir URL çalışmadıysa hata fırlat
    if (!response || !response.data) {
      throw error || new Error('Hiçbir URL\'den veri çekilemedi');
    }
    
    // CSV içeriğini kontrol et
    console.log('CSV data preview:', response.data.substring(0, 200));
    
    // CSV'yi ayrıştır
    return new Promise((resolve, reject) => {
      Papa.parse(response.data, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            console.log('Papa Parse results:', results);
            
            if (!results.data || results.data.length === 0) {
              throw new Error('CSV verisi boş veya geçersiz.');
            }
            
            // Başlık satırını manuel olarak kontrol et
            const headers = results.data[0];
            console.log('Headers:', headers);
            
            // TARİH sütununu manuel olarak bul
            let dateIndex = -1;
            for (let i = 0; i < headers.length; i++) {
              const header = headers[i];
              if (header && header.toString().toUpperCase().includes('TARİH')) {
                dateIndex = i;
                break;
              }
            }
            
            console.log('Manually found date index:', dateIndex);
            
            // Eğer TARİH sütunu bulunamadıysa, ilk sütunu kullan
            if (dateIndex === -1) {
              console.warn('TARİH sütunu bulunamadı, ilk sütun kullanılıyor');
              dateIndex = 0;
            }
            
            // Veriyi manuel olarak işle
            const processedData = [];
            for (let i = 1; i < results.data.length; i++) {
              const row = results.data[i];
              if (!row || row.length < 2) continue;
              
              const dateStr = row[dateIndex];
              if (!dateStr) continue;
              
              // Tarih formatını kontrol et
              const dateObj = parseDate(dateStr.toString());
              if (!dateObj) continue;
              
              // Menü öğelerini ve kalorileri topla
              const menuItems = [];
              
              // Her bir yemek ve kalori çifti için
              for (let j = 1; j < row.length - 1; j++) {
                const foodItem = row[j];
                const nextItem = row[j + 1];
                
                // Sayısal tarih gösterimini atla
                if (foodItem && foodItem.toString().trim().match(/^\d{2}\.\d{2}\.\d{4}$/)) {
                  continue;
                }
                
                // Eğer yemek adı varsa
                if (foodItem && foodItem.toString().trim()) {
                  const foodName = foodItem.toString().trim();
                  
                  // Sonraki öğe kalori bilgisi içeriyorsa
                  if (nextItem && nextItem.toString().trim().toLowerCase().includes('kkal')) {
                    const calorieMatch = nextItem.toString().match(/(\d+)\s*KKAL/i);
                    if (calorieMatch) {
                      menuItems.push(`${foodName} ${calorieMatch[1]}KKAL`);
                      j++; // Kalori bilgisini atla
                    } else {
                      menuItems.push(foodName);
                    }
                  } else {
                    menuItems.push(foodName);
                  }
                }
              }
              
              if (menuItems.length > 0) {
                processedData.push({
                  date: dateObj,
                  items: menuItems
                });
              }
            }
            
            console.log('Processed data:', processedData);
            
            if (processedData.length === 0) {
              throw new Error('İşlenebilir menü verisi bulunamadı.');
            }
            
            resolve(processedData);
          } catch (err) {
            console.error('Veri işleme hatası:', err);
            reject(err);
          }
        },
        error: (error) => {
          console.error('CSV ayrıştırma hatası:', error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('CSV verisi alınırken hata oluştu:', error);
    throw error;
  }
};      