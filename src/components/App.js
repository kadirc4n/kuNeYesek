import React, { useState, useEffect } from 'react';
import Header from './Header';
import MenuList from './MenuList';
import '../styles/App.css';
import { fetchMenuData } from '../utils/menuUtils';

function App() {
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchMenuData();
        setMenuData(data);
      } catch (err) {
        console.error('yemekhane menü verileri yüklenirken hata oluştu:', err);
        setError('menü verileri yüklenirken bir hata oluştu. belki yemekhane kapandı, belki internetin bitti belki de türk telekom\'un trafolarına kediler girdi.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // Her gün otomatik olarak veriyi güncelle
    const interval = setInterval(loadData, 86400000); // 24 saat (ms cinsinden)
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      <Header />
      <main className="main-content content-wrapper">
        {loading ? (
          <div className="loading-container">
            <div className="loading">
              <p>Menü yükleniyor...</p>
            </div>
            <div className="blur-footer-card">
              <footer className="footer">
                <p>© 2025 kastamonu üniversitesi yemekhane listesi</p>
                <p>made with ❤️ by <a href="https://github.com/kadirc4n" target="_blank" rel="noopener noreferrer">@kc4ca</a></p>
              </footer>
            </div>
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="error">
              <p>{error}</p>
            </div>
            <div className="blur-footer-card">
              <footer className="footer">
                <p>© 2025 kastamonu üniversitesi yemekhane listesi</p>
                <p>made with ❤️ by <a href="https://github.com/kadirc4n" target="_blank" rel="noopener noreferrer">@kc4ca</a></p>
              </footer>
            </div>
          </div>
        ) : (
          <MenuList menuData={menuData} />
        )}
      </main>
    </div>
  );
}

export default App;