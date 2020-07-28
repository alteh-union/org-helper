'use strict';

const TextToImage = require('text-to-image');
const Jimp = require('jimp');
const { Canvas } = require('canvas');
const request = require('request');
const fs = require('fs');
const crypto = require('crypto');

const FONT_SIZE_TO_LINE_HEIGHT = 1.1;
const JPEG_QUALITY = 90;
const FILE_CACHE_FOLDER = 'cache/';
const MAX_FONT_FILE_SIZE = 1024 * 1024; // 1 Mb

/**
 * Image generator
 * This class allows to generate new image based on baseImage using a template rules
 */
class ImageGenerator {

  /**
   * Register assets
   */
  constructor() {
    Canvas._registerFont('assets/fonts/BebasNeue-Regular.ttf', { family: 'Bebas Neue' });
    Canvas._registerFont('assets/fonts/BebasNeue-Book.ttf', { family: 'Bebas Neue Book' });
    Canvas._registerFont('assets/fonts/BebasNeue-Light.ttf', { family: 'Bebas Neue Light' });
    Canvas._registerFont('assets/fonts/BebasNeue-Thin.ttf', { family: 'Bebas Neue Thin' });
  }

  /**
   * Main class method. Generates image based on provided template
   * @param picUrl
   * @param params
   * @param templateConfig
   * @returns {Promise<DepreciatedJimp | DepreciatedJimp>}
   */
  async generateImage(picUrl, params, templateConfig) {
    const baseImg = await Jimp.read(picUrl);
    await this._prepareBaseImage(baseImg, params, templateConfig);
    await this._addFonts(templateConfig);
    if (templateConfig.items) {
      await this._composeImage(baseImg, templateConfig.items, params);
    }
    return baseImg;
  }

  /**
   * Delete file
   * @param filePath
   * @returns {Promise<void>}
   * @private
   */
  async _deleteFile(filePath) {
    await fs.unlink(filePath, (err) => {
      if (err) {
        console.log('Delete error: ' + err);
      } else {
        console.log(`File ${filePath} deleted successfully`);
      }
    });
  }

  /**
   * Download file with a size limit
   * @param url
   * @param filePath
   * @param fileSizeLimit
   * @returns {Promise<unknown>}
   * @private
   */
  async _downloadFileWithSizeLimit(url, filePath, fileSizeLimit) {

    console.log(`Download file ${url} to ${filePath}`);
    const downloadFunc = (url, filePath, resolve, reject) => {
      request({
        url: url,
        method: 'HEAD'
      }, (err, headRes) => {
        if (err) {
          console.log(`HEAD request failed for ${url}`);
          reject(err.message);
          return;
        }

        if (headRes.headers['content-length'] && headRes.headers['content-length'] > fileSizeLimit) {
          console.log('File size exceeds limit (' + headRes.headers['content-length'] + ')');
          reject('File size exceeds limit (' + headRes.headers['content-length'] + ')');

        } else {
          if (headRes.headers['content-length']) {
            console.log(`File size ${url} is ${headRes.headers['content-length']}`);
          }

          const file = fs.createWriteStream(filePath);
          const res = request({ url: url });
          let size = 0;

          res.on('response', (response) => {
            if (response.statusCode !== 200) {
              reject('Response status was ' + response.statusCode);
            }
          });

          res.on('error', (err) => {
            this._deleteFile(filePath);
            reject(err.message);
          });

          res.on('data', (data) => {
            size += data.length;
            if (size > fileSizeLimit) {
              console.log('Resource stream exceeded limit (' + size + ')');
              res.abort(); // Abort the response (close and cleanup the stream)
              this._deleteFile(filePath);
              reject('File size  exceeds limit');

            }
          }).pipe(file);

          file.on('error', (err) => { // Handle errors
            console.log(`ImageGenerator: File error ${err}`);
            this._deleteFile(filePath);
            reject(err.message);
          });

          file.on('finish', () => file.close(resolve));
        }
      });
    };
    return new Promise((resolve, reject) => downloadFunc(url, filePath, resolve, reject));
  }

  /**
   * Process `fonts` block of the config
   * @param templateConfig
   * @returns {Promise<void>}
   * @private
   */
  async _addFonts(templateConfig) {
    if (templateConfig.fonts && Array.isArray(templateConfig.fonts)) {
      for (const font of templateConfig.fonts) {
        const fileName = crypto.createHash('md5').update(font.url).digest('hex');
        const filePath = FILE_CACHE_FOLDER + fileName;

        try {
          if (!fs.existsSync(filePath)) {
            await this._downloadFileWithSizeLimit(font.url, filePath, MAX_FONT_FILE_SIZE);
          }
          Canvas._registerFont(filePath, { family: font.name });

        } catch (error) {
          console.log(`ImageGenerator: Failed to download and include font ${font.url} with 
          message: ${error}, stack: ${error.stack}`);
          throw error;
        }
      }
    }
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
          await baseImg.resize(templateConfig.input.width, Jimp.AUTO);
        } else {
          await baseImg.resize(Jimp.AUTO, templateConfig.input.height);
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

    if (itemConfig.rotate) {
      jimpText.rotate(itemConfig.rotate);
    }

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

    if (itemConfig.rotate) {
      tmpPic.rotate(itemConfig.rotate);
    }

    baseImg.composite(tmpPic, composeX, composeY, blendMode);
  }
}

module.exports = ImageGenerator;
