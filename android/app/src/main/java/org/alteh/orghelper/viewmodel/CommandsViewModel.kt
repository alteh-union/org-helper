/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.viewmodel

import androidx.lifecycle.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import org.alteh.orghelper.data.*
import org.alteh.orghelper.data.database.*
import org.alteh.orghelper.repository.CommandRepository
import javax.inject.Inject

/**
 * A [ViewModel] for working with the [Command], [Argument] and [ArgumentValue] tables of the DB.
 * The entities from the tables are combined, since the user works with them altogether in a single fragment.
 * UI elements/screens which are depended on the tables must observe the [commandsWithArgs] object from this class.
 * Also classes may observe the [argumentValues] objects for changes in the values inputted by the
 * user. Be careful though, if the values are updated in the DB on each input, too many observations
 * may be triggered.
 * Finally, the results of command executions may be tracked by the [executionResults] objects
 * (not linked to the DB, as results are not saved there).
 * To show only commands related to a specific module, the [setActiveModule] function should be used.
 */
@HiltViewModel
class CommandsViewModel @Inject internal constructor(
    _commandRepository: CommandRepository,
    private val savedStateHandle: SavedStateHandle
) : ProgressViewModel() {

    private val commandRepository: CommandRepository = _commandRepository

    /**
     * The switcher for the model data. The model will read only values corresponding to the module from the DB.
     */
    private val activeModule: MutableLiveData<ModuleOfOrg> = MutableLiveData(
        savedStateHandle.get(ACTIVE_MODULE_SAVED_STATE_KEY)
    )

    /**
     * A [LiveData] value to observe the commands along with their arguments from the DB.
     */
    val commandsWithArgs: LiveData<List<ArgumentOfModule>> = activeModule.switchMap { module ->
        if (module == null) {
            MutableLiveData<List<ArgumentOfModule>>(null)
        } else {
            commandRepository.getArgumentsByModule(module.account.source,
                module.account.id, module.org.id, module.module.id)
        }
    }

    /**
     * A [LiveData] value to observe the argument values from the DB.
     */
    val argumentValues: LiveData<List<ArgumentValue>> = activeModule.switchMap { module ->
        if (module == null) {
            MutableLiveData<List<ArgumentValue>>(null)
        } else {
            commandRepository.getArgumentValuesByModule(module.account.source,
                module.account.id, module.org.id, module.module.id)
        }
    }

    /**
     * A [LiveData] value to observe the execution results.
     */
    val executionResults: MutableLiveData<MutableMap<String, ExecutionResult>?> = MutableLiveData(
        null
    )

    /**
     * A [LiveData] value to observe the input suggestions from the server.
     */
    val suggestionsResults: MutableLiveData<MutableMap<Pair<String, String>, List<ValueSuggestion>>?> = MutableLiveData(
        null
    )

    /**
     * Asynchronously fetches the commands with arguments of the given account's org and module from the Bot's server.
     */
    fun requestCommands() {
        launchProgress {
            commandRepository.requestCommands(activeModule.value?.account!!,
                activeModule.value?.org!!, activeModule.value?.module?.id!!)
        }
    }

    /**
     * Sets the [activeModule] switcher.
     */
    fun setActiveModule(module: ModuleOfOrg) {
        if (!Account.areItemsTheSame(activeModule.value?.account, module.account) ||
            !Org.areItemsTheSame(activeModule.value?.org, module.org) ||
            !Module.areItemsTheSame(activeModule.value?.module, module.module)) {
            executionResults.value = null
            suggestionsResults.value = null
            activeModule.value = module
            savedStateHandle.set(ACTIVE_MODULE_SAVED_STATE_KEY, module)
        }
    }

    /**
     * Gets the value of the [activeModule] switcher.
     */
    fun getActiveModule(): MutableLiveData<ModuleOfOrg> {
        return activeModule
    }

    /**
     * Asynchronously requests to execute a command on the Bot's server.
     * User inputs are in the [argValues] object.
     */
    fun executeCommand(token: String, source: String, orgId: String, commandId: String,
                       argValues: Map<String, String>) {
        launchProgress {
            var commandResult = commandRepository.executeCommand(token, source, orgId, commandId, argValues)
            if (commandResult == null) {
                commandResult = ExecutionResult(CommandResult("No response from the server"))
            }
            var resultMap = executionResults.value
            if (resultMap == null) {
                resultMap = mutableMapOf()
            }
            resultMap[commandId] = commandResult
            executionResults.value = resultMap
        }
    }

    /**
     * Asynchronously requests to get suggestions from the Bot's server.
     */
    fun getSuggestions(token: String, argument: Argument, suggestionCommandId: String,
                       argValues: Map<String, String>) {
        launchProgress {
            var executionResult = commandRepository.getSuggestions(token, argument.source, argument.orgId,
                suggestionCommandId, argValues)
            if (executionResult == null) {
                executionResult = ExecutionResult(CommandResult("No response from the server"))
            }
            // TODO: Maybe add some UI reaction if getting suggestions did not work.
            executionResult.commandResult?.let {
                it.suggestions.let { suggestions ->
                    var suggestionsMap = suggestionsResults.value
                    if (suggestionsMap == null) {
                        suggestionsMap = mutableMapOf()
                    }
                    suggestionsMap[Pair(argument.commandId, argument.id)] = suggestions
                    suggestionsResults.value = suggestionsMap
                }
            }
        }
    }

    /**
     * Asynchronously updates the latest value of the given [argument] in the DB.
     */
    fun updateArgumentValue(argument: Argument, newValue: String) {
        viewModelScope.launch {
            commandRepository.updateArgumentValue(argument, newValue)
        }
    }

    companion object {
        private const val ACTIVE_MODULE_SAVED_STATE_KEY = "ACTIVE_MODULE_SAVED_STATE_KEY"
    }
}