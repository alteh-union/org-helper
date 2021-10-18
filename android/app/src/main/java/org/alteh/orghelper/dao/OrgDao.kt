/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.dao

import androidx.lifecycle.LiveData
import androidx.room.*
import org.alteh.orghelper.data.database.Org

/**
 * A Data Access Object for working with the [Org] data class.
 */
@Dao
interface OrgDao {
    /**
     * Inserts a new instance to the DB. Deletes the previous instance firstly if it conflicts with the new one.
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(org : Org)

    /**
     * Updates an existing instance with the new values. The caller needs to make sure that the previous instance
     * already exists in the table.
     */
    @Update
    suspend fun update(org: Org)

    /**
     * Gets an instance by its primary key (consisting of [sourceKey], [accountKey] and [idKey])
     */
    @Query("SELECT * FROM Org WHERE source = :sourceKey AND accountId = :accountKey AND id = :idKey")
    fun get(sourceKey: String, accountKey: String, idKey: String): Org?

    /**
     * Gets all instances related to specific account ([accountKey]) in the specific source
     * platform ([sourceKey]). Mostly needed to understand what instances are unused and should be deleted
     * during the bulk update operation after fetching the latest values from the server.
     */
    @Query("SELECT * FROM Org WHERE source = :sourceKey AND accountId = :accountKey")
    fun getByAccount(sourceKey: String, accountKey: String): List<Org>

    /**
     * Gets all instances of the class in the DB as a [LiveData].
     * The application then should apply filters to this data to present it to the user
     * (e.g. show orgs relevant to a specific user only).
     */
    @Query("SELECT * FROM Org")
    fun getAllOrgs(): LiveData<List<Org>>

    /**
     * Deletes all instances from the DB. Normally not needed.
     */
    @Query("DELETE FROM Org")
    suspend fun clear()

    /**
     * Inserts ot updates the list of [orgs] for the given [source] and [accountId].
     * Also checks if some existing orgs became unused due to this bulk update, and deletes them.
     * We cannot just use the [insert] with [OnConflictStrategy.REPLACE], because SQLite will
     * delete the previous instances during the process and that will trigger a cascade deletion
     * on all child entities (down to the previously entered values for the arguments).
     */
    @Transaction
    suspend fun reloadForAccount(source: String, accountId: String, orgs: List<Org>) {
        val currentOrgs = getByAccount(source, accountId)
        val unusedOrgs = currentOrgs.filter { curOrg -> orgs.find { newOrg ->
            Org.areItemsTheSame(curOrg, newOrg) } ==
                null }
        val usedOrgs = currentOrgs.filter { curOrg -> !unusedOrgs.contains(curOrg) }

        unusedOrgs.forEach { org ->
            delete(org)
        }

        orgs.forEach { org ->
            if (usedOrgs.find { usedOrg -> Org.areItemsTheSame(usedOrg, org) } != null) {
                update(org)
            } else {
                insert(org)
            }
        }
    }

    /**
     * Deletes an instance from the DB.
     */
    @Delete
    suspend fun delete(org: Org)
}