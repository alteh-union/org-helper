'use strict';

/**
 * @module discord-subjects-arg
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE.md file for details)
 */

/**
  * Command's argument object representing an array of Discord subjects ids (users or roles).
  * @alias DiscordSubjectsArg
  */
class DiscordSubjectsArg {
  /**
   * Constructs an instance of the class
   * @param {Array<string>} subjectIds   the array of subjects identifiers
   * @param {Array<string>} subjectRoles the array of roles indentifiers
   */
  constructor(subjectIds, subjectRoles) {
    this.subjectIds = Array.from(new Set(subjectIds));
    this.subjectRoles = Array.from(new Set(subjectRoles));
  }

  /**
   * Validates that all given subjects (members and roles) are existing for the organization.
   * @param  {Context}  context the Bot's context
   * @param  {string}   orgId   the organization identifier
   * @return {Promise}          true if the validation passed
   */
  async validateDiscordSubjectsArg(context, orgId) {
    const areMembersNotOk = await this.validateDiscordSubjectTypeArg(context, this.subjectIds,
      context.dbManager.membersTable, orgId);
    const areRolesNotOk = await this.validateDiscordSubjectTypeArg(context, this.subjectRoles,
      context.dbManager.rolesTable, orgId);
    return areMembersNotOk || areRolesNotOk;
  }

  /**
   * Validates that all given subjects (members or roles) are existing in a DB table for the organization.
   * @param  {Context}        context         the Bot's context
   * @param  {Array<string>}  argTypeSubjects the array of subject identifiers (members or roles)
   * @param  {BotTable}       table           the DB table to check the subject existence
   * @param  {string}         orgId           the organization identifier
   * @return {Promise}                        true if the validation passed
   */
  async validateDiscordSubjectTypeArg(context, argTypeSubjects, table, orgId) {
    if (argTypeSubjects.length === 0) {
      return false;
    }

    const orArray = [];
    for (const subject of argTypeSubjects) {
      orArray.push({id: subject});
    }

    const query = {$or: orArray};
    const subjectsRows = await context.dbManager.getDiscordRows(table, orgId, query);

    return subjectsRows.length !== argTypeSubjects.length;
  }

  /**
   * Checks if the argument has no subjects in it
   * @return {Boolean} true if the argument has no subjects
   */
  isEmpty() {
    return this.subjectIds.length === 0 && this.subjectRoles.length === 0;
  }

  /**
   * Converts the ids array to string (firsly members, then roles).
   * @return {string} the result string
   */
  toString() {
    return this.subjectIds.join(', ') + ', ' + this.subjectRoles.join(', ');
  }
}

/**
 * Exports the DiscordSubjectsArg class
 * @type {DiscordSubjectsArg}
 */
module.exports = DiscordSubjectsArg;
