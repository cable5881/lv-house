const getErrorMessage = (err) => String((err && (err.errMsg || err.message)) || err || '');

const isCancelError = (err) => /cancel/i.test(getErrorMessage(err));

const callWxApi = (methodName, options) => {
  return new Promise((resolve, reject) => {
    if (!globalThis.wx || typeof wx[methodName] !== 'function') {
      reject(new Error(`UNSUPPORTED_${methodName}`));
      return;
    }

    wx[methodName]({
      ...(options || {}),
      success: resolve,
      fail: reject
    });
  });
};

const chooseSingleImage = async (options = {}) => {
  const res = await callWxApi('chooseMedia', {
    count: 1,
    mediaType: ['image'],
    sourceType: options.sourceType || ['album', 'camera']
  });

  const first = (res.tempFiles || [])[0] || {};
  return first.tempFilePath || first.path || '';
};

const editAndCropImage = async (src, options = {}) => {
  let current = src;

  if (options.enableEdit !== false && globalThis.wx && typeof wx.editImage === 'function') {
    try {
      const editRes = await callWxApi('editImage', { src: current });
      current = editRes.tempFilePath || current;
    } catch (err) {
      if (isCancelError(err)) return '';
    }
  }

  if (options.cropScale && globalThis.wx && typeof wx.cropImage === 'function') {
    try {
      const cropRes = await callWxApi('cropImage', {
        src: current,
        cropScale: options.cropScale
      });
      current = cropRes.tempFilePath || current;
    } catch (err) {
      if (isCancelError(err)) return '';
    }
  }

  return current;
};

const selectEditableImage = async (options = {}) => {
  const selectedPath = await chooseSingleImage(options);
  if (!selectedPath) return '';
  return editAndCropImage(selectedPath, options);
};

module.exports = {
  getErrorMessage,
  isCancelError,
  selectEditableImage
};

