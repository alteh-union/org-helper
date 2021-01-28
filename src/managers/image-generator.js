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
    try {
      Canvas._registerFont('assets/fonts/BebasNeue-Regular.ttf', { family: 'Bebas Neue' });
      Canvas._registerFont('assets/fonts/BebasNeue-Book.ttf', { family: 'Bebas Neue Book' });
      Canvas._registerFont('assets/fonts/BebasNeue-Light.ttf', { family: 'Bebas Neue Light' });
      Canvas._registerFont('assets/fonts/BebasNeue-Thin.ttf', { family: 'Bebas Neue Thin' });
    } catch (error) {
      this.context.log.e(`ImageGenerator: Failed to include a pre-installed font with
        message: ${error}, stack: ${error.stack}`);
    }
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
    const styleDefinition = this.readStyleVars(templateConfig);
    await this.prepareBaseImage(baseImg, params, templateConfig, styleDefinition);
    await this.addFonts(templateConfig, source, orgId);
    if (templateConfig.items) {
      await this.composeImage(baseImg, templateConfig.items, params, styleDefinition, source, orgId);
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
   * Prepares the list of style-related variable names. Style attributes not found in this list will be ignored.
   * @private
   * @param   {Object}          templateConfig the image template defined as a JSON
   * @returns {Object}                         the list of style-related variable names
   */
  readStyleVars(templateConfig) {
    if (typeof templateConfig.style === 'object' && templateConfig.style !== null) {
      return templateConfig.style;
    } else {
      return {};
    }
  }

  /**
   * Prepares the base image according to the template requirements.
   * @private
   * @param   {DepreciatedJimp} baseImg         the base image
   * @param   {Object}          params          the parameters to be applied for the base image
   * @param   {Object}          templateConfig  the image template defined as a JSON
   * @param   {Object}          styleDefinition the list of style-related variables
   * @returns {Promise}                         nothing
   */
  async prepareBaseImage(baseImg, params, templateConfig, styleDefinition) {
    await baseImg.quality(Number.parseInt(this.context.prefsManager.max_image_template_target_jpeg_quality, 10));

    if (templateConfig.input) {
      if (templateConfig.input.type === 'fixed') {
        const basePicRatio = baseImg.getWidth() / baseImg.getHeight();

        let inputWidth = this.getStyledValue(templateConfig.input.width, params, styleDefinition);
        if (inputWidth > this.context.prefsManager.max_image_template_max_width) {
          inputWidth = this.context.prefsManager.max_image_template_max_width;
        }
        if (inputWidth <= 0) {
          inputWidth = 1;
        }
        let inputHeight = this.getStyledValue(templateConfig.input.height, params, styleDefinition);
        if (inputHeight > this.context.prefsManager.max_image_template_max_height) {
          inputHeight = this.context.prefsManager.max_image_template_max_height;
        }
        if (inputHeight <= 0) {
          inputHeight = 1;
        }

        const inputRatio = inputWidth / inputHeight;
        if (basePicRatio <= inputRatio) {
          await baseImg.resize(inputWidth, jimp.AUTO);
        } else {
          await baseImg.resize(jimp.AUTO, inputHeight);
        }

        const xShift = this.getStyledValue(templateConfig.input.xShift, params, styleDefinition, 'xShift');
        const yShift = this.getStyledValue(templateConfig.input.yShift, params, styleDefinition, 'yShift');

        let x = (baseImg.getWidth() - inputWidth) / 2 + xShift || 0;
        let y = (baseImg.getHeight() - inputHeight) / 2 + yShift || 0;
        x = x < 0 ? 0 : x;
        y = y < 0 ? 0 : y;
        await baseImg.crop(x, y, inputWidth, inputHeight);
      }
    }
  }

  /**
   * Composes the resuot image from the base image using the template rules.
   * @private
   * @param   {DepreciatedJimp} baseImg         the base image
   * @param   {Array}           itemConfigList  the image template defined as a JSON
   * @param   {Object}          params          the parameters to be applied for the base image
   * @param   {Object}          styleDefinition the list of style-related variables
   * @param   {string}          source          the source name from which the request was called
   * @param   {string}          orgId           the organization id which member called the request
   * @returns {Promise}                         nothing
   */
  async composeImage(baseImg, itemConfigList, params, styleDefinition, source, orgId) {
    for (const itemConfig of itemConfigList) {
      switch (itemConfig.type) {
        case 'image': {
          await this.processImageTemplate(itemConfig, baseImg, params, styleDefinition);
          break;
        }
        case 'text': {
          await this.processTextTemplate(itemConfig, baseImg, params, styleDefinition, source, orgId);
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
   * @param   {Object}          itemConfig      the part of the image template defined as a JSON
   * @param   {DepreciatedJimp} baseImg         the base image
   * @param   {Object}          params          the parameters to be applied for the base image
   * @param   {Object}          styleDefinition the list of style-related variables
   * @param   {string}          source          the source name from which the request was called
   * @param   {string}          orgId           the organization id which member called the request
   * @returns {Promise}                         nothing
   */
  async processTextTemplate(itemConfig, baseImg, params, styleDefinition, source, orgId) {
    let x = 0;
    let y = 0;
    if (itemConfig.margin) {
      let marginLeft = this.getStyledValue(itemConfig.margin.left, params, styleDefinition);
      if (marginLeft < 0) {
        marginLeft = 0;
      }

      let marginRight = this.getStyledValue(itemConfig.margin.right, params, styleDefinition);
      if (marginRight < 0) {
        marginRight = 0;
      }

      if (marginLeft + marginRight >= 100) {
        marginLeft = 0;
        marginRight = 0;
      }

      let marginTop = this.getStyledValue(itemConfig.margin.top, params, styleDefinition);
      if (marginTop < 0) {
        marginTop = 0;
      }

      let marginBottom = this.getStyledValue(itemConfig.margin.bottom, params, styleDefinition);
      if (marginBottom < 0) {
        marginBottom = 0;
      }

      if (marginTop + marginBottom >= 100) {
        marginTop = 0;
        marginBottom = 0;
      }

      x = baseImg.getWidth() / 100 * marginLeft || 0;
      y = baseImg.getHeight() / 100 * marginTop || 0;
      const x2 = baseImg.getWidth() - baseImg.getWidth() / 100 * marginRight || 0;
      const y2 = baseImg.getHeight() - baseImg.getHeight() / 100 * marginBottom || 0;
      itemConfig.style.customHeight = y2 - y;
      itemConfig.style.maxWidth = x2 - x;
    }
    // Override font size
    let fontSize = this.getStyledValue(itemConfig.style.fontSize, params, styleDefinition);
    if (!fontSize) {
      fontSize = params.fontSize;
    }
    if (fontSize) {
      itemConfig.style.fontSize = fontSize;
      itemConfig.style.lineHeight = Math.round(fontSize * FONT_SIZE_TO_LINE_HEIGHT);
    }

    const fontFamily = this.getStyledValue(itemConfig.style.fontFamily, params, styleDefinition);
    itemConfig.style.fontFamily = this.addOrgPrefix(fontFamily, source, orgId);

    const textColor = this.getStyledValue(itemConfig.style.textColor, params, styleDefinition);
    if (textColor) {
      itemConfig.style.textColor = textColor;
    }

    let itemText = this.getStyledValue(itemConfig.text, params, styleDefinition);
    if (!itemText) {
      itemText = params.text;
    }
    const linedText = itemText.replace('\\n', '\n');
    const picText = await textToImage.generate(linedText, itemConfig.style || {});
    const picTextBuffer = Buffer.from(picText.split(',')[1], 'base64');
    const jimpText = await jimp.read(picTextBuffer);

    const rotate = this.getStyledValue(itemConfig.rotate, params, styleDefinition);
    if (rotate) {
      await jimpText.rotate(rotate);
    }

    const shear = this.getStyledValue(itemConfig.shear, params, styleDefinition);
    if (shear) {
      this.shear(jimpText, shear);
    }

    const blur = this.getStyledValue(itemConfig.blur, params, styleDefinition);
    if (blur) {
      await jimpText.blur(blur);
    }

    baseImg.composite(jimpText, x, y);
  }

  /**
   * Processes an image item of the template by adding and merging an image layer onto the base image.
   * @private
   * @param   {Object}          itemConfig      the part of the image template defined as a JSON
   * @param   {DepreciatedJimp} baseImg         the base image
   * @param   {Object}          params          the parameters to be applied for the base image
   * @param   {Object}          styleDefinition the list of style-related variables
   * @returns {Promise}                         nothing
   */
  async processImageTemplate(itemConfig, baseImg, params, styleDefinition) {
    const tmpPic = await jimp.read(itemConfig.url);
    // Recursive call for child items
    if (itemConfig.items !== undefined) {
      await this.composeImage(tmpPic, itemConfig.items, params);
    }

    const blendMode = this.getStyledValue(itemConfig.blend, params, styleDefinition) || {};

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

    const rotate = this.getStyledValue(itemConfig.rotate, params, styleDefinition);
    if (rotate) {
      await tmpPic.rotate(rotate);
    }

    const shear = this.getStyledValue(itemConfig.shear, params, styleDefinition);
    if (shear) {
      this.shear(tmpPic, shear);
    }

    const blur = this.getStyledValue(itemConfig.blur, params, styleDefinition);
    if (blur) {
      await tmpPic.blur(blur);
    }

    baseImg.composite(tmpPic, composeX, composeY, blendMode);
  }

  /**
   * Reads a value from JSON object. If the value is not a string or not found in the style parameter names,
   * then reads it as a raw value. If it's a string and found in parameter names, then tries to read it
   * from the parameter. If the style parameter is not set for the command, then reads the default
   * value from the style definition.
   * If the JSON value is not defined, but some default variable name is provided, then tries to find
   * variable with such name directly in the style parameter.
   * If not found anywhere in the mentioned locations - returns undefined.
   * @private
   * @param   {Object} rawValue        the value from JSON object, either raw or pointing to a style attribute
   * @param   {Object} params          the parameters to be applied for the base image
   * @param   {Object} styleDefinition the list of style-related variables
   * @param   {string} defaultName     the default parametername, if missing from the template
   * @returns {Object}                 the result value, raw or styled
   */
  getStyledValue(rawValue, params, styleDefinition, defaultName) {
    if (rawValue === undefined && defaultName !== undefined &&
        params.style !== undefined && params.style !== null && params.style[defaultName] !== undefined) {
      return params.style[defaultName];
    }
    if (typeof rawValue === 'string' && styleDefinition[rawValue] !== undefined) {
      if (params.style !== undefined && params.style !== null && params.style[rawValue] !== undefined) {
        return params.style[rawValue];
      } else {
        return styleDefinition[rawValue];
      }
    }
    return rawValue;
  }

  /**
   * Shears an image layer.
   * @private
   * @param   {DepreciatedJimp} img    the image to be sheared
   * @param   {Number}          offset the tangent offset in pixels
   */
  shear(img, offset) {
    const source = img.cloneQuiet();

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
      resultArr[i] = Math.round(pix1Bytes[i] * (1 - weight) + pix2Bytes[i] * weight);
    }
    const dataview = new DataView(resultArr.buffer);
    return dataview.getUint32(0);
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
