/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.ViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import org.alteh.orghelper.repository.AccountRepository
import org.alteh.orghelper.data.database.Account
import org.alteh.orghelper.data.AccountWithState

import javax.inject.Inject

/**
 * A [ViewModel] for working with the [Account] table of the DB.
 * UI elements/screens which are depended on accounts must observe the [accounts] object from this class,
 * or the [accountsWithState] object, if they want to get the list of accounts together with
 * their states according to other tables (like [org.alteh.orghelper.data.database.Setting]).
 */
@HiltViewModel
class AccountsViewModel @Inject
    internal constructor(_accountRepository: AccountRepository)
 : ProgressViewModel() {

    private val accountRepository: AccountRepository = _accountRepository

    /**
     * A [LiveData] value to observe the accounts from the DB.
     */
    val accounts: LiveData<List<Account>> by lazy {
        _accountRepository.getAllAccounts()
    }

    /**
     * A [LiveData] value to observe the accounts along with their states from the settings.
     */
    val accountsWithState: LiveData<List<AccountWithState>> by lazy {
        _accountRepository.getAllAccountsWithState()
    }

    /**
     * Asynchronously logs the user in the Bot's server.
     */
    fun requestLogin(source: String, code: String) {
        launchProgress {
            accountRepository.requestLogin(source, code)
        }
    }

    /**
     * Asynchronously deletes the account from the DB.
     */
    fun delete(source: String, id: String) {
        launchProgress {
            accountRepository.delete(source, id)
        }
    }

    /**
     * Synchronously gets an [Account] object from the repository by its identifiers.
     */
    fun getAccount(source: String, id: String): Account? {
        return accountRepository.getAccount(source, id)
    }

    /**
     * Marks the account as "logged out" in the DB after it actually was logged out by the Bot's server.
     */
    fun onLogout(source: String, id: String) {
        launchProgress {
            accountRepository.onLogout(source, id)
        }
    }
}