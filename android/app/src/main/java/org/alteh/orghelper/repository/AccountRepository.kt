/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.repository

import android.util.Log
import androidx.lifecycle.LiveData
import org.alteh.orghelper.BuildConfig
import org.alteh.orghelper.NetworkInterface
import org.alteh.orghelper.OrgHelperApplication.Companion.LOG_TAG
import org.alteh.orghelper.dao.*
import org.alteh.orghelper.data.*
import org.alteh.orghelper.data.database.Account
import org.alteh.orghelper.data.database.Setting
import java.lang.NullPointerException
import javax.inject.Inject

import javax.inject.Singleton

/**
 * A repository for handling [Account] objects. Asynchronously manages the accounts both in the Bot's server
 * and in the database. UI elements should access this data not directly, but via corresponding view models,
 * e.g. [org.alteh.orghelper.viewmodel.AccountsViewModel], because the view models provide a proper
 * coroutine scope which allows to run long operations in the background.
 */
@Singleton
class AccountRepository @Inject constructor(private val network: NetworkInterface,
                                            private val accountDao: AccountDao,
                                            private val settingDao: SettingDao
) {

    private val accounts: LiveData<List<Account>> = accountDao.getAllAccounts()
    private val accountsWithState: LiveData<List<AccountWithState>> = accountDao.getAllAccountsWithState()

    /**
     * Logs the account in the Bot's server.
     * In case of success inserts the [Account] object to the DB and marks it as active
     * in the [Setting] table.
     * The redirect URI used here should match the intent filter in the AndroidManifest,
     * otherwise the source server will not authorize the app to work with the user account
     * (it should match the redirect URI used during the initial login on the source server,
     * which was launched from the [org.alteh.orghelper.MainActivity])
     */
    suspend fun requestLogin(source: String, code: String) {

        val result = network.login(source, code, "${BuildConfig.WEBSITE_ADDRESS}/orghelper/oauth/$source")

        if (result == null) {
            val e = NullPointerException("Null result for login")
            Log.e(LOG_TAG, "${AccountRepository::class.java.simpleName} requestLogin failed", e)
            throw e
        }

        result.source = source
        result.loggedIn = true

        accountDao.insertOrUpdate(result)
        settingDao.insert(
            Setting(
            SettingRepository.ACTIVE_SOURCE_SETTING,
            source)
        )
        settingDao.insert(
            Setting(
            SettingRepository.ACTIVE_ACCOUNT_SETTING,
            result.id)
        )
    }

    /**
     * Gets a [LiveData] object representing all accounts in the DB.
     */
    fun getAllAccounts(): LiveData<List<Account>> {
        return accounts
    }

    /**
     * Gets a [LiveData] object representing all accounts in the DB along with their states from the settings table.
     */
    fun getAllAccountsWithState(): LiveData<List<AccountWithState>> {
        return accountsWithState
    }

    /**
     * Inserts a new account to the DB
     */
    suspend fun insert(account: Account) {
        try {
            accountDao.insert(account)
        } catch (e: Exception) {
            Log.e(LOG_TAG, "${AccountRepository::class.java.simpleName} failed to insert an account", e)
        }
    }

    /**
     * Deletes an account from the DB by its identifiers
     */
    suspend fun delete(source: String, id: String) {
        val account = accounts.value?.find { acc -> acc.source == source && acc.id == id }
        if (account != null) {
            accountDao.delete(account)
        }
    }

    /**
     * Gets an [Account] by its identifiers.
     */
    fun getAccount(source: String, id: String): Account? {
        return accounts.value?.find { acc -> acc.source == source && acc.id == id }
    }

    /**
     * Marks the account as "logged out" in the DB after it actually was logged out by the Bot's server.
     */
    suspend fun onLogout(source: String, id: String) {
        accountDao.logout(source, id)
    }
}