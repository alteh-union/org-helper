'use strict';

const TextToImage = require('text-to-image');
const Jimp = require('jimp');
const FONT_SIZE_TO_LINE_HEIGHT = 1.1;
const JPEG_QUALITY = 90;
const { registerFont } = require('canvas');


/**
 * Image generator
 * This class allows to generate new image based on baseImage using a template rules
 */
class ImageGenerator {

  /**
   * Register assets
   */
  constructor() {
    registerFont('assets/fonts/MyriadPro-Bold.otf', { family: 'Myriad Pro' });
  }

  async generateImage(picUrl, params, templateConfig) {
    const baseImg = await Jimp.read(picUrl);
    await this._prepareBaseImage(baseImg, params, templateConfig);
    if (templateConfig.items) {
      await this._composeImage(baseImg, templateConfig.items, params);
    }
    return baseImg;
  }

  /**
   * Prepare base image for according to template requirements
   * @param baseImg
   * @param params
   * @param templateConfig
   * @returns {Promise<void>}
   */
  async _prepareBaseImage(baseImg, params, templateConfig) {
    await baseImg.quality(JPEG_QUALITY);

    if (templateConfig.input) {
      if (templateConfig.input.type === 'fixed') {
        const basePicRatio = baseImg.getWidth() / baseImg.getHeight();
        const inputRatio = templateConfig.input.width / templateConfig.input.height;
        if (basePicRatio <= inputRatio) {
          await baseImg.scaleToFit(templateConfig.input.width, Jimp.AUTO);
        } else {
          await baseImg.scaleToFit(Jimp.AUTO, templateConfig.input.height);
        }
        let x = (baseImg.getWidth() - templateConfig.input.width) / 2 + params.xShift || 0;
        let y = (baseImg.getHeight() - templateConfig.input.height) / 2 + params.yShift || 0;
        x = x < 0 ? 0 : x;
        y = y < 0 ? 0 : y;
        await baseImg.crop(x, y, templateConfig.input.width, templateConfig.input.height);
      }
    }
  }

  /**
   * Compose baseImage using template rules
   * @param baseImg
   * @param itemConfigList
   * @param params
   * @returns {Promise<void>}
   * @private
   */
  async _composeImage(baseImg, itemConfigList, params) {
    for (const itemConfig of itemConfigList) {
      switch (itemConfig.type) {
        case 'image': {
          await this._processImageTemplate(itemConfig, params, baseImg);
          break;
        }
        case 'text': {
          await this._processTextTemplate(itemConfig, baseImg, params);
          break;
        }
        default:
          throw new Error(`Failed to apply a template. Unknown item type ${itemConfig.type}`);
      }
    }
  }

  /**
   * Process text item of template
   * @param itemConfig
   * @param baseImg
   * @param params
   * @returns {Promise<void>}
   */
  async _processTextTemplate(itemConfig, baseImg, params) {
    let x = 0;
    let y = 0;
    if (itemConfig.margin) {
      x = baseImg.getWidth() / 100 * itemConfig.margin.left || 0;
      y = baseImg.getHeight() / 100 * itemConfig.margin.top || 0;
      const x2 = baseImg.getWidth() - baseImg.getWidth() / 100 * itemConfig.margin.right || 0;
      const y2 = baseImg.getHeight() - baseImg.getHeight() / 100 * itemConfig.margin.bottom || 0;
      itemConfig.style.customHeight = y2 - y;
      itemConfig.style.maxWidth = x2 - x;
    }
    // Override font size
    if (params.fontSize) {
      itemConfig.style.fontSize = params.fontSize;
      itemConfig.style.lineHeight = Math.round(params.fontSize * FONT_SIZE_TO_LINE_HEIGHT);
    }
    const picText = await TextToImage.generate(params.text, itemConfig.style || {});
    const picTextBuffer = Buffer.from(picText.split(',')[1], 'base64');
    const jimpText = await Jimp.read(picTextBuffer);
    baseImg.composite(jimpText, x, y);
  }

  /**
   * Process image item of template
   * @param itemConfig
   * @param params
   * @param baseImg
   * @returns {Promise<void>}
   */
  async _processImageTemplate(itemConfig, params, baseImg) {
    const tmpPic = await Jimp.read(itemConfig.url);
    // Recursive call for child items
    if (itemConfig.items !== undefined) {
      await this._composeImage(tmpPic, itemConfig.items, params);
    }

    const blendMode = itemConfig.blend || {};

    let composeX = 0;
    let composeY = 0;
    switch (itemConfig.align) {
      case 'top':
        if (itemConfig.autoscale) {
          tmpPic.scaleToFit(baseImg.getWidth(), Number.MAX_VALUE);
        }
        break;

      case 'left':
        if (itemConfig.autoscale) {
          tmpPic.scaleToFit(Number.MAX_VALUE, baseImg.getHeight());
        }
        break;

      case 'bottom':
        if (itemConfig.autoscale) {
          tmpPic.scaleToFit(baseImg.getWidth(), Number.MAX_VALUE);
        }
        composeX = 0;
        composeY = baseImg.getHeight() - tmpPic.getHeight();
        break;

      case 'right':
        if (itemConfig.autoscale) {
          tmpPic.scaleToFit(Number.MAX_VALUE, baseImg.getHeight());
        }
        composeX = baseImg.getWidth() - tmpPic.getWidth();
        composeY = 0;
        break;
      default:
        if (itemConfig.autoscale) {
          tmpPic.scaleToFit(baseImg.getWidth(), baseImg.getHeight());
        }
    }

    baseImg.composite(tmpPic, composeX, composeY, blendMode);
  }
}

module.exports = ImageGenerator;
