/**
 * 通用工具函数
 */

/**
 * 推荐指数转星星显示
 * @param {number} rating 1-10
 * @returns {object} { fullStars, halfStar, emptyStars, displayText, label }
 */
const ratingToStars = (rating) => {
  rating = Math.max(1, Math.min(10, rating || 0));
  const fullStars = Math.floor(rating / 2);
  const halfStar = rating % 2 === 1 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;

  const labels = {
    1: '一般', 2: '尚可', 3: '还行', 4: '不错', 5: '推荐',
    6: '值得买', 7: '强烈推荐', 8: '必买好物', 9: '超级推荐', 10: '封神好物'
  };

  return {
    fullStars,
    halfStar,
    emptyStars,
    starsArray: [
      ...Array(fullStars).fill('full'),
      ...Array(halfStar).fill('half'),
      ...Array(emptyStars).fill('empty')
    ],
    displayText: rating + '/10',
    label: labels[rating] || '',
    isRecommended: rating >= 8
  };
};

/**
 * 格式化日期
 */
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * 格式化价格
 */
const formatPrice = (price) => {
  if (price === undefined || price === null) return '0.00';
  return Number(price).toFixed(2);
};

module.exports = {
  ratingToStars,
  formatDate,
  formatPrice
};
