'use strict';

/**
 * @module time-arg
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE.md file for details)
 */

const OhUtils = require('../utils/bot-utils');

const momentTz = require('moment-timezone');

const TimeTypes = Object.freeze({
  distance: 'distance',
  schedule: 'schedule',
  scheduleRepeat: 'scheduleRepeat',
});

const TimeArgPredefinedValues = Object.freeze({
  today: 'arg_time_value_today',
  all: 'arg_time_value_all',
});

const TimeArgUnits = Object.freeze({
  year: 'arg_time_value_year',
  month: 'arg_time_value_month',
  week: 'arg_time_value_week',
  dayofweek: 'arg_time_value_dayofweek',
  day: 'arg_time_value_day',
  hour: 'arg_time_value_hour',
  minute: 'arg_time_value_minute',
  second: 'arg_time_value_second',
});

const ShiftTypes = Object.freeze({
  predefined: 'predefined',
  milliseconds: 'milliseconds',
  seconds: 'seconds',
  minutes: 'minutes',
  hours: 'hours',
  timezone: 'timezone',
  dayofweek: 'dayofweek',
  days: 'days',
  weeks: 'weeks',
  months: 'months',
  years: 'years',
});

const MonthNames = Object.freeze({
  january: { short: 'arg_time_month_short_january', full: 'arg_time_month_full_january' },
  february: { short: 'arg_time_month_short_february', full: 'arg_time_month_full_february' },
  march: { short: 'arg_time_month_short_march', full: 'arg_time_month_full_march' },
  april: { short: 'arg_time_month_short_april', full: 'arg_time_month_full_april' },
  may: { short: 'arg_time_month_short_may', full: 'arg_time_month_full_may' },
  june: { short: 'arg_time_month_short_june', full: 'arg_time_month_full_june' },
  july: { short: 'arg_time_month_short_july', full: 'arg_time_month_full_july' },
  august: { short: 'arg_time_month_short_august', full: 'arg_time_month_full_august' },
  september: { short: 'arg_time_month_short_september', full: 'arg_time_month_full_september' },
  october: { short: 'arg_time_month_short_october', full: 'arg_time_month_full_october' },
  november: { short: 'arg_time_month_short_november', full: 'arg_time_month_full_november' },
  december: { short: 'arg_time_month_short_december', full: 'arg_time_month_full_december' },
});

const DayOfWeekNames = Object.freeze({
  sunday: { short: 'arg_time_dayofweek_short_sunday', full: 'arg_time_dayofweek_full_sunday' },
  monday: { short: 'arg_time_dayofweek_short_monday', full: 'arg_time_dayofweek_full_monday' },
  tuesday: { short: 'arg_time_dayofweek_short_tuesday', full: 'arg_time_dayofweek_full_tuesday' },
  wednesday: { short: 'arg_time_dayofweek_short_wednesday', full: 'arg_time_dayofweek_full_wednesday' },
  thursday: { short: 'arg_time_dayofweek_short_thursday', full: 'arg_time_dayofweek_full_thursday' },
  friday: { short: 'arg_time_dayofweek_short_friday', full: 'arg_time_dayofweek_full_friday' },
  saturday: { short: 'arg_time_dayofweek_short_saturday', full: 'arg_time_dayofweek_full_saturday' },
});

// Keep the keys intact with ShiftTypes
const RecurrenceShifts = Object.freeze({
  years: { minValue: 1970, maxValue: 2100, step: 1 },
  months: { minValue: 0, maxValue: 11, step: 1 },
  days: { minValue: 1, maxValue: 31, step: 1 },
  hours: { minValue: 0, maxValue: 23, step: 1 },
  minutes: { minValue: 0, maxValue: 59, step: 1 },
  seconds: { minValue: 0, maxValue: 59, step: 1 },
  milliseconds: { minValue: 0, maxValue: 999, step: 249 },
});

const AnyValueInt = Number.parseInt(OhUtils.ANY_VALUE, 10);

const AnyValueUi = '*';
const HourMinuteSecondSeparator = ':';

/**
 * Command's argument object representing a time definition (time distance or one-shot/recurring schedule).
 * @alias TimeArg
 */
