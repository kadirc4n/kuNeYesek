import React, { useEffect, useRef, useState } from 'react';
import '../styles/Header.css';

function Header() {
  const canvasRef = useRef(null);
  const headerRef = useRef(null);
  const logoRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Scroll pozisyonunu takip et
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadAndProcessImage = async () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();

      // Mobil veya masaüstü görünümüne göre farklı resim kullan
      img.src = process.env.PUBLIC_URL + (isMobile ? '/yemekhane-mobil.jpg' : '/yemekhane.jpg');

      await new Promise((resolve) => {
        img.onload = () => {
          // Set canvas size to match container
          canvas.width = headerRef.current.offsetWidth;
          canvas.height = headerRef.current.offsetHeight;
          
          // Calculate image dimensions to cover the canvas
          const imageAspectRatio = img.width / img.height;
          const canvasAspectRatio = canvas.width / canvas.height;
          
          let drawWidth = canvas.width;
          let drawHeight = canvas.height;
          
          if (canvasAspectRatio > imageAspectRatio) {
            drawHeight = canvas.width / imageAspectRatio;
          } else {
            drawWidth = canvas.height * imageAspectRatio;
          }
          
          const drawX = (canvas.width - drawWidth) / 2;
          const drawY = (canvas.height - drawHeight) / 2;
          
          // Draw the background image
          ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
          
          // Create gradient overlay
          const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.5);
          gradient.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          
          // Apply gradient
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          resolve();
        };
      });
    };

    loadAndProcessImage();

    // Handle window resize
    const handleResize = () => {
      loadAndProcessImage();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  // Logo'nun görünürlüğünü hesapla
  const calculateLogoOpacity = () => {
    // Bugünün menüsünün başlangıç pozisyonu (viewport yüksekliğinin 0.6 katı)
    const todayMenuStart = window.innerHeight * 0.6;
    
    // Bugünün menüsünün bitiş pozisyonu (başlangıçtan 200px sonra)
    const todayMenuEnd = todayMenuStart + 100;
    
    // Scroll pozisyonu bugünün menüsünün başlangıcını geçtiyse, logo'yu hızla gizle
    if (scrollPosition > todayMenuStart) {
      // Çok kısa bir geçiş aralığı belirle (200px)
      const fadeDistance = todayMenuEnd - todayMenuStart;
      const opacity = Math.max(0, 1 - (scrollPosition - todayMenuStart) / fadeDistance);
      return opacity;
    }
    
    return 1; // Tam görünür
  };

  const logoOpacity = calculateLogoOpacity();

  return (
    <header ref={headerRef} className="header">
      <canvas ref={canvasRef} className="header-canvas" />
      <div 
        ref={logoRef} 
        className="logo-container"
        style={{ 
          opacity: logoOpacity,
          visibility: logoOpacity < 0.01 ? 'hidden' : 'visible'
        }}
      >
        <img 
          src={process.env.PUBLIC_URL + '/kuneyesek-logo.png'} 
          alt="KÜ Ne Yesek Logo" 
          className="header-logo" 
        />
      </div>
    </header>
  );
}

export default Header;