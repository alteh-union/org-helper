'use strict';

/**
 * @module image-generator
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const path = require('path');
const textToImage = require('text-to-image');
const jimp = require('jimp');
const { Canvas } = require('canvas');
const fs = require('fs');
const crypto = require('crypto');

const OhUtils = require('../utils/bot-utils');

const FONT_SIZE_TO_LINE_HEIGHT = 1.1;
const FILE_CACHE_FOLDER = 'cache/';

/**
 * Allows to generate new image based on baseImage using template rules.
 * @alias ImageGenerator
 */
class ImageGenerator {
  /**
   * Creates the manager's instance and registers necessary assets.
   * @param {Context} context the Bot's context
   */
  constructor(context) {
    this.context = context;
    Canvas._registerFont('assets/fonts/BebasNeue-Regular.ttf', { family: 'Bebas Neue' });
    Canvas._registerFont('assets/fonts/BebasNeue-Book.ttf', { family: 'Bebas Neue Book' });
    Canvas._registerFont('assets/fonts/BebasNeue-Light.ttf', { family: 'Bebas Neue Light' });
    Canvas._registerFont('assets/fonts/BebasNeue-Thin.ttf', { family: 'Bebas Neue Thin' });
  }

  /**
   * Main class method. Generates image based on provided template.
   * Providing the source name and the org id is needed to register fonts with
   * unique (non-conflicting) family names.
   * @param   {string}                   picUrl         the URL of the picture to make image from
   * @param   {Object}                   params         the addtional parameters to consider during the procedure
   * @param   {Object}                   templateConfig the template defined as a JSON
   * @param   {string}                   source         the source name from which the request was called
   * @param   {string}                   orgId          the organization id which member called the request
   * @returns {Promise<DepreciatedJimp>}                the result image
   */
  async generateImage(picUrl, params, templateConfig, source, orgId) {
    const baseImg = await jimp.read(picUrl);
    await this.prepareBaseImage(baseImg, params, templateConfig);
    await this.addFonts(templateConfig, source, orgId);
    if (templateConfig.items) {
      await this.composeImage(baseImg, templateConfig.items, params, source, orgId);
    }
    return baseImg;
  }

  /**
   * Processes 'fonts' blocks of the image template config.
   * Tries to download and register declared fonts in the local system.
   * @private
   * @param   {Object}  templateConfig the image template defined as a JSON
   * @param   {string}  source         the source name from which the request was called
   * @param   {string}  orgId          the organization id which member called the request
   * @returns {Promise}                nothing
   */
  async addFonts(templateConfig, source, orgId) {
    if (templateConfig.fonts && Array.isArray(templateConfig.fonts)) {
      if (!fs.existsSync(FILE_CACHE_FOLDER)) {
        fs.mkdirSync(FILE_CACHE_FOLDER);
      }

      if (await OhUtils.getFilesCountByPrefix(FILE_CACHE_FOLDER, this.addOrgPrefix('', source, orgId))
        > this.context.prefsManager.max_image_template_fonts_per_discord_org) {
        await OhUtils.deleteFilesByPrefix(FILE_CACHE_FOLDER, this.addOrgPrefix('', source, orgId), this.context.log);
      }

      for (const font of templateConfig.fonts) {
        const fileName = this.addOrgPrefix(crypto.createHash('md5').update(font.url).digest('hex'), source, orgId);
        const filePath = path.join(FILE_CACHE_FOLDER, fileName);

        try {
          if (!fs.existsSync(filePath)) {
            await OhUtils.downloadFileWithSizeLimit(font.url, filePath,
              this.context.prefsManager.max_image_template_font_size, this.context.log);
          }
          Canvas._registerFont(filePath, { family: this.addOrgPrefix(font.name, source, orgId) });

        } catch (error) {
          this.context.log.e(`ImageGenerator: Failed to download and include font ${font.url} with
            message: ${error}, stack: ${error.stack}`);
          throw error;
        }
      }
    }
  }


