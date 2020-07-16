'use strict';

/**
 * @module arg-validation-tree
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const BotPublicError = require('../utils/bot-public-error');
const OhUtils = require('../utils/bot-utils');

const DiscordSubjectsArg = require('../command_meta/discord-subjects-arg');
const DiscordChannelsArg = require('../command_meta/discord-channels-arg');
const TimeArg = require('../command_meta/time-arg');

/**
 * Validates arguments and check validation dependencies.
 * @see CommandArgDef
 * @alias ArgValidationTree
 */
class ArgValidationTree {
  /**
   * The tree of argument validation definitions and dependencies.
   * The options at the root of the tree are implied by the options closer to leafs.
   * Nodes also have links to functions which needs to be executed in order to validate the option.
   * Not all validation options must be covered by the tree. For example, "anyValueAllowed" validation option
   * is a modifier which alternates some other validations but does not have an execution function for itself.
   * @type {Object}
   */
  static get VALIDATION_TREE() {
    if (this.tree === undefined) {
      this.tree = Object.freeze({
        impliers: {
          nonNull: {
            validationFunc: this.isNonNull,
            impliers: {
              isSubjects: {
                validationFunc: this.isSubjects,
                impliers: {
                  subjectsNonEmpty: { validationFunc: this.areSubjectsNonEmpty },
                  validSubjects: { validationFunc: this.areValidSubjects },
                  subjectRolesOnly: { validationFunc: this.areSubjectRolesOnly },
                  subjectIdsOnly: { validationFunc: this.areSubjectIdsOnly }
                }
              },
              isChannels: {
                validationFunc: this.isChannels,
                impliers: {
                  channelsNonEmpty: { validationFunc: this.areChannelsNonEmpty },
                  validChannels: { validationFunc: this.areValidChannels },
                  validTextChannels: { validationFunc: this.areValidTextChannels },
                  validVoiceChannels: { validationFunc: this.areValidVoiceChannels }
                }
              },
              isTime: {
                validationFunc: this.isTime,
                impliers: {
                  timeDistanceOnly: { validationFunc: this.isTimeDistanceOnly },
                  timeScheduleOnly: { validationFunc: this.isTimeScheduleOnly },
                  nonZeroShift: { validationFunc: this.isNonZeroShift }
                }
              },
              isArray: {
                validationFunc: this.isArray,
                impliers: {
                  isIdsArray: { validationFunc: this.isIdsArray }
                }
              },
              isOnOff: { validationFunc: this.isOnOff },
              isInteger: {
                validationFunc: this.isInteger,
                impliers: {
                  isNonNegativeInteger: { validationFunc: this.isNonNegativeInteger }
                }
              }
            }
          }
        }
      });
    }

    return this.tree;
  }

  /**
   * Auto-completes validation options according to the dependencies' tree.
   * Adds validation options which are implied by existing options.
   * @param  {CommandArgDef} argDef the argument definition
   */
  static async autoCompleteValidationOptions(argDef) {
    const thiz = this;
    async function onLastEntry(argDef, traversalStack) {
      const currentElement = traversalStack[traversalStack.length - 1];
      // Check each option only once during the traversal, but before its children.
      if (argDef.validationOptions[currentElement.name] === true) {
        thiz.autoCompleteValidationFromStack(argDef, traversalStack);
      }
    }

    await this.traverseTreeWithActions(argDef, { onLastEntry });
  }

  /**
   * Auto-completes validation options according to the current state of the validation tree's traversal stack.
   * Should be called from a traversal function.
   * @param  {CommandArgDef} argDef the argument definition
   * @param  {Array<Object>} stack  the current traversal stack of the validation tree
   */
  static autoCompleteValidationFromStack(argDef, stack) {
    for (let i = stack.length - 1; i >= 1; i--) {
      argDef.validationOptions[stack[i].name] = true;
    }
  }

  /**
   * Validates values of a command's arguments.
   * @param  {Command}  command the command to validate
   */
  static async validateCommandArguments(command) {
    const args = Object.values(command.constructor.getDefinedArgs());

    const results = [];
    for (const argDef of args) {
      const argValue = command[argDef.name];
      results.push(this.validateArgument(argDef, argValue, command));
    }

    await Promise.all(results);
  }

