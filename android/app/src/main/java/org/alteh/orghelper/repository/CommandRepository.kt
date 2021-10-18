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
import org.alteh.orghelper.dao.ArgumentDao
import org.alteh.orghelper.dao.ArgumentValueDao
import org.alteh.orghelper.dao.CommandDao
import org.alteh.orghelper.data.*
import org.alteh.orghelper.data.database.*
import java.lang.NullPointerException
import javax.inject.Inject

import javax.inject.Singleton

/**
 * A repository for handling [Command], [Argument] and [ArgumentValue] objects.
 * Asynchronously manages the entities both in the Bot's server
 * and in the database. UI elements should access this data not directly, but via corresponding view models,
 * e.g. [org.alteh.orghelper.viewmodel.CommandsViewModel], because the view models provide a proper
 * coroutine scope which allows to run long operations in the background.
 */
@Singleton
class CommandRepository @Inject constructor(private val network: NetworkInterface,
                                            private val commandDao: CommandDao,
                                            private val argumentDao: ArgumentDao,
                                            private val argumentValueDao: ArgumentValueDao
) {

    private val argumentsByModule: LiveData<List<ArgumentOfModule>> = argumentDao.getArgumentsByModule()
    private val argumentValues: LiveData<List<ArgumentValue>> = argumentValueDao.getAllValues()

    /**
     * Asynchronously fetches the commands with arguments of the given module from the Bot's server.
     * Then updates the [Command] and [Argument] tables accordingly.
     * That automatically implies that [ArgumentValue] entities of deleted [Argument] values
     * will also be deleted at the end of this procedure.
     */
    suspend fun requestCommands(
        activeAccount: Account, activeOrg: Org, moduleId: String
    ) {
        val result = network.getCommands(MainNetwork.getBearerHeader(activeAccount.token!!),
            activeAccount.source, activeOrg.id, moduleId)

        if (result?.definition?.commands == null) {
            val e = NullPointerException("Null result for getModules")
            Log.e(LOG_TAG, "${CommandRepository::class.java.simpleName} requestCommands failed", e)
            throw e
        }

        val resultCommands = result.definition?.commands!!

        withContext(Dispatchers.Default) {
            for (command in resultCommands) {
                command.source = activeAccount.source
                command.accountId = activeAccount.id
                command.orgId = activeOrg.id
                command.moduleId = moduleId
                if (command.arguments != null) {
                    for (argument in command.arguments!!) {
                        argument.source = activeAccount.source
                        argument.accountId = activeAccount.id
                        argument.orgId = activeOrg.id
                        argument.moduleId = moduleId
                        argument.commandId = command.id
                    }
                }
            }
        }

        commandDao.reloadForModule(activeAccount.source, activeAccount.id,
            activeOrg.id, moduleId, resultCommands, argumentDao)
    }

    /**
     * Gets a [LiveData] object representing the list of arguments along with commands info
     * for all commands in the given module.
     */
    fun getArgumentsByModule(source: String, accountId: String, orgId: String, moduleId: String)
            : LiveData<List<ArgumentOfModule>> {
        return argumentsByModule.switchMap {
            val filteredCommands = MutableLiveData<List<ArgumentOfModule>>()
            val filteredList = it.filter { aom -> aom.source == source &&
                    aom.accountId == accountId && aom.orgId == orgId &&
                    aom.moduleId == moduleId }
            filteredCommands.value = filteredList
            filteredCommands
        }
    }

    /**
     * Gets a [LiveData] object representing the last entered argument values for the given module.
     */
    fun getArgumentValuesByModule(source: String, accountId: String, orgId: String, moduleId: String)
            : LiveData<List<ArgumentValue>> {
        return argumentValues.switchMap {
            val filteredValues = MutableLiveData<List<ArgumentValue>>()
            val filteredList = it.filter { av -> av.source == source &&
                    av.accountId == accountId && av.orgId == orgId &&
                    av.moduleId == moduleId }
            filteredValues.value = filteredList
            filteredValues
        }
    }

    /**
     * Asynchronously requests to execute a command on the Bot's server.
     * User inputs are in the [argValues] object.
     */
    suspend fun executeCommand(token: String, source: String, orgId: String, commandId: String,
                               argValues: Map<String, String>): ExecutionResult? {
        return network.executeCommand(MainNetwork.getBearerHeader(token),
            source, CommandExecutionBundle(commandId, orgId, argValues)
        )
    }

    /**
     * Asynchronously updates the latest value of the given [argument] in the DB.
     */
    suspend fun updateArgumentValue(argument: Argument, newValue: String) {
        argumentValueDao.insert(ArgumentValue(
            argument.source,
            argument.accountId,
            argument.orgId,
            argument.moduleId,
            argument.commandId,
            argument.id,
            newValue
        ))
    }
}