'use strict';

/**
 * @module scheduler
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const momentTz = require('moment-timezone');
const util = require('util');

const OhUtils = require('../utils/bot-utils');
const DiscordUtils = require('../utils/discord-utils');

const TimeArg = require('../command_meta/time-arg');

const OrgTask = require('../mongo_classes/org-task');

const MaxIntervalSafetyGap = 10000;

/**
 * Manages scheduled tasks (schedules, executes, cancels etc.).
 * Uses OrgTask instances from the DB with some appended util info.
 * @see OrgTask
 * @see TimeArg
 * @alias Scheduler
 */
class Scheduler {
  /**
   * Constructs an instance of the class
   * @param {Context} context the Bot's context
   */
  constructor(context) {
    this.context = context;

    this.tasks = [];
  }

  /**
   * Updates tasks in RAM according the their DB counterparts. Schedules the new tasks, reschedule updated
   * tasks, cancels deleted tasks.
   * @return {Promise} nothing
   */
  async syncTasks() {
    const dbTasks = await this.context.dbManager.getRows(this.context.dbManager.tasksTable);

    const foundIndices = [];

    for (let i = dbTasks.length - 1; i >= 0; i--) {
      let found = false;
      for (let j = 0; j < this.tasks.length; j++) {
        if (dbTasks[i].equalsByKey(this.tasks[j])) {
          found = true;
          foundIndices.push(j);
          const valuesToUpdate = dbTasks[i].getValuesToUpdate(this.tasks[j]);

          const fieldsToUpdate = Object.keys(valuesToUpdate);
          if (fieldsToUpdate.length > 0) {
            for (const field of fieldsToUpdate) {
              this.tasks[j][field] = dbTasks[i][field];
            }

            this.context.log.i(
              'Scheduler syncTasks: dbTasks[i]: ' +
                dbTasks[i].id +
                '; updated, new values: ' +
                util.inspect(fieldsToUpdate, { showHidden: true, depth: 6 })
            );
            clearTimeout(this.tasks[j].timeoutHandle);
            await this.scheduleTask(this.tasks[j]);
          }

          break;
        }
      }

      if (!found) {
        this.context.log.i('Scheduler syncTasks: dbTasks[i]: ' + dbTasks[i].id + '; new task detected, adding.');
        this.tasks.push(dbTasks[i]);
        foundIndices.push(this.tasks.length - 1);
        await this.scheduleTask(dbTasks[i]);
      }
    }

    const toDelete = this.tasks.filter((value, index) => {
      return !foundIndices.includes(index);
    });

    this.context.log.d('Scheduler syncTasks: toDelete: ' + util.inspect(toDelete, { showHidden: true, depth: 3 }));
    if (!OhUtils.isEmpty(toDelete)) {
      for (const element of toDelete) {
        for (let j = this.tasks.length - 1; j >= 0; j--) {
          if (element.equalsByKey(this.tasks[j])) {
            this.context.log.i(
              'Scheduler syncTasks: this.tasks[j].id: ' + this.tasks[j].id + ' was removed from DB, cancelling.'
            );
            clearTimeout(this.tasks[j].timeoutHandle);
            this.tasks.splice(j, 1);
          }
        }
      }
    }
  }

