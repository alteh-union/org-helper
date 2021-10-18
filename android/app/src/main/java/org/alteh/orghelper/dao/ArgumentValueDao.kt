/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.dao

import androidx.lifecycle.LiveData
import androidx.room.*
import org.alteh.orghelper.data.database.ArgumentValue

/**
 * A Data Access Object for working with the [ArgumentValue] data class.
 */
@Dao
interface ArgumentValueDao {
    /**
     * Inserts a new instance to the DB. Deletes the previous instance firstly if it conflicts with the new one.
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(argument : ArgumentValue)

    /**
     * Updates an existing instance with the new values. The caller needs to make sure that the previous instance
     * already exists in the table.
     */
    @Update
    suspend fun update(argument: ArgumentValue)

    /**
     * Gets an instance by its primary key (consisting of [sourceKey], [accountKey], [orgKey], [moduleKey],
     * [commandKey], [argumentKey] and [idKey])
     */
    @Query("SELECT * FROM ArgumentValue WHERE source = :sourceKey AND accountId = :accountKey AND orgId = :orgKey AND moduleId = :moduleKey AND commandId = :commandKey AND argumentId = :argumentKey")
    fun get(sourceKey: String, accountKey: String, orgKey: String, moduleKey: String, commandKey: String,
            argumentKey: String): ArgumentValue?

    /**
     * Gets all instances of the class in the DB as a [LiveData].
     * The application then should apply filters to this data to present it to the user
     * (e.g. show argument values relevant to a specific argument only).
     */
    @Query("SELECT * FROM ArgumentValue")
    fun getAllValues(): LiveData<List<ArgumentValue>>

    /**
     * Deletes all instances from the DB. Normally not needed.
     */
    @Query("DELETE FROM ArgumentValue")
    suspend fun clear()

    /**
     * Deletes an instance from the DB.
     */
    @Delete
    suspend fun delete(argument: ArgumentValue)
}