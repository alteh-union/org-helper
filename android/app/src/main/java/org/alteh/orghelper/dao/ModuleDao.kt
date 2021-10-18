/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.dao

import androidx.lifecycle.LiveData
import androidx.room.*
import org.alteh.orghelper.data.database.Module

/**
 * A Data Access Object for working with the [Module] data class.
 */
@Dao
interface ModuleDao {
    /**
     * Inserts a new instance to the DB. Deletes the previous instance firstly if it conflicts with the new one.
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(module : Module)

    /**
     * Updates an existing instance with the new values. The caller needs to make sure that the previous instance
     * already exists in the table.
     */
    @Update
    suspend fun update(module: Module)

    /**
     * Gets an instance by its primary key (consisting of [sourceKey], [accountKey], [orgKey] and [idKey])
     */
    @Query("SELECT * FROM Module WHERE source = :sourceKey AND accountId = :accountKey AND orgId = :orgKey AND id = :idKey")
    fun get(sourceKey: String, accountKey: String, orgKey: String, idKey: String): Module?

    /**
     * Gets all instances related to specific account ([accountKey]) in the specific source
     * platform ([sourceKey]) and the specific org ([orgKey]). Mostly needed to understand what instances
     * are unused and should be deleted during the bulk update operation after fetching the latest values
     * from the server.
     */
    @Query("SELECT * FROM Module WHERE source = :sourceKey AND accountId = :accountKey AND orgId = :orgKey")
    fun getByOrg(sourceKey: String, accountKey: String, orgKey: String): List<Module>

    /**
     * Gets all instances of the class in the DB as a [LiveData].
     * The application then should apply filters to this data to present it to the user
     * (e.g. show modules relevant to a specific org only).
     */
    @Query("SELECT * FROM Module")
    fun getAllModules(): LiveData<List<Module>>

    /**
     * Deletes all instances from the DB. Normally not needed.
     */
    @Query("DELETE FROM Module")
    suspend fun clear()

    /**
     * Inserts ot updates the list of [modules] for the given [source], [accountId] and [orgId].
     * Also checks if some existing modules became unused due to this bulk update, and deletes them.
     * We cannot just use the [insert] with [OnConflictStrategy.REPLACE], because SQLite will
     * delete the previous instances during the process and that will trigger a cascade deletion
     * on all child entities (down to the previously entered values for the arguments).
     */
    @Transaction
    suspend fun reloadForOrg(source: String, accountId: String, orgId: String, modules: List<Module>) {
        val currentModules = getByOrg(source, accountId, orgId)
        val unusedModules = currentModules.filter { curMod -> modules.find { newMod ->
            Module.areItemsTheSame(curMod, newMod) } ==
                null }
        val usedModules = currentModules.filter { curMod -> !unusedModules.contains(curMod) }

        unusedModules.forEach { module ->
            delete(module)
        }

        modules.forEach { module ->
            if (usedModules.find { usedMod -> Module.areItemsTheSame(usedMod, module) } != null) {
                update(module)
            } else {
                insert(module)
            }
        }
    }

    /**
     * Deletes an instance from the DB.
     */
    @Delete
    suspend fun delete(module: Module)
}