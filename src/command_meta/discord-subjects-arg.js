'use strict';

/**
 * @module discord-subjects-arg
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
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
    const guild = context.discordClient.guilds.cache.get(orgId);
    if (guild === undefined) {
      return true;
    }

    let areMembersNotOk = false;
    if (this.subjectIds.length > 0) {
      const collection = await guild.members.fetch();

      const filteredEntities = collection.filter(entity => this.subjectIds.includes(entity.id));

      areMembersNotOk = filteredEntities.size !== this.subjectIds.length;
    }

    let areRolesNotOk = false;
    if (this.subjectRoles.length > 0) {
      const fetchedManager = await guild.roles.fetch();
      const collection = fetchedManager.cache;

      const filteredEntities = collection.filter(entity => this.subjectRoles.includes(entity.id));

      areRolesNotOk = filteredEntities.size !== this.subjectRoles.length;
    }

    return areMembersNotOk || areRolesNotOk;
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
