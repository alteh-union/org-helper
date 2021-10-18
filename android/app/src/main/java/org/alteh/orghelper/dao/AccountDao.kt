/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.dao

import androidx.lifecycle.LiveData
import androidx.room.*
import org.alteh.orghelper.data.database.Account
import org.alteh.orghelper.data.AccountWithState
import org.alteh.orghelper.repository.SettingRepository.Companion.ACTIVE_ACCOUNT_SETTING
import org.alteh.orghelper.repository.SettingRepository.Companion.ACTIVE_SOURCE_SETTING

/**
 * A Data Access Object for working with the [Account] data class.
 */
@Dao
interface AccountDao {
    /**
     * Inserts a new instance to the DB. Deletes the previous instance firstly if it conflicts with the new one.
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(account : Account)

    /**
     * Updates an existing instance with the new values. The caller needs to make sure that the previous instance
     * already exists in the table.
     */
    @Update
    suspend fun update(account: Account)

    /**
     * Gets an instance by its primary key (consisting of [sourceKey] and [idKey])
     */
    @Query("SELECT * FROM Account WHERE source = :sourceKey AND id = :idKey")
    fun get(sourceKey: String, idKey: String): Account?

    /**
     * Gets all instances of the class in the DB.
     */
    @Query("SELECT * FROM Account")
    fun getAllAccounts(): LiveData<List<Account>>

    /**
     * Gets all accounts along with the flag of the active account (which is determined by looking
     * at the [org.alteh.orghelper.data.database.Setting] table).
     */
    @Query("SELECT Account.source, Account.id, Account.username, Account.avatar, CASE WHEN Account.source = ss.value AND Account.id = sa.value THEN 1 ELSE 0 END AS active, Account.loggedIn FROM Account LEFT OUTER JOIN Setting ss ON (ss.name = '${ACTIVE_SOURCE_SETTING}') LEFT OUTER JOIN Setting sa ON (sa.name = '${ACTIVE_ACCOUNT_SETTING}')")
    fun getAllAccountsWithState(): LiveData<List<AccountWithState>>

    /**
     * Marks the given account as logged out by the Bot's server.
     */
    @Query("UPDATE Account SET loggedIn = 0 WHERE source = :sourceKey AND id = :idKey")
    suspend fun logout(sourceKey: String, idKey: String)

    /**
     * Deletes all instances from the DB. Normally not needed.
     */
    @Query("DELETE FROM Account")
    suspend fun clear()

    /**
     * Deletes an instance from the DB.
     */
    @Delete
    suspend fun delete(account: Account)

    /**
     * Inserts ot updates an [account] if it already exists in the DB.
     * We cannot just use the [insert] with [OnConflictStrategy.REPLACE], because SQLite will
     * delete the previous instance during the process and that will trigger a cascade deletion
     * on all child entities (down to the previously entered values for the arguments).
     */
    @Transaction
    suspend fun insertOrUpdate(account: Account) {
        val currentAccount = get(account.source, account.id)
        if (currentAccount == null) {
            insert(account)
        } else {
            update(account)
        }
    }
}