  /**
   * Validates a command's argument value according to it's definition and validation options.
   * @throws BotPublicError
   * @param  {CommandArgDef} argDef      the argument definition
   * @param  {Object}        argValue    the argument value
   * @param  {Command}       command     the command having the argument
   */
  static async validateArgument(argDef, argValue, command) {
    async function onFirstEntry(argDef, traversalStack, argValue, command) {
      const currentElement = traversalStack[traversalStack.length - 1];
      // Check each option only once during the traversal, but before its children.
      if (argDef.validationOptions[currentElement.name] === true) {
        if (currentElement.func !== undefined) {
          await currentElement.func(argDef, argValue, command);
        }
      }
    }

    await this.traverseTreeWithActions(argDef, { onFirstEntry }, argValue, command);
  }

  /**
   * Traverses the validation tree and performs actions at specific points (if such actions are defined).
   * Can throw errors (for example, if validation is not passed).
   * @throws BotPublicError
   * @param  {CommandArgDef}    argDef          the argument definition
   * @param  {Object<Function>} traverseActions the set of functions to be called during the traversal
   * @param  {Object}           argDef          the argument value (can be undefined, if not running for a command)
   * @param  {Command}          command         the command instance (can be undefined, if running not for an instance)
   */
  static async traverseTreeWithActions(argDef, traverseActions, argValue, command) {
    const traversalStack = [];
    traversalStack.push({ children: this.VALIDATION_TREE.impliers, name: null, childIndex: 0 });

    while (traversalStack.length > 0) {
      const currentElement = traversalStack[traversalStack.length - 1];
      let childrenKeys = [];
      if (currentElement.children !== undefined && currentElement.children !== null) {
        childrenKeys = Object.keys(currentElement.children);
      }

      const currentIndex = currentElement.childIndex;

      // Tree traversal must be synchronized.
      /* eslint-disable no-await-in-loop */
      if (traverseActions.onFirstEntry !== undefined && traverseActions.onFirstEntry !== null && currentIndex === 0) {
        await traverseActions.onFirstEntry(argDef, traversalStack, argValue, command);
      }

      if (currentIndex >= childrenKeys.length) {
        if (traverseActions.onLastEntry !== undefined && traverseActions.onLastEntry !== null) {
          await traverseActions.onLastEntry(argDef, traversalStack, argValue, command);
        }

        traversalStack.pop();

        if (traversalStack.length > 0) {
          traversalStack[traversalStack.length - 1].childIndex++;
        }
      } else {
        traversalStack.push({
          children: currentElement.children[childrenKeys[currentIndex]].impliers,
          name: childrenKeys[currentIndex],
          childIndex: 0,
          func: currentElement.children[childrenKeys[currentIndex]].validationFunc
        });
      }
      /* eslint-enable no-await-in-loop */
    }
  }

  /**
   * Validates a command's argument value against the nonNull condition.
   * @throws BotPublicError
   * @param  {CommandArgDef} argDef      the argument definition
   * @param  {Object}        argValue    the argument value
   * @param  {Command}       command     the command having the argument
   */
  static async isNonNull(argDef, argValue, command) {
    if (argValue === undefined || argValue === null) {
      ArgValidationTree.generateValidationError(argDef, command, 'no arg provided:', 'arg_validation_no_arg');
    }
  }

  /**
   * Validates a command's argument value against the isSubjects condition.
   * If singleEntity option is true, then also checks the count of subjects (should be 1).
   * @throws BotPublicError
   * @param  {CommandArgDef} argDef      the argument definition
   * @param  {Object}        argValue    the argument value
   * @param  {Command}       command     the command having the argument
   */
  static async isSubjects(argDef, argValue, command) {
    if (!(argValue instanceof DiscordSubjectsArg)) {
      ArgValidationTree.generateValidationError(
        argDef,
        command,
        'wrong subjects provided:',
        'arg_validation_wrong_subjects'
      );
    }
    if (argDef.validationOptions.singleEntity && (argValue.subjectIds.length + argValue.subjectRoles.length) > 1) {
      ArgValidationTree.generateValidationError(argDef, command, 'subjects array length > 1:',
        'arg_validation_non_single_subject_array');
    }
  }

