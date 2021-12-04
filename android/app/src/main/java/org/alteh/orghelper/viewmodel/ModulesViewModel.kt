/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.viewmodel

import androidx.lifecycle.*
import dagger.hilt.android.lifecycle.HiltViewModel
import org.alteh.orghelper.data.*
import org.alteh.orghelper.data.database.Account
import org.alteh.orghelper.data.database.Module
import org.alteh.orghelper.data.database.Org
import org.alteh.orghelper.repository.ModuleRepository
import javax.inject.Inject

/**
 * A [ViewModel] for working with the [Module] table of the DB.
 * UI elements/screens which are depended on modules must observe the [modules] object from this class.
 * To show only modules related to a specific organization, the [setActiveOrg] function should be used.
 */
@HiltViewModel
class ModulesViewModel @Inject internal constructor(
    _moduleRepository: ModuleRepository,
    private val savedStateHandle: SavedStateHandle
) : ProgressViewModel() {

    private val moduleRepository: ModuleRepository = _moduleRepository

    /**
     * The switcher for the model data. The model will read only values corresponding to the org from the DB.
     */
    private val activeOrg: MutableLiveData<OrgOfAccount> = MutableLiveData(
        savedStateHandle.get(ACTIVE_ORG_SAVED_STATE_KEY)
    )

    /**
     * A [LiveData] value to observe the modules from the DB.
     */
    val modules: LiveData<List<Module>> = activeOrg.switchMap { org ->
        if (org == null) {
            MutableLiveData<List<Module>>(null)
        } else {
            moduleRepository.getModulesByOrg(org.account.source, org.account.id, org.org.id)
        }
    }

    /**
     * Asynchronously fetches the command modules of the given account's org from the Bot's server.
     */
    fun requestModules() {
        launchProgress {
            moduleRepository.requestModules(activeOrg.value?.account!!, activeOrg.value?.org?.id!!)
        }
    }

    /**
     * Asynchronously fetches the org-wide suggestions from the Bot's server.
     */
    fun requestOrgWideSuggestions() {
        launchProgress {
            moduleRepository.requestOrgWideSuggestions(activeOrg.value?.account!!, activeOrg.value?.org!!)
        }
    }

    /**
     * Sets the [activeOrg] switcher.
     */
    fun setActiveOrg(org: OrgOfAccount) {
        if (!Account.areItemsTheSame(activeOrg.value?.account, org.account) ||
            !Org.areItemsTheSame(activeOrg.value?.org, org.org)) {
            activeOrg.value = org
            savedStateHandle.set(ACTIVE_ORG_SAVED_STATE_KEY, org)
        }
    }

    /**
     * Checks if any [activeOrg] is set.
     */
    fun hasActiveOrg(): Boolean {
        return (activeOrg.value != null)
    }

    /**
     * Synchronously gets a [Module] object from the repository by its identifiers.
     */
    fun getModule(source: String, accountId: String, orgId: String, moduleId: String): Module? {
        return moduleRepository.getModule(source, accountId, orgId, moduleId)
    }

    companion object {
        private const val ACTIVE_ORG_SAVED_STATE_KEY = "ACTIVE_ORG_SAVED_STATE_KEY"
    }
}