class TimeArg {
  /**
   * Constructs an instance of the class
   * @param {LangManager} langManager the language maager to work with language-dependent values
   */
  constructor(langManager) {
    Object.defineProperty(this, 'langManager', {
      enumerable: false, // Hide the property to avoid too verbose logs while printing the arg
      value: langManager,
    });
    this.timeType = TimeTypes.distance;
    this.definitions = [];
  }

  /**
   * Represents a distance type of the argument.
   * The distance type argument is defined by how much time should pass since the current moment
   * until the moment when the target action should be performed.
   * @type {string}
   */
  static get DISTANCE_TYPE() {
    return TimeTypes.distance;
  }

  /**
   * Represents a one-shot schedule type of the argument.
   * The one-shot type argument is defined by when the target action should be performed according to the calendar.
   * @type {string}
   */
  static get SCHEDULE_TYPE() {
    return TimeTypes.schedule;
  }

  /**
   * Represents a recurrent schedule type of the argument.
   * The recurrent type argument is defined by when the target action should be performed according to the calendar
   * and when it should be repeated (e.g. every Monday at 9:00, every 1st day of a month etc.)
   * @type {string}
   */
  static get SCHEDULE_REPEAT_TYPE() {
    return TimeTypes.scheduleRepeat;
  }

  /**
   * Gets the array of shift (definition) types, for example, seconds, minutes, years, days of week, timezones etc.
   * @type {Object}
   */
  static get SHIFT_TYPES() {
    return ShiftTypes;
  }

  /**
   * Gets the array of objects defining recurrence parameters for shift types.
   * E.g. what is the min and max year, what is the step between years to be made during rescheduling etc.
   * @type {Object}
   */
  static get RECURRENCE_SHIFTS() {
    return RecurrenceShifts;
  }

  /**
   * Gets the shift types which should not be considering when converting an argument of "distance" type
   * into a one-shot schedule.
   * @type {Array<string>}
   */
  static get SKIP_FOR_DISTANCE_TO_SCHEDULE_CONVERSION() {
    return [ShiftTypes.predefined, ShiftTypes.weeks, ShiftTypes.timezone, ShiftTypes.dayofweek];
  }

  /**
   * Gets a set of functions to work with Javascript's Date objects depending on the definition type.
   * For example, if we work with minutes, what function we should invoke to set the minutes of the Date object?
   * @type {Object}
   */
  static get DEFINITION_FUNCTIONS() {
    if (this.DefinitionFunctions === undefined) {
      // Keep the keys intact with ShiftTypes
      this.DefinitionFunctions = Object.freeze({
        years: { setFunc: this.setFullYear, getFunc: this.getFullYear },
        months: { setFunc: this.setMonth, getFunc: this.getMonth },
        days: { setFunc: this.setDate, getFunc: this.getDate },
        hours: { setFunc: this.setHours, getFunc: this.getHours },
        minutes: { setFunc: this.setMinutes, getFunc: this.getMinutes },
        seconds: { setFunc: this.setSeconds, getFunc: this.getSeconds },
        milliseconds: { setFunc: this.setMilliseconds, getFunc: this.getMilliseconds },
      });
    }

    return this.DefinitionFunctions;
  }

  /**
   * Gets a set of text id representing the localized names of week days.
   * @type {Object}
   */
  static get DAY_OF_WEEK_NAMES() {
    return DayOfWeekNames;
  }

  /**
   * Gets of total shift amount in milliseconds for a time distance arg.
   * @return {number} the total shift in milliseconds
   */
  get totalMillisecondsShift() {
    if (this.timeType !== TimeTypes.distance) {
      return null;
    }

    let totalShift = 0;

    for (let i = 0; i < this.definitions.length; i++) {
      let multiplier = 0;
      switch (this.definitions[i].shiftType) {
        case ShiftTypes.predefined:
          multiplier = 1;
          break;
        case ShiftTypes.years:
          multiplier = 365 * 24 * 60 * 60 * 1000;
          break;
        case ShiftTypes.months:
          multiplier = 30 * 24 * 60 * 60 * 1000;
          break;
        case ShiftTypes.weeks:
          multiplier = 7 * 24 * 60 * 60 * 1000;
          break;
        case ShiftTypes.days:
          multiplier = 24 * 60 * 60 * 1000;
          break;
        case ShiftTypes.hours:
          multiplier = 60 * 60 * 1000;
          break;
        case ShiftTypes.minutes:
          multiplier = 60 * 1000;
          break;
        case ShiftTypes.seconds:
          multiplier = 1000;
          break;
        default:
          break;
      }

      totalShift += this.definitions[i].amount * multiplier;
    }

    return totalShift;
  }