  /**
   * Validates a command's argument value against the subjectsNonEmpty condition.
   * @throws BotPublicError
   * @param  {CommandArgDef} argDef      the argument definition
   * @param  {Object}        argValue    the argument value
   * @param  {Command}       command     the command having the argument
   */
  static async areSubjectsNonEmpty(argDef, argValue, command) {
    if (argValue.isEmpty()) {
      ArgValidationTree.generateValidationError(argDef, command, 'no subjects provided:', 'arg_validation_no_subjects');
    }
  }

  /**
   * Validates a command's argument value against the validSubjects condition.
   * @throws BotPublicError
   * @param  {CommandArgDef} argDef      the argument definition
   * @param  {Object}        argValue    the argument value
   * @param  {string}        commandName the command name
   */
  static async areValidSubjects(argDef, argValue, command) {
    if (!(argDef.validationOptions.anyValueAllowed === true && argValue.subjectIds[0] === OhUtils.ANY_VALUE)) {
      if (await argValue.validateDiscordSubjectsArg(command.context, command.orgId)) {
        ArgValidationTree.generateValidationError(
          argDef,
          command,
          'wrong subjects provided:',
          'arg_validation_wrong_subjects'
        );
      }
    }
  }

  /**
   * Validates a command's argument value against the subjectRolesOnly condition.
   * @throws BotPublicError
   * @param  {CommandArgDef} argDef      the argument definition
   * @param  {Object}        argValue    the argument value
   * @param  {string}        commandName the command name
   */
  static async areSubjectRolesOnly(argDef, argValue, command) {
    if (!(argDef.validationOptions.anyValueAllowed === true && argValue.subjectIds[0] === OhUtils.ANY_VALUE)) {
      if (argValue.subjectIds.length > 0) {
        ArgValidationTree.generateValidationError(
          argDef,
          command,
          'subject ids provided instead of roles:',
          'arg_validation_only_roles_allowed'
        );
      }
    }
  }

  /**
   * Validates a command's argument value against the subjectIdsOnly condition.
   * @throws BotPublicError
   * @param  {CommandArgDef} argDef      the argument definition
   * @param  {Object}        argValue    the argument value
   * @param  {string}        commandName the command name
   */
  static async areSubjectIdsOnly(argDef, argValue, command) {
    if (!(argDef.validationOptions.anyValueAllowed === true && argValue.subjectIds[0] === OhUtils.ANY_VALUE)) {
      if (argValue.subjectRoles.length > 0) {
        ArgValidationTree.generateValidationError(
          argDef,
          command,
          'subject roles provided instead of ids:',
          'arg_validation_only_ids_allowed'
        );
      }
    }
  }

  /**
   * Validates a command's argument value against the isChannels condition.
   * If singleEntity option is true, then also checks the count of channels (should be 1).
   * @throws BotPublicError
   * @param  {CommandArgDef} argDef      the argument definition
   * @param  {Object}        argValue    the argument value
   * @param  {string}        commandName the command name
   */
  static async isChannels(argDef, argValue, command) {
    if (!(argValue instanceof DiscordChannelsArg)) {
      ArgValidationTree.generateValidationError(
        argDef,
        command,
        'wrong channels provided:',
        'arg_validation_wrong_channels'
      );
    }
    if (argDef.validationOptions.singleEntity && argValue.channels.length > 1) {
      ArgValidationTree.generateValidationError(argDef, command, 'channels array length > 1:',
        'arg_validation_non_single_channel_array');
    }
  }

  /**
   * Validates a command's argument value against the channelsNonEmpty condition.
   * @throws BotPublicError
   * @param  {CommandArgDef} argDef      the argument definition
   * @param  {Object}        argValue    the argument value
   * @param  {string}        commandName the command name
   */
  static async areChannelsNonEmpty(argDef, argValue, command) {
    if (argValue.isEmpty()) {
      ArgValidationTree.generateValidationError(argDef, command, 'no channels provided:', 'arg_validation_no_channels');
    }
  }

  /**
   * Validates a command's argument value against the validChannels condition.
   * @throws BotPublicError
   * @param  {CommandArgDef} argDef      the argument definition
   * @param  {Object}        argValue    the argument value
   * @param  {string}        commandName the command name
   */
  static async areValidChannels(argDef, argValue, command) {
    if (!(argDef.validationOptions.anyValueAllowed === true && argValue.channels[0] === OhUtils.ANY_VALUE)) {
      if (await argValue.validateDiscordChannelsArg(command.context, command.orgId)) {
        ArgValidationTree.generateValidationError(
          argDef,
          command,
          'wrong channels provided:',
          'arg_validation_wrong_channels'
        );
      }
    }
  }

