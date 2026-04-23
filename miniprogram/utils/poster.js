const CANVAS_WIDTH = 750;
const CANVAS_HEIGHT = 1334;

const ensureLocalPath = async (src) => {
  if (!src) return '';

  if (/^cloud:\/\//.test(src)) {
    const res = await wx.cloud.downloadFile({ fileID: src });
    return res.tempFilePath || '';
  }

  if (/^https?:\/\//.test(src)) {
    const info = await wx.getImageInfo({ src });
    return info.path || src;
  }

  return src;
};

const wrapText = (ctx, text, x, y, maxWidth, lineHeight, maxLines) => {
  if (!text) return y;
  const chars = String(text).split('');
  let line = '';
  let lineCount = 0;

  for (let i = 0; i < chars.length; i += 1) {
    const testLine = line + chars[i];
    const width = ctx.measureText(testLine).width;
    if (width > maxWidth && line) {
      lineCount += 1;
      const content = lineCount >= maxLines ? `${line.slice(0, Math.max(0, line.length - 1))}...` : line;
      ctx.fillText(content, x, y);
      if (lineCount >= maxLines) return y;
      line = chars[i];
      y += lineHeight;
    } else {
      line = testLine;
    }
  }

  if (line && lineCount < maxLines) {
    ctx.fillText(line, x, y);
  }
  return y;
};

const drawRoundedImage = (ctx, src, x, y, width, height, radius) => {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(src, x, y, width, height);
  ctx.restore();
};

const drawRoundedRect = (ctx, x, y, width, height, radius, fillStyle) => {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
  if (fillStyle) {
    ctx.setFillStyle(fillStyle);
    ctx.fill();
  }
  ctx.restore();
};

const drawGoodsPoster = async ({ page, canvasId, goods, codeFileID }) => {
  const coverSrc = await ensureLocalPath((goods.images || [])[0]);
  const codeSrc = await ensureLocalPath(codeFileID);
  const ctx = wx.createCanvasContext(canvasId, page);

  ctx.setFillStyle('#F7F4ED');
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  drawRoundedImage(ctx, coverSrc, 40, 40, 670, 760, 32);

  drawRoundedRect(ctx, 40, 760, 670, 520, 32, '#FFFFFF');

  ctx.setFillStyle('#1C1C1C');
  ctx.setFontSize(36);
  ctx.setTextBaseline('top');
  wrapText(ctx, goods.name, 76, 810, 520, 48, 2);

  if (goods.subtitle) {
    ctx.setFillStyle('#5F5F5D');
    ctx.setFontSize(24);
    wrapText(ctx, goods.subtitle, 76, 912, 520, 36, 2);
  }

  ctx.setFillStyle('#1C1C1C');
  ctx.setFontSize(42);
  ctx.fillText(`¥${goods.price}`, 76, 1000);

  ctx.setFillStyle('#5F5F5D');
  ctx.setFontSize(24);
  ctx.fillText(`推荐指数 ${goods.rating}/10`, 76, 1060);
  ctx.fillText(`平台 ${goods.platform || '未知'}`, 76, 1100);

  drawRoundedRect(ctx, 76, 1146, 250, 68, 9999, 'rgba(28,28,28,0.04)');
  ctx.setFillStyle('#1C1C1C');
  ctx.setFontSize(24);
  ctx.fillText('租房好物推荐LAB', 110, 1168);

  drawRoundedImage(ctx, codeSrc, 520, 930, 140, 140, 16);
  ctx.setFillStyle('#5F5F5D');
  ctx.setFontSize(22);
  ctx.fillText('长按识别查看详情', 506, 1088);

  await new Promise(resolve => {
    ctx.draw(false, resolve);
  });

  return new Promise((resolve, reject) => {
    wx.canvasToTempFilePath({
      canvasId,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      destWidth: CANVAS_WIDTH,
      destHeight: CANVAS_HEIGHT,
      success: (res) => resolve(res.tempFilePath),
      fail: reject
    }, page);
  });
};

module.exports = {
  drawGoodsPoster
};
