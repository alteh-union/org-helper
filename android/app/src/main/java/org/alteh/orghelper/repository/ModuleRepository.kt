/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.repository

import android.util.Log
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.switchMap
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.alteh.orghelper.MainNetwork
import org.alteh.orghelper.NetworkInterface
import org.alteh.orghelper.OrgHelperApplication.Companion.LOG_TAG
import org.alteh.orghelper.data.database.Account
import org.alteh.orghelper.data.database.Module
import org.alteh.orghelper.dao.ModuleDao
import org.alteh.orghelper.data.CommandExecutionBundle
import org.alteh.orghelper.data.CommandResult
import org.alteh.orghelper.data.ExecutionResult
import org.alteh.orghelper.data.database.Org
import java.lang.NullPointerException
import javax.inject.Inject

import javax.inject.Singleton

/**
 * A repository for handling [Module] objects. Asynchronously manages the modules both in the Bot's server
 * and in the database. UI elements should access this data not directly, but via corresponding view models,
 * e.g. [org.alteh.orghelper.viewmodel.ModulesViewModel], because the view models provide a proper
 * coroutine scope which allows to run long operations in the background.
 */
@Singleton
class ModuleRepository @Inject constructor(private val network: NetworkInterface,
                                           private val moduleDao: ModuleDao
) {

    private val modules: LiveData<List<Module>> = moduleDao.getAllModules()

    /**
     * Asynchronously fetches the command modules of the given account's org from the Bot's server.
     * Then updates the [Module] table accordingly.
     */
    suspend fun requestModules(
        activeAccount: Account, orgId: String
    ) {

        val result = network.getModules(MainNetwork.getBearerHeader(activeAccount.token!!),
            activeAccount.source, orgId)

        if (result?.modules == null) {
            val e = NullPointerException("Null result for requestModules")
            Log.e(LOG_TAG, "${ModuleRepository::class.java.simpleName} requestModules failed", e)
            throw e
        }

        val resultModules = result.modules!!

        withContext(Dispatchers.Default) {
            for (module in resultModules) {
                module.source = activeAccount.source
                module.accountId = activeAccount.id
                module.orgId = orgId
            }
        }

        moduleDao.reloadForOrg(activeAccount.source, activeAccount.id, orgId, resultModules)
    }

    /**
     * Asynchronously fetches the org-wide suggestions from the Bot's server.
     */
    suspend fun requestOrgWideSuggestions(
        activeAccount: Account, org: Org
    ) {
        org.suggestionCommands?.let { commands ->
            for (suggestionCommand in commands) {
                val executionResult = getSuggestions(activeAccount.token!!, activeAccount.source,
                    org.id, suggestionCommand) ?: continue

                executionResult.commandResult?.let {
                    it.suggestions.let { suggestions ->
                        org.suggestions[suggestionCommand] = suggestions
                    }
                }
            }
        }
    }

    /**
     * Asynchronously gets suggestions for a specific command from the Bot's server.
     */
    suspend fun getSuggestions(token: String, source: String, orgId: String, commandId: String): ExecutionResult? {
        return network.getSuggestions(MainNetwork.getBearerHeader(token),
            source, CommandExecutionBundle(commandId, orgId, mapOf())
        )
    }

    /**
     * Gets a [LiveData] object representing the list of modules related to the given account's organization.
     */
    fun getModulesByOrg(source: String, accountId: String, orgId: String): LiveData<List<Module>> {
        return modules.switchMap {
            val filteredModules = MutableLiveData<List<Module>>()
            val filteredList = it.filter { module ->
                module.source == source &&
                        module.accountId == accountId && module.orgId == orgId
            }
            filteredModules.value = filteredList
            filteredModules
        }
    }

    /**
     * Gets a [Module] object from the repository by its identifiers.
     */
    fun getModule(source: String, accountId: String, orgId: String, moduleId: String): Module? {
        return modules.value?.find { module ->
            module.source == source && module.accountId == accountId && module.orgId == orgId && module.id == moduleId }
    }
}