  /**
   * Validates a command's argument value against the validTextChannels condition.
   * @throws BotPublicError
   * @param  {CommandArgDef} argDef      the argument definition
   * @param  {Object}        argValue    the argument value
   * @param  {string}        commandName the command name
   */
  static async areValidTextChannels(argDef, argValue, command) {
    if (!(argDef.validationOptions.anyValueAllowed === true && argValue.channels[0] === OhUtils.ANY_VALUE)) {
      if (await argValue.validateDiscordTextChannelsArg(command.context, command.orgId)) {
        ArgValidationTree.generateValidationError(
          argDef,
          command,
          'wrong text channels provided:',
          'arg_validation_wrong_text_channels'
        );
      }
    }
  }

  /**
   * Validates a command's argument value against the validVoiceChannels condition.
   * @throws BotPublicError
   * @param  {CommandArgDef} argDef      the argument definition
   * @param  {Object}        argValue    the argument value
   * @param  {string}        commandName the command name
   */
  static async areValidVoiceChannels(argDef, argValue, command) {
    if (!(argDef.validationOptions.anyValueAllowed === true && argValue.channels[0] === OhUtils.ANY_VALUE)) {
      if (await argValue.validateDiscordVoiceChannelsArg(command.context, command.orgId)) {
        ArgValidationTree.generateValidationError(
          argDef,
          command,
          'wrong voice channels provided:',
          'arg_validation_wrong_voice_channels'
        );
      }
    }
  }

  /**
   * Validates a command's argument value against the isTime condition.
   * @throws BotPublicError
   * @param  {CommandArgDef} argDef      the argument definition
   * @param  {Object}        argValue    the argument value
   * @param  {string}        commandName the command name
   */
  static async isTime(argDef, argValue, command) {
    if (!(argValue instanceof TimeArg)) {
      ArgValidationTree.generateValidationError(argDef, command, 'wrong time provided:', 'arg_validation_wrong_time');
    }
  }

  /**
   * Validates a command's argument value against the timeDistanceOnly condition.
   * @throws BotPublicError
   * @param  {CommandArgDef} argDef      the argument definition
   * @param  {Object}        argValue    the argument value
   * @param  {string}        commandName the command name
   */
  static async isTimeDistanceOnly(argDef, argValue, command) {
    if (argValue.timeType !== TimeArg.DISTANCE_TYPE) {
      ArgValidationTree.generateValidationError(
        argDef,
        command,
        'schedule provided instead of distance:',
        'arg_validation_time_only_distance_allowed'
      );
    }
  }

  /**
   * Validates a command's argument value against the timeScheduleOnly condition.
   * @throws BotPublicError
   * @param  {CommandArgDef} argDef      the argument definition
   * @param  {Object}        argValue    the argument value
   * @param  {string}        commandName the command name
   */
  static async isTimeScheduleOnly(argDef, argValue, command) {
    if (argValue.timeType !== TimeArg.SCHEDULE_TYPE && argValue.timeType !== TimeArg.SCHEDULE_REPEAT_TYPE) {
      ArgValidationTree.generateValidationError(
        argDef,
        command,
        'distance provided instead of schedule:',
        'arg_validation_time_only_schedule_allowed'
      );
    }
  }

  /**
   * Validates a command's argument value against the nonZeroShift condition.
   * @throws BotPublicError
   * @param  {CommandArgDef} argDef      the argument definition
   * @param  {Object}        argValue    the argument value
   * @param  {string}        commandName the command name
   */
  static async isNonZeroShift(argDef, argValue, command) {
    if (argValue.timeType === TimeArg.DISTANCE_TYPE && argValue.totalMillisecondsShift === 0) {
      ArgValidationTree.generateValidationError(argDef, command, '0 shift time:', 'arg_validation_time_zero_shift');
    }
  }

