import React, { useEffect, useRef } from "react";
import { format, isWeekend, getDay, addDays } from "date-fns";
import { tr } from "date-fns/locale";
import MenuSection from "./MenuSection";
import "../styles/MenuList.css";

// yemek listesinin hepsi büyük harf ile yazıldığı için
const turkishToLowerCase = (str) => {
  const turkish = {
    İ: "i",
    I: "ı",
    Ğ: "ğ",
    Ü: "ü",
    Ş: "ş",
    Ö: "ö",
    Ç: "ç",
  };

  return str
    .replace(/[İIĞÜŞÖÇ]/g, (letter) => turkish[letter] || letter)
    .toLowerCase();
};

function MenuList({ menuData }) {
  const noMenuRefs = useRef([]);

  useEffect(() => {
    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("section-visible");
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
      rootMargin: "50px",
    });

    noMenuRefs.current.forEach((ref) => {
      if (ref) {
        observer.observe(ref);
      }
    });

    return () => {
      noMenuRefs.current.forEach((ref) => {
        if (ref) {
          observer.unobserve(ref);
        }
      });
    };
  }, []);

  // Bugünün tarihi
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const todayFormatted = format(today, "d MMMM yyyy", { locale: tr });
  const tomorrowFormatted = format(tomorrow, "d MMMM yyyy", { locale: tr });

  // Haftanın günü kontrolü
  const todayDay = getDay(today);
  const isFriday = todayDay === 5;    // Cuma
  const isSaturday = todayDay === 6;  // Cumartesi
  const isSunday = todayDay === 0;    // Pazar
  const isTodayWeekend = isSaturday || isSunday;
  const isTomorrowWeekend = getDay(tomorrow) === 6 || getDay(tomorrow) === 0;

  // Bugün ve yarının menülerini bul
  const todayMenu = menuData.find((menu) => {
    const menuDate = new Date(menu.date);
    return (
      menuDate.getDate() === today.getDate() &&
      menuDate.getMonth() === today.getMonth() &&
      menuDate.getFullYear() === today.getFullYear()
    );
  });

  const tomorrowMenu = menuData.find((menu) => {
    const menuDate = new Date(menu.date);
    return (
      menuDate.getDate() === tomorrow.getDate() &&
      menuDate.getMonth() === tomorrow.getMonth() &&
      menuDate.getFullYear() === tomorrow.getFullYear()
    );
  });

  // Menü boş mu kontrolü
  const isTodayMenuEmpty = !todayMenu || todayMenu.items.length === 0;
  const isTomorrowMenuEmpty = !tomorrowMenu || tomorrowMenu.items.length === 0;

  // Diğer günlerin menülerini bul (hafta sonu hariç ve boş olmayanlar)
  let otherDaysMenus = menuData
    .filter((menu) => {
      const menuDate = new Date(menu.date);
      const twoDaysFromNow = new Date(today);
      twoDaysFromNow.setDate(today.getDate() + 2);

      // Hafta sonu günleri hariç tutma
      return menuDate >= twoDaysFromNow && !isWeekend(menuDate);
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .filter(menu => menu.items && menu.items.length > 0); // Boş menüleri filtrele

  // Pazar günü için: Gelecek haftanın Cuma gününü bul
  if (isSunday) {
    // Gelecek Cuma'yı bul (bugün Pazar, 5 gün ekle = Cuma)
    const nextFriday = addDays(today, 5);
    const nextFridayFormatted = format(nextFriday, "d MMMM yyyy", { locale: tr });
    
    // Yarın için gösterilecek menüyü güncelle
    const nextFridayMenu = menuData.find((menu) => {
      const menuDate = new Date(menu.date);
      return (
        menuDate.getDate() === nextFriday.getDate() &&
        menuDate.getMonth() === nextFriday.getMonth() &&
        menuDate.getFullYear() === nextFriday.getFullYear()
      );
    });
  }

  return (
    <div className="menu-list">
      {/* Bugünün menüsü */}
      {isTodayWeekend || isTodayMenuEmpty ? (
        <section 
          className="menu-section today" 
          ref={el => noMenuRefs.current[0] = el}
        >
          <div className="menu-title">
            <h2>{turkishToLowerCase("bugünün menüsü")}</h2>
            <p className="date-subtitle">{turkishToLowerCase(todayFormatted)}</p>
          </div>
          <div className="closed-message">
            {turkishToLowerCase("bugün yemekhane kapalı")}
          </div>
        </section>
      ) : (
        <MenuSection
          title={`bugünün menüsü - ${todayFormatted}`}
          menu={todayMenu}
          isToday={true}
        />
      )}

      {/* Boşluk */}
      <div className="menu-section-spacer"></div>

      {/* Yarının menüsü */}
      {isFriday || isTomorrowWeekend || isTomorrowMenuEmpty ? (
        <section 
          className="menu-section tomorrow" 
          ref={el => noMenuRefs.current[1] = el}
        >
          <div className="menu-title">
            <h2>{turkishToLowerCase("yarının menüsü")}</h2>
            <p className="date-subtitle">{turkishToLowerCase(tomorrowFormatted)}</p>
          </div>
          <div className="closed-message">
            {turkishToLowerCase("yarın yemekhane kapalı")}
          </div>
        </section>
      ) : (
        <MenuSection
          title={`yarının menüsü - ${tomorrowFormatted}`}
          menu={tomorrowMenu}
          isTomorrow={true}
        />
      )}

      {/* Footer - diğer günlerden önce */}
      <div className="menu-section-spacer"></div>
      <div className="blur-footer-card">
        <footer className="footer">
          <p>© 2025 kastamonu üniversitesi yemekhane listesi</p>
          <p>
            made with ❤️ by{" "}
            <a
              href="https://github.com/kadirc4n"
              target="_blank"
              rel="noopener noreferrer"
            >
              @kc4ca
            </a>
          </p>
        </footer>
      </div>

      {/* Diğer günler */}
      {otherDaysMenus.length > 0 && (
        <>
          {/* Boşluk */}
          <div className="menu-section-spacer"></div>

          {/* Diğer günler başlığı */}
          <h2 className="other-days-title">diğer günler</h2>

          <div className="other-days-content">
            {otherDaysMenus.map((menu, index) => (
              <React.Fragment key={index}>
                <MenuSection
                  title={format(new Date(menu.date), "d MMMM yyyy", {
                    locale: tr,
                  })}
                  menu={menu}
                  isOtherDay={true}
                />
                {index < otherDaysMenus.length - 1 && (
                  <div className="menu-section-spacer"></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default MenuList;