  /**
   * Schedules a task using setTimeout/cancelTimeout API. If the task is one-shot and scheduled in the past,
   * then removes it. If the task is recurrent - schedules it at the nearest appropriate time.
   * If scheduled too far in the future, schedules a reschedulement at the max interval
   * acceptable by the setTimeout funcction (minus some safety gap to avoid jumping over the scheduled timeout
   * due to CPU busy with other tasks).
   * @param  {OrgTask} task the task to be scheduled
   * @return {Promise}      nothing
   */
  async scheduleTask(task) {
    this.context.log.i('Scheduler scheduleTask: ' + util.inspect(task, { showHidden: true, depth: 6 }));
    let timeDiff = this.getNextExecutionTimeDiff(task);

    if (timeDiff > 0) {
      this.context.log.i('Scheduler scheduleTask: task.id: ' + task.id + '; timeDiff: ' + timeDiff);
      const taskArgument = { task, scheduler: this };
      if (timeDiff >= OhUtils.MAX_TIMEOUT - MaxIntervalSafetyGap) {
        this.context.log.i(
          'Scheduler scheduleTask: task.id: ' +
            task.id +
            '; timeDiff: ' +
            timeDiff +
            '; timeDiff overflow. Postponing the schedule.'
        );
        taskArgument.reschedule = true;
        timeDiff = OhUtils.MAX_TIMEOUT - MaxIntervalSafetyGap;
      }

      task.timeoutHandle = setTimeout(
        taskArg => {
          if (taskArg.reschedule === true) {
            taskArg.scheduler.scheduleTask(taskArg.task);
          } else {
            taskArg.scheduler.executeTask(taskArg.task);
          }
        },
        timeDiff,
        taskArgument
      );
    } else {
      this.context.log.i(
        'Scheduler scheduleTask: task.id: ' + task.id + '; timeDiff: ' + timeDiff + '; scheduled in the past, removing.'
      );

      await this.deleteTask(task);
    }
  }

  /**
   * Executes the task based on its type. Rechedules recurrent tasks on completion or deletes one-shot tasks.
   * @param  {OrgTask}  task the task to execute
   * @return {Promise}       nothing
   */
  async executeTask(task) {
    this.context.log.i('Scheduler executeTask: ' + util.inspect(task, { showHidden: true, depth: 6 }));
    switch (task.type) {
      case OrgTask.TASK_TYPES.reminder:
        await this.remind(task);
        break;
      default:
        break;
    }

    if (TimeArg.isRecurringDefinitions(task.time.definitions)) {
      this.scheduleTask(task);
    } else {
      this.deleteTask(task);
    }
  }

  /**
   * Deletes the task from DB which is no longer needed.
   * @param  {OrgTask}  task the task to delete
   * @return {Promise}       nothing
   */
  async deleteTask(task) {
    for (let i = 0; i < this.tasks.length; i++) {
      if (task.equalsByKey(this.tasks[i])) {
        this.context.log.v('Scheduler scheduleTask: task.id: ' + task.id + '; found in the list, removing.');
        this.tasks.splice(i, 1);
        const deleteQuery = { id: task.id };
        await this.context.dbManager.deleteDiscordRows(this.context.dbManager.tasksTable, task.orgId, deleteQuery);
        break;
      }
    }
  }

  /**
   * Executes a reminder task
   * @param  {OrgTask}  task the reminder task
   * @return {Promise}       nothing
   */
  async remind(task) {
    const guild = this.context.discordClient.guilds.cache.get(task.orgId);
    if (guild !== undefined) {
      const channel = guild.channels.cache.get(task.content.channel);
      if (channel !== undefined) {
        await DiscordUtils.sendToTextChannel(channel, task.content.message);
      }
    }
  }

