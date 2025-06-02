import React, { useEffect, useRef } from "react";
import "../styles/MenuSection.css";

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

const CalorieBadge = ({ calories, isTotal }) => {
  const value = parseInt(calories);
  let badgeClass = isTotal ? "total-calorie-badge" : "calorie-badge";

  if (!isTotal) {
    if (value > 300) {
      badgeClass += " high";
    } else if (value >= 200) {
      badgeClass += " medium";
    } else {
      badgeClass += " low";
    }
  }

  return (
    <span className={badgeClass}>
      {isTotal ? "toplam " : ""}
      {value} kcal
    </span>
  );
};

function MenuSection({ title, menu, isToday, isTomorrow, isOtherDay }) {
  const [dateText, ...titleParts] = title.split(" - ");
  const sectionClass = isToday
    ? "menu-section today"
    : isTomorrow
      ? "menu-section tomorrow"
      : "menu-section other-day";

  const menuItemsRef = useRef([]);
  const sectionRef = useRef(null);

  useEffect(() => {
    // menü öğeleri için observer
    const itemObserverCallback = (entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add("visible");
          }, index * 50);
        }
      });
    };

    const itemObserver = new IntersectionObserver(itemObserverCallback, {
      threshold: 0.1,
      rootMargin: "0px",
    });

    menuItemsRef.current.forEach((item) => {
      if (item) {
        itemObserver.observe(item);
      }
    });

    // kart için observer
    const sectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("section-visible");
        }
      });
    };

    const sectionObserver = new IntersectionObserver(sectionObserverCallback, {
      threshold: 0.1,
      rootMargin: "50px",
    });

    if (sectionRef.current) {
      sectionObserver.observe(sectionRef.current);
    }

    return () => {
      menuItemsRef.current.forEach((item) => {
        if (item) {
          itemObserver.unobserve(item);
        }
      });
      if (sectionRef.current) {
        sectionObserver.unobserve(sectionRef.current);
      }
    };
  }, []);

  const extractCalories = (item) => {
    const match = item.match(/(\d+)\s*KKAL/i);
    return match ? match[1] : null;
  };


  const totalCalories = menu.items.reduce((total, item) => {
    const calories = extractCalories(item);
    return total + (calories ? parseInt(calories) : 0);
  }, 0);

  return (
    <section className={`${sectionClass} section-fade-in`} ref={sectionRef}>
      <div className="menu-title">
        <h2>{turkishToLowerCase(dateText)}</h2>
        {titleParts.length > 0 && (
          <p className="date-subtitle">
            {turkishToLowerCase(titleParts.join(" - "))}
          </p>
        )}
      </div>
      <div className="menu-items">
        {menu.items.map((item, index) => {
          const calories = extractCalories(item);
          const itemName = turkishToLowerCase(
            item.replace(/\s*\d+\s*KKAL/i, ""),
          );

          return (
            <div
              key={index}
              className="menu-item fade-in"
              ref={(el) => (menuItemsRef.current[index] = el)}
            >
              <span className="item-name">{itemName}</span>
              {calories && <CalorieBadge calories={calories} />}
            </div>
          );
        })}
      </div>
      <div className="total-calories">
        <CalorieBadge calories={totalCalories} isTotal={true} />
      </div>
    </section>
  );
}

export default MenuSection;
