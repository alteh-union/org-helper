/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.dao

import androidx.lifecycle.LiveData
import androidx.room.*
import org.alteh.orghelper.data.database.Argument
import org.alteh.orghelper.data.ArgumentOfModule

/**
 * A Data Access Object for working with the [Argument] data class.
 */
@Dao
interface ArgumentDao {
    /**
     * Inserts a new instance to the DB. Deletes the previous instance firstly if it conflicts with the new one.
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(argument : Argument)

    /**
     * Updates an existing instance with the new values. The caller needs to make sure that the previous instance
     * already exists in the table.
     */
    @Update
    suspend fun update(argument: Argument)

    /**
     * Gets an instance by its primary key (consisting of [sourceKey], [accountKey], [orgKey], [moduleKey],
     * [commandKey] and [idKey])
     */
    @Query("SELECT * FROM Argument WHERE source = :sourceKey AND accountId = :accountKey AND orgId = :orgKey AND moduleId = :moduleKey AND commandId = :commandKey AND id = :idKey")
    fun get(sourceKey: String, accountKey: String, orgKey: String, moduleKey: String, commandKey: String,
            idKey: String): Argument?

    /**
     * Gets all instances related to specific account ([accountKey]) in the specific source
     * platform ([sourceKey]), the specific org ([orgKey]) the specific module ([moduleKey])
     * and the specific command ([commandKey]).
     * Mostly needed to understand what instances are unused and should be deleted during the bulk update
     * operation after fetching the latest values from the server.
     */
    @Query("SELECT * FROM Argument WHERE source = :sourceKey AND accountId = :accountKey AND orgId = :orgKey AND moduleId = :moduleKey AND commandId = :commandKey")
    fun getByCommand(sourceKey: String, accountKey: String, orgKey: String, moduleKey: String,
                     commandKey: String): List<Argument>

    /**
     * Gets all instances of the class in the DB as a [LiveData].
     * The application then should apply filters to this data to present it to the user
     * (e.g. show arguments relevant to a specific command only).
     */
    @Query("SELECT * FROM Argument")
    fun getAllArguments(): LiveData<List<Argument>>

    /**
     * Gets a [LiveData] of all arguments along their commands, grouped by module (see [ArgumentOfModule]).
     * This is needed to get the full view of the module in one joined query, so the user
     * can work with all commands of the module altogether.
     * The receiver is expected to make a list of [org.alteh.orghelper.data.database.Command] based
     * out of this and attach the list of [Argument] to each corresponding command to get
     * the proper hierarchy of objects.
     */
    @Query("SELECT com.*, arg.id AS argId, arg.name AS argName, arg.scannerType AS scannerType, arg.help AS argHelp FROM Command com LEFT OUTER JOIN Argument arg ON (com.source = arg.source AND com.accountId = arg.accountId AND com.orgId = arg.orgId AND com.moduleId = arg.moduleId AND com.id = arg.commandId)")
    fun getArgumentsByModule(): LiveData<List<ArgumentOfModule>>

    /**
     * Deletes all instances from the DB. Normally not needed.
     */
    @Query("DELETE FROM Argument")
    suspend fun clear()

    /**
     * Inserts ot updates the list of [arguments] for the given [source], [accountId], [orgId], [moduleId]
     * and [commandId]. Also checks if some existing arguments became unused due to this bulk update, and deletes them.
     * We cannot just use the [insert] with [OnConflictStrategy.REPLACE], because SQLite will
     * delete the previous instances during the process and that will trigger a cascade deletion
     * on all child entities (down to the previously entered values for the arguments).
     */
    @Transaction
    suspend fun reloadForCommand(source: String, accountId: String, orgId: String, moduleId: String,
                                 commandId: String, arguments: List<Argument>) {
        val currentArgs = getByCommand(source, accountId, orgId, moduleId, commandId)
        val unusedArgs = currentArgs.filter { curArg -> arguments.find { newArg ->
            Argument.areItemsTheSame(curArg, newArg) } ==
                null }
        val usedArgs = currentArgs.filter { curArg -> !unusedArgs.contains(curArg) }

        unusedArgs.forEach { argument ->
            delete(argument)
        }

        arguments.forEach { argument ->
            if (usedArgs.find { usedArg -> Argument.areItemsTheSame(usedArg, argument) } != null) {
                update(argument)
            } else {
                insert(argument)
            }
        }
    }

    /**
     * Deletes an instance from the DB.
     */
    @Delete
    suspend fun delete(argument: Argument)
}