  /**
   * Checks if a given text determines a time type.
   * @param  {string}  text the text to parse
   * @return {Boolean}      true if the text is a valid time type definition, false otherwise
   */
  isValidTimeType(text) {
    return this.parseTimeType(text) !== null;
  }

  /**
   * Tries to parse a time time from a given text.
   * @param  {string}          text the text to parse
   * @return {(string | null)}      the type if successful, null otherwise
   */
  parseTimeType(text) {
    if (text === this.langManager.getString('arg_time_point_type')) {
      return TimeTypes.distance;
    }

    if (text === this.langManager.getString('arg_time_schedule_type')) {
      return TimeTypes.schedule;
    }

    if (text === this.langManager.getString('arg_time_schedule_repeat_type')) {
      return TimeTypes.scheduleRepeat;
    }

    return null;
  }

  /**
   * Sets the time type to the argument (validation of the time should be performed separately).
   * @param {string} timeType the time type
   */
  setTimeType(timeType) {
    this.timeType = timeType;
  }

  /**
   * Checks if a given text determines a time definition which can be appended to this arg.
   * Two definitions of the same type are not allowed in the same arg.
   * Some other restriction also apply (for example, cannot set months if dayofweek is set).
   * @param  {string}  text the text to be parsed
   * @return {Boolean}      true if a valid definition and can be appended
   */
  isValidTimeDef(text) {
    const parsedDefs = this.parseTimeDefinitions(text);
    if (parsedDefs === null) {
      return false;
    }

    const totalDefs = this.definitions.concat(parsedDefs);

    for (let i = 0; i < totalDefs.length; i++) {
      if (totalDefs[i].shiftType === ShiftTypes.predefined && totalDefs.length > 1) {
        return false;
      }
    }

    let foundDaysOrGreater = false;
    let foundDayOfWeek = false;
    for (let i = 0; i < totalDefs.length; i++) {
      // Definitions greater than hours are not allowed in the same arg as dayofweek.
      if (
        totalDefs[i].shiftType === ShiftTypes.days ||
        totalDefs[i].shiftType === ShiftTypes.weeks ||
        totalDefs[i].shiftType === ShiftTypes.months ||
        totalDefs[i].shiftType === ShiftTypes.years
      ) {
        foundDaysOrGreater = true;
        if (foundDayOfWeek) {
          return false;
        }
      } else if (totalDefs[i].shiftType === ShiftTypes.dayofweek) {
        foundDayOfWeek = true;
        if (foundDaysOrGreater) {
          return false;
        }
      }

      for (let j = 0; j < totalDefs.length; j++) {
        if (i === j) {
          continue;
        }

        if (totalDefs[i].shiftType === totalDefs[j].shiftType) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Parses a time definition and adds it to the current arg.
   * The validity od such addition should be checked separately.
   * @see TimeArg#isValidTimeDef
   * @param {string} text the text containing definitions
   */
  addDefinition(text) {
    const parsedDefs = this.parseTimeDefinitions(text);

    for (const def of parsedDefs) {
      this.addParsedDefinition(def);
    }
  }

  /**
   * Adds an already parsed definition to the current argument.
   * @param {Object} parsedDefinition the parsed definition, containing the shift time and shift amount
   */
  addParsedDefinition(parsedDefinition) {
    this.definitions.push(parsedDefinition);
  }

  /**
   * Parses time definitions for a given text. For example, 20 minutes, 10 seconds, 1 year etc.
   * @param  {string}        text text to parse
   * @return {Array<Object>}      the array of parsed definitions, each containing the shift time and shift amount
   */
  parseTimeDefinitions(text) {
    // Firstly check predefined definitions.
    if (text === this.langManager.getString(TimeArgPredefinedValues.today)) {
      const currentDate = new Date();
      const inDayTimeTimestamp =
        ((currentDate.getHours() * 60 + currentDate.getMinutes()) * 60 + currentDate.getSeconds()) * 1000;
      return [{ amount: inDayTimeTimestamp, shiftType: ShiftTypes.predefined }];
    }

    if (text === this.langManager.getString(TimeArgPredefinedValues.all)) {
      const currentDate = new Date();
      return [{ amount: currentDate.getTime(), shiftType: ShiftTypes.predefined }];
    }

    // Some definition types apply only for certain time type (distance, one-shot schedule, recurrent schedule)
    if (this.timeType !== TimeTypes.distance) {
      const year = this.tryParseYearDefinition(text);
      if (year !== null) {
        return year;
      }

      const month = this.tryParseMonthDefinition(text);
      if (month !== null) {
        return month;
      }

      const day = this.tryParseDayDefinition(text);
      if (day !== null) {
        return day;
      }

      const timezone = this.tryParseTimezoneDefinition(text);
      if (timezone !== null) {
        return timezone;
      }

      const dayOfWeek = this.tryParseDayOfWeekDefinition(text);
      if (dayOfWeek !== null) {
        return dayOfWeek;
      }
    }

    const hoursMinutesSeconds = this.tryParseHoursMinutesSecondsDefinition(text);
    if (hoursMinutesSeconds !== null) {
      return hoursMinutesSeconds;
    }

    // Finally, try to parse at least definition in the form of time distance, like "3h 10m 20s"
    return this.tryParseDistance(text);
  }

  /**
   * Automatically defines the shift types which were not previously defined. Not applicable for time distances.
   * For schedules - finds the smallest defined shift type (e.g. hours) and sets all smaller
   * shift types to the min value (typically zeroes), so "3 hours" is converted to "3 hours, 0 monutes, 0 seconds".
   * The greater shift types (for example, days, months, years) are set to "any" value for recurrent schedules
   * (e.g. "any year, any month, any day, 3 hours, 0 minutes, 0 seconds")
   * or the the current time for one-shot schedule
   * (for example, "2020 year, May, 30 day, 3 hours, 0 minutes, 0 seconds")
   */
  autoCompleteDefinitions() {
    if (
      this.timeType === TimeTypes.distance ||
      this.definitions.length === 0 ||
      (this.definitions.length === 1 && this.definitions[0].shiftType === ShiftTypes.predefined)
    ) {
      return;
    }

    const shiftsArray = Object.keys(ShiftTypes);
    let smallestDefinedShift = -1;
    for (const [i, element] of shiftsArray.entries()) {
      if (this.constructor.SKIP_FOR_DISTANCE_TO_SCHEDULE_CONVERSION.includes(ShiftTypes[element])) {
        continue;
      }

      for (let j = 0; j < this.definitions.length; j++) {
        if (this.definitions[j].shiftType === ShiftTypes[element]) {
          smallestDefinedShift = i;
          break;
        }
      }
    }

    if (smallestDefinedShift === -1) {
      return;
    }

    const currentTime = new Date();

    for (const [i, element] of shiftsArray.entries()) {
      if (this.constructor.SKIP_FOR_DISTANCE_TO_SCHEDULE_CONVERSION.includes(ShiftTypes[element])) {
        continue;
      }

      let shiftFound = false;
      for (let j = 0; j < this.definitions.length; j++) {
        if (this.definitions[j].shiftType === ShiftTypes[element]) {
          shiftFound = true;
          break;
        }
      }

      if (!shiftFound) {
        if (i > smallestDefinedShift) {
          if (this.timeType === TimeTypes.scheduleRepeat) {
            this.definitions.push({ amount: Number.parseInt(OhUtils.ANY_VALUE, 10), shiftType: ShiftTypes[element] });
          } else {
            this.definitions.push({
              amount: this.constructor.DEFINITION_FUNCTIONS[element].getFunc(currentTime),
              shiftType: ShiftTypes[element],
            });
          }
        } else {
          this.definitions.push({
            amount: RecurrenceShifts[element] === undefined ? 0 : RecurrenceShifts[element].minValue,
            shiftType: ShiftTypes[element],
          });
        }
      }
    }
  }

  /**
   * Create a new TimeArg of one-shot schedult type based on this distance-type argument.
   * @return {TimeArg} the new time argument of the one-shot schedule type
   */
  convertDistanceToSchedule() {
    if (this.timeType !== TimeTypes.distance) {
      return this;
    }

    const currentTime = new Date();
    const scheduledTimeMills = currentTime.getTime() + this.totalMillisecondsShift;
    const scheduledTime = new Date(scheduledTimeMills);

    const scheduleArg = new TimeArg(this.langManager);
    scheduleArg.setTimeType(TimeTypes.schedule);
    scheduleArg.addParsedDefinition({ amount: scheduledTime.getFullYear(), shiftType: ShiftTypes.years });
    scheduleArg.addParsedDefinition({ amount: scheduledTime.getMonth(), shiftType: ShiftTypes.months });
    scheduleArg.addParsedDefinition({ amount: scheduledTime.getDate(), shiftType: ShiftTypes.days });
    scheduleArg.addParsedDefinition({ amount: scheduledTime.getHours(), shiftType: ShiftTypes.hours });
    scheduleArg.addParsedDefinition({ amount: scheduledTime.getMinutes(), shiftType: ShiftTypes.minutes });
    scheduleArg.addParsedDefinition({ amount: scheduledTime.getSeconds(), shiftType: ShiftTypes.seconds });
    scheduleArg.addParsedDefinition({ amount: scheduledTime.getMilliseconds(), shiftType: ShiftTypes.milliseconds });

    return scheduleArg;
  }

  /**
   * Tries to parse a distance time definition from text.
   * @param  {string}          text the text to parse
   * @return {(Array | null)}       array of objects containing the shift type and amount, or null if unsuccessful
   */
  tryParseDistance(text) {
    if (text.length < 2) {
      return null;
    }

    const shiftAmount = text.slice(0, Math.max(0, text.length - 1));
    // False positive of ESLint: Number.isNaN cannot recognize arbitrary text (e.g. "test") as NaN. So use direct isNaN.
    /* eslint-disable unicorn/prefer-number-properties */
    if (isNaN(shiftAmount) || Number.parseInt(shiftAmount, 10) <= 0) {
      return null;
    }
    /* eslint-enable unicorn/prefer-number-properties */

    const unit = text[text.length - 1];
    let shiftType = ShiftTypes.milliseconds;
    switch (unit) {
      case this.langManager.getString(TimeArgUnits.year):
        shiftType = ShiftTypes.years;
        break;
      case this.langManager.getString(TimeArgUnits.month):
        shiftType = ShiftTypes.months;
        break;
      case this.langManager.getString(TimeArgUnits.week):
        shiftType = ShiftTypes.weeks;
        break;
      case this.langManager.getString(TimeArgUnits.day):
        shiftType = ShiftTypes.days;
        break;
      case this.langManager.getString(TimeArgUnits.hour):
        shiftType = ShiftTypes.hours;
        break;
      case this.langManager.getString(TimeArgUnits.minute):
        shiftType = ShiftTypes.minutes;
        break;
      case this.langManager.getString(TimeArgUnits.second):
        shiftType = ShiftTypes.seconds;
        break;
      default:
        return null;
    }

    return [{ amount: Number.parseInt(shiftAmount, 10), shiftType }];
  }

  /**
   * Tries to parse a year definition from text.
   * @param  {string}          text the text to parse
   * @return {(Array | null)}       array of objects containing the shift type and amount, or null if unsuccessful
   */
  tryParseYearDefinition(text) {
    // False positive of ESLint: Number.isNaN cannot recognize arbitrary text (e.g. "test") as NaN. So use direct isNaN.
    /* eslint-disable unicorn/prefer-number-properties */
    if (
      isNaN(text) ||
      Number.parseInt(text, 10) < RecurrenceShifts.years.minValue ||
      Number.parseInt(text, 10) > RecurrenceShifts.years.maxValue
    ) {
      return null;
    }
    /* eslint-enable unicorn/prefer-number-properties */

    return [{ amount: Number.parseInt(text, 10), shiftType: ShiftTypes.years }];
  }

  /**
   * Tries to parse a month definition from text.
   * @param  {string}          text the text to parse
   * @return {(Array | null)}      array of objects containing the shift type and amount, or null if unsuccessful
   */
  tryParseMonthDefinition(text) {
    const monthKeys = Object.keys(MonthNames);
    for (const [i, element] of monthKeys.entries()) {
      if (
        text.localeCompare(this.langManager.getString(MonthNames[element].short), undefined, {
          sensitivity: 'accent',
        }) === 0 ||
        text.localeCompare(this.langManager.getString(MonthNames[element].full), undefined, {
          sensitivity: 'accent',
        }) === 0
      ) {
        return [{ amount: i, shiftType: ShiftTypes.months }];
      }
    }

    return null;
  }

  /**
   * Tries to parse a day of month definition from text.
   * @param  {string}          text the text to parse
   * @return {(Array | null)}       array of objects containing the shift type and amount, or null if unsuccessful
   */
  tryParseDayDefinition(text) {
    // False positive of ESLint: Number.isNaN cannot recognize arbitrary text (e.g. "test") as NaN. So use direct isNaN.
    /* eslint-disable unicorn/prefer-number-properties */
    if (
      isNaN(text) ||
      Number.parseInt(text, 10) < RecurrenceShifts.days.minValue ||
      Number.parseInt(text, 10) > RecurrenceShifts.days.maxValue
    ) {
      return null;
    }
    /* eslint-enable unicorn/prefer-number-properties */

    return [{ amount: Number.parseInt(text, 10), shiftType: ShiftTypes.days }];
  }

  /**
   * Tries to parse a hours:minutes:seconds definition from text. The text is expected to be like "14:45:00".
   * "Any" value is supported in place of every part.
   * @param  {string}          text the text to parse
   * @return {(Array | null)}       array of objects containing the shift type and amount, or null if unsuccessful
   */
  tryParseHoursMinutesSecondsDefinition(text) {
    const colonIndex = text.indexOf(HourMinuteSecondSeparator);
    if (colonIndex === -1) {
      return null;
    }

    const definitionsArray = [];
    const hoursPart = text.slice(0, Math.max(0, colonIndex));
    // False positive of ESLint: Number.isNaN cannot recognize arbitrary text (e.g. "test") as NaN. So use direct isNaN.
    /* eslint-disable unicorn/prefer-number-properties */
    if (
      AnyValueUi !== hoursPart &&
      (isNaN(hoursPart) ||
        Number.parseInt(hoursPart, 10) < RecurrenceShifts.hours.minValue ||
        Number.parseInt(hoursPart, 10) > RecurrenceShifts.hours.maxValue)
    ) {
      return null;
    }

    let hoursValue;
    if (AnyValueUi === hoursPart) {
      hoursValue = AnyValueInt;
    } else {
      hoursValue = Number.parseInt(hoursPart, 10);
    }

    definitionsArray.push({ amount: hoursValue, shiftType: ShiftTypes.hours });

    const restPart = text.slice(Math.max(0, colonIndex + 1));
    const nextColonIndex = restPart.indexOf(HourMinuteSecondSeparator);
    if (nextColonIndex === -1) {
      if (
        AnyValueUi !== restPart &&
        (isNaN(restPart) ||
          Number.parseInt(restPart, 10) < RecurrenceShifts.minutes.minValue ||
          Number.parseInt(restPart, 10) > RecurrenceShifts.minutes.maxValue)
      ) {
        return null;
      }

      let minutesValue;
      if (AnyValueUi === restPart) {
        minutesValue = AnyValueInt;
      } else {
        minutesValue = Number.parseInt(restPart, 10);
      }

      definitionsArray.push({ amount: minutesValue, shiftType: ShiftTypes.minutes });
    } else {
      const minutesPart = restPart.slice(0, Math.max(0, nextColonIndex));
      if (
        AnyValueUi !== minutesPart &&
        (isNaN(minutesPart) ||
          Number.parseInt(minutesPart, 10) < RecurrenceShifts.minutes.minValue ||
          Number.parseInt(minutesPart, 10) > RecurrenceShifts.minutes.maxValue)
      ) {
        return null;
      }

      let minutesValue;
      if (AnyValueUi === minutesPart) {
        minutesValue = AnyValueInt;
      } else {
        minutesValue = Number.parseInt(minutesPart, 10);
      }

      definitionsArray.push({ amount: minutesValue, shiftType: ShiftTypes.minutes });

      const secondsPart = restPart.slice(Math.max(0, nextColonIndex + 1));
      if (
        AnyValueUi !== secondsPart &&
        (isNaN(secondsPart) ||
          Number.parseInt(secondsPart, 10) < RecurrenceShifts.seconds.minValue ||
          Number.parseInt(secondsPart, 10) > RecurrenceShifts.seconds.maxValue)
      ) {
        return null;
      }

      let secondsValue;
      if (AnyValueUi === secondsPart) {
        secondsValue = AnyValueInt;
      } else {
        secondsValue = Number.parseInt(secondsPart, 10);
      }

      definitionsArray.push({ amount: secondsValue, shiftType: ShiftTypes.seconds });
    }
    /* eslint-enable unicorn/prefer-number-properties */

    return definitionsArray;
  }

  /**
   * Tries to parse a timezone definition from text.
   * @param  {string}          text the text to parse
   * @return {(Array | null)}       array of objects containing the shift type and amount, or null if unsuccessful
   */
  tryParseTimezoneDefinition(text) {
    if (momentTz.tz.names().includes(text)) {
      return [{ amount: text, shiftType: ShiftTypes.timezone }];
    }

    return null;
  }

  /**
   * Tries to parse a day of week definition from text.
   * @param  {string}          text the text to parse
   * @return {(Array | null)}       array of objects containing the shift type and amount, or null if unsuccessful
   */
  tryParseDayOfWeekDefinition(text) {
    const dayOfWeekKeys = Object.keys(DayOfWeekNames);
    for (const [i, element] of dayOfWeekKeys.entries()) {
      if (
        text.localeCompare(this.langManager.getString(DayOfWeekNames[element].short), undefined, {
          sensitivity: 'accent',
        }) === 0 ||
        text.localeCompare(this.langManager.getString(DayOfWeekNames[element].full), undefined, {
          sensitivity: 'accent',
        }) === 0
      ) {
        return [{ amount: i, shiftType: ShiftTypes.dayofweek }];
      }
    }

    return null;
  }

  /**
   * Sets the full year to a given Date object.
   * @param {Date}   time  the JS Date object
   * @param {number} value the year
   */
  static setFullYear(time, value) {
    time.setFullYear(value);
  }

  /**
   * Sets the month to a given Date object.
   * @param {Date}   time  the JS Date object
   * @param {number} value the month (0 to 11)
   */
  static setMonth(time, value) {
    time.setMonth(value);
  }

  /**
   * Sets the day of month to a given Date object.
   * @param {Date}   time  the JS Date object
   * @param {number} value the day of month
   */
  static setDate(time, value) {
    time.setDate(value);
  }

  /**
   * Sets the hour to a given Date object.
   * @param {Date}   time  the JS Date object
   * @param {number} value the hours amount
   */
  static setHours(time, value) {
    time.setHours(value);
  }

  /**
   * Sets the minute to a given Date object.
   * @param {Date}   time  the JS Date object
   * @param {number} value the minutes amount
   */
  static setMinutes(time, value) {
    time.setMinutes(value);
  }

  /**
   * Sets the second to a given Date object.
   * @param {Date}   time  the JS Date object
   * @param {number} value the seconds amount
   */
  static setSeconds(time, value) {
    time.setSeconds(value);
  }

  /**
   * Sets the millisecond to a given Date object.
   * @param {Date}   time  the JS Date object
   * @param {number} value the milliseconds amount
   */
  static setMilliseconds(time, value) {
    time.setMilliseconds(value);
  }

  /**
   * Gets the full year from a given Date object.
   * @param  {Date}   time the JS Date object
   * @return {number}      the Date's year
   */
  static getFullYear(time) {
    return time.getFullYear();
  }

  /**
   * Gets the month from a given Date object.
   * @param  {Date}   time the JS Date object
   * @return {number}      the Date's month
   */
  static getMonth(time) {
    return time.getMonth();
  }

  /**
   * Gets the day of month from a given Date object.
   * @param  {Date}   time the JS Date object
   * @return {number}      the Date's day of month
   */
  static getDate(time) {
    return time.getDate();
  }

  /**
   * Gets the hour from a given Date object.
   * @param  {Date}   time the JS Date object
   * @return {number}      the Date'shour
   */
  static getHours(time) {
    return time.getHours();
  }

  /**
   * Gets the minute from a given Date object.
   * @param  {Date}   time the JS Date object
   * @return {number}      the Date's minute
   */
  static getMinutes(time) {
    return time.getMinutes();
  }

  /**
   * Gets the second from a given Date object.
   * @param  {Date}   time the JS Date object
   * @return {number}      the Date's second
   */
  static getSeconds(time) {
    return time.getSeconds();
  }

  /**
   * Gets the millisecond from a given Date object.
   * @param  {Date}   time the JS Date object
   * @return {number}      the Date's millisecond
   */
  static getMilliseconds(time) {
    return time.getMilliseconds();
  }

  /**
   * Checks if any of given definition implies recurrence (that is, contains the "any" value).
   * @param  {Array<Object>}  definitions the array of time definitions
   * @return {Boolean}                    true if the definitions imply reccurence, false otherwise
   */
  static isRecurringDefinitions(definitions) {
    for (const definition of definitions) {
      if (definition.amount === AnyValueInt) {
        return true;
      }
    }

    return false;
  }

  /**
   * Converts given time definitions to human readable string using the language manager.
   * We cannot just reuse built-in toString converters of Date objects, because we may have some
   * "undefined" or "any" definitions. For example, we need to describe a recurring schedule which
   * will trigger an action each Sunday on 13:00 New-York time.
   * But apart from that, this function does similar thing to the standard Date's toString converters.
   * @param  {Array<Object>} definitions the array of time definitions (shift type and shift amounts)
   * @param  {LangManager}   langManager the language manager to localize the output
   * @return {string}                    the result string
   */
  static toString(definitions, langManager) {
    if (definitions === undefined || definitions === null || !Array.isArray(definitions)) {
      return '';
    }

    let years = null;
    let months = null;
    let days = null;
    let dayofweek = null;
    let timezone = null;
    let hours = null;
    let minutes = null;
    let seconds = null;
    for (const definition of definitions) {
      switch (definition.shiftType) {
        case ShiftTypes.predefined:
          return new Date(definition.amount).toString();
        case ShiftTypes.years:
          years = definition.amount;
          break;
        case ShiftTypes.months:
          months = definition.amount;
          break;
        case ShiftTypes.days:
          days = definition.amount;
          break;
        case ShiftTypes.dayofweek:
          dayofweek = definition.amount;
          break;
        case ShiftTypes.timezone:
          timezone = definition.amount;
          break;
        case ShiftTypes.hours:
          hours = definition.amount;
          break;
        case ShiftTypes.minutes:
          minutes = definition.amount;
          break;
        case ShiftTypes.seconds:
          seconds = definition.amount;
          break;
        default:
          break;
      }
    }

    let result = '';
    if (dayofweek === null) {
      if (years !== null) {
        if (years === AnyValueInt) {
          result += AnyValueUi + ' ';
        } else {
          result += years + ' ';
        }
      }

      if (months !== null) {
        if (months === AnyValueInt) {
          result += AnyValueUi + ' ';
        } else {
          result += langManager.getString(MonthNames[Object.keys(MonthNames)[months]].full) + ' ';
        }
      }

      if (days !== null) {
        if (days === AnyValueInt) {
          result += AnyValueUi + ' ';
        } else {
          result += days + ' ';
        }
      }
    }

    if (dayofweek !== null) {
      if (dayofweek === AnyValueInt) {
        result += AnyValueUi + ' ';
      } else {
        result += langManager.getString(DayOfWeekNames[Object.keys(DayOfWeekNames)[dayofweek]].full) + ' ';
      }
    }

    if (hours !== null) {
      if (hours === AnyValueInt) {
        result += AnyValueUi + ':';
      } else {
        result += hours.toString().padStart(2, '0') + ':';
      }
    }

    if (minutes !== null) {
      if (minutes === AnyValueInt) {
        result += AnyValueUi + ':';
      } else {
        result += minutes.toString().padStart(2, '0') + ':';
      }
    }

    if (seconds !== null) {
      if (seconds === AnyValueInt) {
        result += AnyValueUi + ' ';
      } else {
        result += seconds.toString().padStart(2, '0') + ' ';
      }
    }

    if (timezone !== null) {
      result += timezone + ' ';
    }

    if (result.endsWith(' ')) {
      result = result.slice(0, Math.max(0, result.length - 1));
    }

    return result;
  }

  /**
   * Converts the time arg to string.
   * @see TimeArg.toString
   * @return {string} the result string
   */
  toString() {
    return TimeArg.toString(this.definitions, this.langManager);
  }
}

/**
 * Exports the TimeArg class
 * @type {TimeArg}
 */
module.exports = TimeArg;
