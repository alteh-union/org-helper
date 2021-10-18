/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.dao

import androidx.lifecycle.LiveData
import androidx.room.*
import org.alteh.orghelper.data.database.Command

/**
 * A Data Access Object for working with the [Command] data class.
 */
@Dao
interface CommandDao {
    /**
     * Inserts a new instance to the DB. Deletes the previous instance firstly if it conflicts with the new one.
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(command : Command)

    /**
     * Updates an existing instance with the new values. The caller needs to make sure that the previous instance
     * already exists in the table.
     */
    @Update
    suspend fun update(command: Command)

    /**
     * Gets an instance by its primary key (consisting of [sourceKey], [accountKey], [orgKey], [moduleKey] and [idKey])
     */
    @Query("SELECT * FROM Command WHERE source = :sourceKey AND accountId = :accountKey AND orgId = :orgKey AND moduleId = :moduleKey AND id = :idKey")
    fun get(sourceKey: String, accountKey: String, orgKey: String, moduleKey: String, idKey: String): Command?

    /**
     * Gets all instances related to specific account ([accountKey]) in the specific source
     * platform ([sourceKey]), the specific org ([orgKey]) and the specific module ([moduleKey]).
     * Mostly needed to understand what instances are unused and should be deleted during the bulk update
     * operation after fetching the latest values from the server.
     */
    @Query("SELECT * FROM Command WHERE source = :sourceKey AND accountId = :accountKey AND orgId = :orgKey AND moduleId = :moduleKey")
    fun getByModule(sourceKey: String, accountKey: String, orgKey: String, moduleKey: String): List<Command>

    /**
     * Gets all instances of the class in the DB as a [LiveData].
     * The application then should apply filters to this data to present it to the user
     * (e.g. show commands relevant to a specific module only).
     */
    @Query("SELECT * FROM Command")
    fun getAllCommands(): LiveData<List<Command>>

    /**
     * Deletes all instances from the DB. Normally not needed.
     */
    @Query("DELETE FROM Command")
    suspend fun clear()

    /**
     * Inserts ot updates the list of [commands] for the given [source], [accountId], [orgId] and [moduleId].
     * Also checks if some existing commands became unused due to this bulk update, and deletes them.
     * Since commands are fetched from the server altogether with their arguments, also
     * performs a similar operation for the arguments in each affected command - [argumentDao] is used for that.
     * We cannot just use the [insert] with [OnConflictStrategy.REPLACE], because SQLite will
     * delete the previous instances during the process and that will trigger a cascade deletion
     * on all child entities (down to the previously entered values for the arguments).
     */
    @Transaction
    suspend fun reloadForModule(source: String, accountId: String, orgId: String, moduleId: String,
                                commands: List<Command>, argumentDao: ArgumentDao) {
        val currentCommands = getByModule(source, accountId, orgId, moduleId)
        val unusedCommands = currentCommands.filter { curCom -> commands.find { newCom ->
            Command.areItemsTheSame(curCom, newCom) } ==
                null }
        val usedCommands = currentCommands.filter { curCom -> !unusedCommands.contains(curCom) }

        unusedCommands.forEach { command ->
            delete(command)
        }

        commands.forEach { command ->
            if (usedCommands.find { usedCom -> Command.areItemsTheSame(usedCom, command) } != null) {
                update(command)
            } else {
                insert(command)
            }

            command.arguments?.let {
                argumentDao.reloadForCommand(source, accountId,
                    orgId, moduleId, command.id, it)
            }
        }
    }

    /**
     * Deletes an instance from the DB.
     */
    @Delete
    suspend fun delete(command: Command)
}