  /**
   * Validates a command's argument value against the isArray condition.
   * If singleEntity option is true, then also checks the count of elements (should be 1).
   * @throws BotPublicError
   * @param  {CommandArgDef} argDef      the argument definition
   * @param  {Object}        argValue    the argument value
   * @param  {string}        commandName the command name
   */
  static async isArray(argDef, argValue, command) {
    if (!Array.isArray(argValue)) {
      ArgValidationTree.generateValidationError(argDef, command, 'wrong array:', 'arg_validation_wrong_array');
    }
    if (argDef.validationOptions.singleEntity && argValue.length > 1) {
      ArgValidationTree.generateValidationError(argDef, command, 'array length > 1:',
        'arg_validation_non_single_entity_array');
    }
  }

  /**
   * Validates a command's argument value against the isIdsArray condition.
   * @throws BotPublicError
   * @param  {CommandArgDef} argDef      the argument definition
   * @param  {Object}        argValue    the argument value
   * @param  {string}        commandName the command name
   */
  static async isIdsArray(argDef, argValue, command) {
    for (const value of argValue) {
      if (!value.match(/^\d+$/) || Number.parseInt(value, 10) < 0) {
        ArgValidationTree.generateValidationError(
          argDef,
          command,
          'wrong ids array:',
          'arg_validation_wrong_ids_array'
        );
      }
    }
  }

  /**
   * Validates a command's argument value against the isOnOff condition.
   * @throws BotPublicError
   * @param  {CommandArgDef} argDef      the argument definition
   * @param  {Object}        argValue    the argument value
   * @param  {Command}       command     the command having the argument
   */
  static async isOnOff(argDef, argValue, command) {
    if (typeof argValue !== 'boolean') {
      const acceptableStrings = [
        command.langManager.getString('arg_boolean_off'),
        command.langManager.getString('arg_boolean_on'),
        command.langManager.getString('arg_boolean_false'),
        command.langManager.getString('arg_boolean_true')
      ];
      ArgValidationTree.generateValidationError(argDef, command, 'wrong on/off arg:', 'arg_validation_wrong_on_off', [
        acceptableStrings.join(', ')
      ]);
    }
  }

  /**
   * Validates a command's argument value against the isInteger condition.
   * @throws BotPublicError
   * @param  {CommandArgDef} argDef      the argument definition
   * @param  {Object}        argValue    the argument value
   * @param  {string}        commandName the command name
   */
  static async isInteger(argDef, argValue, command) {
    if (!argValue.match(/^\d+$/) || argValue === '') {
      ArgValidationTree.generateValidationError(
        argDef,
        command,
        'wrong integer:',
        'arg_validation_wrong_integer'
      );
    }
  }

  /**
   * Validates a command's argument value against the isNonNegativeInteger condition.
   * @throws BotPublicError
   * @param  {CommandArgDef} argDef      the argument definition
   * @param  {Object}        argValue    the argument value
   * @param  {string}        commandName the command name
   */
  static async isNonNegativeInteger(argDef, argValue, command) {
    if (Number.parseInt(argValue, 10) < 0) {
      ArgValidationTree.generateValidationError(
        argDef,
        command,
        'wrong non-negative integer:',
        'arg_validation_wrong_non_negative_integer'
      );
    }
  }

  /**
   * Creates and throws a public error as a result of validation violation for an argument.
   * @throws BotPublicError
   * @param  {CommandArgDef} argDef              the argument definition
   * @param  {Command}       command             the command having the argument
   * @param  {string}        logText             the string to be logged internally
   * @param  {string}        publicTextId        the id of the text to be displayed to the users
   * @param  {Array<string>} additionalArguments the additional arguments for the public string (besides the alias)
   */
  static generateValidationError(argDef, command, logText, publicTextId, additionalArguments) {
    const commandName = command.constructor.getCommandInterfaceName();
    const mainAlias = command.langManager.getString(argDef.aliasIds[0]);
    let publicTextsArray = [mainAlias];
    if (additionalArguments !== undefined) {
      publicTextsArray = publicTextsArray.concat(additionalArguments);
    }

    command.context.log.e(commandName + ' validateArgs: ' + logText + ' ' + mainAlias);
    throw new BotPublicError(command.langManager.getString(publicTextId, publicTextsArray));
  }
}

/**
 * Exports the ArgValidationTree class
 * @type {ArgValidationTree}
 */
module.exports = ArgValidationTree;
