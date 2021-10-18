/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.viewmodel

import androidx.lifecycle.*
import dagger.hilt.android.lifecycle.HiltViewModel
import org.alteh.orghelper.data.database.Account
import org.alteh.orghelper.data.database.Org
import org.alteh.orghelper.data.database.Setting
import org.alteh.orghelper.repository.OrgRepository
import javax.inject.Inject

/**
 * A [ViewModel] for working with the [Org] table of the DB.
 * UI elements/screens which are depended on organizations must observe the [orgs] object from this class.
 * To show only orgs related to a specific account, the [setActiveAccount] function should be used.
 */
@HiltViewModel
class OrgsViewModel @Inject internal constructor(
    _orgRepository: OrgRepository,
    private val savedStateHandle: SavedStateHandle
) : ProgressViewModel() {

    private val orgRepository: OrgRepository = _orgRepository

    /**
     * The switcher for the model data. The model will read only values corresponding to the account from the DB.
     */
    private val activeAccount: MutableLiveData<Account> = MutableLiveData(
        savedStateHandle.get(ACTIVE_ACCOUNT_SAVED_STATE_KEY)
    )

    /**
     * A [LiveData] value to observe the orgs from the DB.
     */
    val orgs: LiveData<List<Org>> = activeAccount.switchMap { account ->
        if (account == null) {
            MutableLiveData<List<Org>>(null)
        } else {
            orgRepository.getOrgsByAccount(account.source, account.id)
        }
    }

    /**
     * Asynchronously fetches the orgs from the Bot's server where both the account and the Bot are present.
     */
    fun requestOrgs() {
        launchProgress {
            orgRepository.requestOrgs(activeAccount.value!!)
        }
    }

    /**
     * Sets the [activeAccount] switcher.
     */
    fun setActiveAccount(account: Account) {
        if (!Account.areItemsTheSame(activeAccount.value, account)) {
            activeAccount.value = account
            savedStateHandle.set(ACTIVE_ACCOUNT_SAVED_STATE_KEY, account)
        }
    }

    /**
     * Checks if any [activeAccount] is set.
     */
    fun hasActiveAccount(): Boolean {
        return (activeAccount.value != null)
    }

    /**
     * Synchronously gets an [Org] object from the repository by its identifiers.
     */
    fun getOrg(source: String, accountId: String, orgId: String): Org? {
        return orgRepository.getOrg(source, accountId, orgId)
    }

    companion object {
        private const val ACTIVE_ACCOUNT_SAVED_STATE_KEY = "ACTIVE_ACCOUNT_SAVED_STATE_KEY"
    }
}