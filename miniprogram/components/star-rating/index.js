const { ratingToStars } = require('../../utils/util');

Component({
  properties: {
    rating: { type: Number, value: 0 }
  },
  observers: {
    'rating': function(val) {
      const result = ratingToStars(val);
      this.setData(result);
    }
  },
  data: {
    starsArray: [],
    displayText: '0/10',
    isRecommended: false
  },
  lifetimes: {
    attached() {
      const result = ratingToStars(this.properties.rating);
      this.setData(result);
    }
  }
});
