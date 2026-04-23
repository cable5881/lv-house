describe('miniprogram/utils/media', () => {
  beforeEach(() => {
    jest.resetModules();
    global.wx = {
      chooseMedia: jest.fn(),
      editImage: jest.fn(),
      cropImage: jest.fn()
    };
  });

  afterEach(() => {
    delete global.wx;
    jest.restoreAllMocks();
  });

  test('selectEditableImage runs choose -> edit -> crop', async () => {
    global.wx.chooseMedia.mockImplementation(({ success }) => {
      success({ tempFiles: [{ tempFilePath: '/tmp/original.jpg' }] });
    });
    global.wx.editImage.mockImplementation(({ success }) => {
      success({ tempFilePath: '/tmp/edited.jpg' });
    });
    global.wx.cropImage.mockImplementation(({ success }) => {
      success({ tempFilePath: '/tmp/cropped.jpg' });
    });

    const media = require('../../../miniprogram/utils/media');
    const result = await media.selectEditableImage({ cropScale: '1:1' });

    expect(global.wx.chooseMedia).toHaveBeenCalled();
    expect(global.wx.editImage).toHaveBeenCalledWith(
      expect.objectContaining({ src: '/tmp/original.jpg' })
    );
    expect(global.wx.cropImage).toHaveBeenCalledWith(
      expect.objectContaining({ src: '/tmp/edited.jpg', cropScale: '1:1' })
    );
    expect(result).toBe('/tmp/cropped.jpg');
  });

  test('returns empty string when user cancels editing', async () => {
    global.wx.chooseMedia.mockImplementation(({ success }) => {
      success({ tempFiles: [{ tempFilePath: '/tmp/original.jpg' }] });
    });
    global.wx.editImage.mockImplementation(({ fail }) => {
      fail({ errMsg: 'editImage:fail cancel' });
    });

    const media = require('../../../miniprogram/utils/media');
    const result = await media.selectEditableImage({ cropScale: '1:1' });

    expect(result).toBe('');
  });
});