  /**
   * Prepares the base image according to the template requirements.
   * @private
   * @param   {DepreciatedJimp} baseImg        the base image
   * @param   {Object}          params         the parameters to be applied for the base image
   * @param   {Object}          templateConfig the image template defined as a JSON
   * @returns {Promise}                        nothing
   */
  async prepareBaseImage(baseImg, params, templateConfig) {
    await baseImg.quality(Number.parseInt(this.context.prefsManager.max_image_template_target_jpeg_quality, 10));

    if (templateConfig.input) {
      if (templateConfig.input.type === 'fixed') {
        const basePicRatio = baseImg.getWidth() / baseImg.getHeight();
        const inputRatio = templateConfig.input.width / templateConfig.input.height;
        if (basePicRatio <= inputRatio) {
          await baseImg.resize(templateConfig.input.width, jimp.AUTO);
        } else {
          await baseImg.resize(jimp.AUTO, templateConfig.input.height);
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
   * Composes the resuot image from the base image using the template rules.
   * @private
   * @param   {DepreciatedJimp} baseImg        the base image
   * @param   {Array}           itemConfigList the image template defined as a JSON
   * @param   {Object}          params         the parameters to be applied for the base image
   * @param   {string}          source         the source name from which the request was called
   * @param   {string}          orgId          the organization id which member called the request
   * @returns {Promise}                        nothing
   */
  async composeImage(baseImg, itemConfigList, params, source, orgId) {
    for (const itemConfig of itemConfigList) {
      switch (itemConfig.type) {
        case 'image': {
          await this.processImageTemplate(itemConfig, baseImg, params);
          break;
        }
        case 'text': {
          await this.processTextTemplate(itemConfig, baseImg, params, source, orgId);
          break;
        }
        default:
          throw new Error(`Failed to apply a template. Unknown item type ${itemConfig.type}`);
      }
    }
  }

  /**
   * Processes a text item of the template by adding and merging a text layer onto the base image.
   * @private
   * @param   {Object}          itemConfig the part of the image template defined as a JSON
   * @param   {DepreciatedJimp} baseImg    the base image
   * @param   {Object}          params     the parameters to be applied for the base image
   * @param   {string}          source     the source name from which the request was called
   * @param   {string}          orgId      the organization id which member called the request
   * @returns {Promise}                    nothing
   */
  async processTextTemplate(itemConfig, baseImg, params, source, orgId) {
    let x = 0;
    let y = 0;
    if (itemConfig.margin) {
      if (itemConfig.margin.left < 0) {
        itemConfig.margin.left = 0;
      }
      if (itemConfig.margin.right < 0) {
        itemConfig.margin.right = 0;
      }
      if (itemConfig.margin.left + itemConfig.margin.right >= 100) {
        itemConfig.margin.left = 0;
        itemConfig.margin.right = 0;
      }

      if (itemConfig.margin.top < 0) {
        itemConfig.margin.top = 0;
      }
      if (itemConfig.margin.bottom < 0) {
        itemConfig.margin.bottom = 0;
      }
      if (itemConfig.margin.top + itemConfig.margin.bottom >= 100) {
        itemConfig.margin.top = 0;
        itemConfig.margin.bottom = 0;
      }

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

    itemConfig.style.fontFamily = this.addOrgPrefix(itemConfig.style.fontFamily, source, orgId);
    const picText = await textToImage.generate(params.text, itemConfig.style || {});
    const picTextBuffer = Buffer.from(picText.split(',')[1], 'base64');
    const jimpText = await jimp.read(picTextBuffer);

    if (itemConfig.rotate) {
      await jimpText.rotate(itemConfig.rotate);
    }

    if (itemConfig.shear) {
      this.shear(jimpText, itemConfig.shear);
    }

    if (itemConfig.blur) {
      await jimpText.blur(itemConfig.blur);
    }

    baseImg.composite(jimpText, x, y);
  }

  /**
   * Processes an image item of the template by adding and merging an image layer onto the base image.
   * @private
   * @param   {Object}          itemConfig the part of the image template defined as a JSON
   * @param   {DepreciatedJimp} baseImg    the base image
   * @param   {Object}          params     the parameters to be applied for the base image
   * @returns {Promise}                    nothing
   */
  async processImageTemplate(itemConfig, baseImg, params) {
    const tmpPic = await jimp.read(itemConfig.url);
    // Recursive call for child items
    if (itemConfig.items !== undefined) {
      await this.composeImage(tmpPic, itemConfig.items, params);
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
      await tmpPic.rotate(itemConfig.rotate);
    }

    if (itemConfig.shear) {
      this.shear(tmpPic, itemConfig.shear);
    }

    if (itemConfig.blur) {
      await tmpPic.blur(itemConfig.blur);
    }

    baseImg.composite(tmpPic, composeX, composeY, blendMode);
  }

  /**
   * Shears an image layer.
   * @private
   * @param   {DepreciatedJimp} img    the image to be sheared
   * @param   {Number}          offset the tangent offset in pixels
   */
  shear(img, offset) {
    const source = img.cloneQuiet();
    img.scanQuiet(0, 0, img.bitmap.width, img.bitmap.height,
      (x, y, idx) => {
        img.bitmap.data.writeUInt32BE(img._background, idx);
      });

    // Resize to fit result
    img.resize(img.getWidth(), img.getHeight() + Math.abs(offset));

    img.scanQuiet(0, 0, img.bitmap.width, img.bitmap.height,
      (x, y, idx) => {
        let displacement = 0;
        if (offset > 0) {
          displacement = x / source.getWidth() * offset;
        } else {
          displacement = (x - source.getWidth()) / source.getWidth() * offset;
        }
        const pixelOffset = displacement - Math.round(displacement);
        displacement = Math.round(displacement);

        const sourceY = y - displacement;
        let pixelRGBA = img._background;
        if (sourceY >= 0) {
          pixelRGBA = source.bitmap.data.readUInt32BE(source.getPixelIndex(x, sourceY));
        }

        const sourceBlendY = pixelOffset < 0 ? sourceY + 1 : sourceY - 1;
        let pixelToBlend = img._background;
        if (sourceBlendY >= 0) {
          const pixelToBlendIds = source.getPixelIndex(x, sourceBlendY);
          pixelToBlend = source.bitmap.data.readUInt32BE(pixelToBlendIds);
        }
        const pixelBlended = this.blendPixels(pixelRGBA, pixelToBlend, Math.abs(pixelOffset));
        img.bitmap.data.writeUInt32BE(pixelBlended, idx);
      });

    return img;
  }

  /**
   * Blend 2 pixels using their weight.
   * @private
   * @param   {Uint32Array}   pix1   the color of the first pixel as a byte array
   * @param   {Uint32Array}   pix2   the color of the second pixel as a byte array
   * @param   {Number}        weight the weight of the 2nd pixel (0.0 to 1.0)
   * @returns {Uint32Array}          the blended pixel
   */
  blendPixels(pix1, pix2, weight) {
    if (pix1 === pix2 || weight === 0) {
      return pix1;
    }

    function toBytesInt32(num) {
      const arr = new Uint8Array([
        (num & 0xff000000) >> 24,
        (num & 0x00ff0000) >> 16,
        (num & 0x0000ff00) >> 8,
        (num & 0x000000ff)
      ]);
      return arr.buffer;
    }

    const pix1Bytes = new Uint8Array(toBytesInt32(pix1));
    const pix2Bytes = new Uint8Array(toBytesInt32(pix2));
    const resultArr = new Uint8Array(4);
    for (let i = 0; i < 4; i++) {
      resultArr[i] = Math.round(Math.sqrt(Math.pow(pix1Bytes[i], 2) * (1 - weight) +
        Math.pow(pix2Bytes[i], 2) * weight));
    }
    return new Uint32Array(resultArr.buffer)[0];
  }

  /**
   * Adds source and organization prefix.
   * @private
   * @param   {string}   baseString   the string which needs to be prepended with prefix
   * @param   {string}   source       the source name from which the request was called
   * @param   {string}   orgId        the organization id which member called the request
   * @returns {string}                the new prepended string
   */
  addOrgPrefix(baseString, source, orgId) {
    return source + '_' + orgId + '_' + baseString;
  }
}

/**
 * Exports the ImageGenerator class
 * @type {ImageGenerator}
 */
module.exports = ImageGenerator;
