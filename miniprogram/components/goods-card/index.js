Component({
  properties: {
    goods: { type: Object, value: {} }
  },
  methods: {
    onTap() {
      const id = this.properties.goods._id;
      if (id) {
        wx.navigateTo({ url: '/pages/goods/detail/detail?id=' + id });
      }
    }
  }
});