  /**
   * Calculates the time in milliseconds till the next execution moment for a task.
   * Considers the caller's/organization's timezone and the timezone where the Bot's server is located.
   * May cause errors if scheduled over the daylight saving dates.
   * @param  {OrgTask} task the task to be scheduled
   * @return {number}       the time difference between the next execution moment and current moment in milliseconds
   */
  getNextExecutionTimeDiff(task) {
    let currentTime = new Date();
    let proposedTime = new Date();

    const anyValueInt = Number.parseInt(OhUtils.ANY_VALUE, 10);

    const definedKeys = Object.keys(TimeArg.DEFINITION_FUNCTIONS);

    // Initialize all proposed definitions with "any" values
    const proposedDefinitions = {};
    for (const key of definedKeys) {
      proposedDefinitions[key] = anyValueInt;
    }

    const definitions = task.time.definitions;

    let dayOfWeek = null;

    // Read all definitions from OrgTask as the proposed time of execution
    for (const definition of definitions) {
      for (const key of definedKeys) {
        if (
          definition.shiftType === key &&
          definition.shiftType !== TimeArg.SHIFT_TYPES.timezone &&
          definition.amount !== anyValueInt
        ) {
          proposedDefinitions[key] = definition.amount;
        }
      }

      if (definition.shiftType === TimeArg.SHIFT_TYPES.dayofweek) {
        dayOfWeek = definition.amount;
      }
    }

    // Initialize the proposed time as the current server's time.
    // Adjust the current time according to the Bot's server timzone and
    // by the scheduled timeone.
    // E.g. if the task was scheduled in Paris (UTC+2) and the Bot's server is located in Moscow (UTC+3)
    // then need to remove 3 hours from the server time to make it UTC, and then add 2 hours to make it Paris time.
    for (const definition of definitions) {
      if (definition.shiftType === TimeArg.SHIFT_TYPES.timezone) {
        const botServerOffsetMillis = currentTime.getTimezoneOffset() * 60000;
        currentTime = new Date(currentTime.getTime() + botServerOffsetMillis);

        const currentUtcTime = currentTime.getTime();
        const targetZoneOffsetMillis = momentTz.tz.zone(definition.amount).utcOffset(currentUtcTime) * 60000;

        currentTime = new Date(currentUtcTime - targetZoneOffsetMillis);
        proposedTime = new Date(currentTime.getTime());

        break;
      }
    }

    // Shifts the current time according to scheduled propositions.
    // "Any" value defintions remain untouched - they will be tweaked later.
    const indicesWithAnyValue = [];
    for (const [i, key] of definedKeys.entries()) {
      if (key === TimeArg.SHIFT_TYPES.days && dayOfWeek !== null) {
        indicesWithAnyValue.push(i);
        continue;
      }

      if (proposedDefinitions[key] === anyValueInt) {
        indicesWithAnyValue.push(i);
        TimeArg.DEFINITION_FUNCTIONS[key].setFunc(proposedTime, TimeArg.DEFINITION_FUNCTIONS[key].getFunc(currentTime));
      } else {
        const definedValue = proposedDefinitions[key];
        TimeArg.DEFINITION_FUNCTIONS[key].setFunc(proposedTime, definedValue);
      }
    }

    // If the result scheduled moment is before the current moment and it's a current task
    // (has at least one definition with "any" value) when tries to find the next execution time
    // by making shifting forward the tweakable definitions. If the tweakable definition reaches its limit
    // (e.g. 61 seconds in minute), then tries to tweak the next tweakable definition.
    // Starts with the shifts with the smallest amount of milliseconds in it, ends with the largest shifts
    // (e.g. from milliseconds to years).
    // Does not support schedules with dayofweek definition together with definitions larger than hours.
    if (currentTime.getTime() > proposedTime.getTime() && indicesWithAnyValue.length > 0) {
      for (let i = indicesWithAnyValue.length - 1; i >= 0; i--) {
        if (definedKeys[indicesWithAnyValue[i]] === TimeArg.SHIFT_TYPES.days && dayOfWeek !== null) {
          const currentDay = proposedTime.getDay();
          let dayDistance = dayOfWeek - currentDay;
          if (dayDistance <= 0) {
            dayDistance += 7;
          }

          proposedTime.setDate(proposedTime.getDate() + dayDistance);
          break;
        }

        const recurrenceShift = TimeArg.RECURRENCE_SHIFTS[definedKeys[indicesWithAnyValue[i]]];
        const nextValue =
          TimeArg.DEFINITION_FUNCTIONS[definedKeys[indicesWithAnyValue[i]]].getFunc(proposedTime) +
          recurrenceShift.step;
        if (nextValue <= recurrenceShift.maxValue) {
          TimeArg.DEFINITION_FUNCTIONS[definedKeys[indicesWithAnyValue[i]]].setFunc(proposedTime, nextValue);
          break;
        } else {
          TimeArg.DEFINITION_FUNCTIONS[definedKeys[indicesWithAnyValue[i]]].setFunc(
            proposedTime,
            recurrenceShift.minValue
          );
          continue;
        }
      }
    }

    return proposedTime.getTime() - currentTime.getTime();
  }
}

/**
 * Exports the Scheduler class
 * @type {Scheduler}
 */
module.exports = Scheduler;
