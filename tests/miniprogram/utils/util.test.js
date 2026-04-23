const { ratingToStars, formatDate, formatPrice } = require('../../../miniprogram/utils/util');

describe('miniprogram/utils/util', () => {
  test('ratingToStars clamps value and builds star metadata', () => {
    const result = ratingToStars(11);

    expect(result.fullStars).toBe(5);
    expect(result.halfStar).toBe(0);
    expect(result.emptyStars).toBe(0);
    expect(result.displayText).toBe('10/10');
    expect(result.label).toBe('封神好物');
    expect(result.isRecommended).toBe(true);
  });

  test('ratingToStars handles odd score with half star', () => {
    const result = ratingToStars(7);

    expect(result.fullStars).toBe(3);
    expect(result.halfStar).toBe(1);
    expect(result.emptyStars).toBe(1);
    expect(result.starsArray).toEqual(['full', 'full', 'full', 'half', 'empty']);
  });

  test('formatDate returns yyyy-mm-dd', () => {
    expect(formatDate('2026-04-21T10:30:00.000Z')).toBe('2026-04-21');
  });

  test('formatPrice normalizes empty and numeric values', () => {
    expect(formatPrice(null)).toBe('0.00');
    expect(formatPrice('99')).toBe('99.00');
    expect(formatPrice(19.456)).toBe('19.46');
  });
});
