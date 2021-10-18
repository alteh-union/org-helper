/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.dao

import androidx.lifecycle.LiveData
import androidx.room.*
import org.alteh.orghelper.data.database.Setting

/**
 * A Data Access Object for working with the [Setting] data class.
 */
@Dao
interface SettingDao {
    /**
     * Inserts a new instance to the DB. Deletes the previous instance firstly if it conflicts with the new one.
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(setting : Setting)

    /**
     * Updates an existing instance with the new values. The caller needs to make sure that the previous instance
     * already exists in the table.
     */
    @Update
    suspend fun update(setting: Setting)

    /**
     * Gets an instance by its primary key (consisting of [nameKey])
     */
    @Query("SELECT * FROM Setting WHERE name = :nameKey")
    fun get(nameKey: String): Setting?

    /**
     * Gets all instances of the class in the DB.
     */
    @Query("SELECT * FROM Setting")
    fun getAllSettings(): LiveData<List<Setting>>

    /**
     * Deletes all instances from the DB. Normally not needed.
     */
    @Query("DELETE FROM Setting")
    suspend fun clear()

    /**
     * Deletes a setting by its id ([nameKey])
     */
    @Query("DELETE FROM Setting WHERE name = :nameKey")
    suspend fun deleteByName(nameKey: String)

    /**
     * Deletes an instance from the DB.
     */
    @Delete
    suspend fun delete(setting: Setting)
}