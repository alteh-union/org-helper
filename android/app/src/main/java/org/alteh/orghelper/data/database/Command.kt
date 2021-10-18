/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.data.database

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.ForeignKey.CASCADE
import androidx.room.Ignore
import com.google.gson.annotations.SerializedName
import org.alteh.orghelper.data.ExecutionResult
import org.alteh.orghelper.data.database.Account.Companion.areItemsTheSame
import java.io.Serializable

/**
 * Represents a command for a given user (identified by [accountId]) in the given [source] platform
 * (like Discord) in the given organization ([orgId]) and the given module ([moduleId]).
 * Commands with the same [id] (commandId) but associated with
 * different accounts OR organizations are considered *different* commands for the purposes of the application,
 * to avoid the complications of maintaining the many-to-many relations.
 * Besides, the user is not expected to have *that* many accounts
 * in the same source platform to make a problem due to duplicated data.
 */
@Entity(primaryKeys = ["source", "accountId", "orgId", "moduleId", "id"],
        foreignKeys = [ForeignKey(
            entity = Module::class,
            parentColumns = ["source", "accountId", "orgId", "id"],
            childColumns = ["source", "accountId", "orgId", "moduleId"],
            onDelete = CASCADE,
            deferred = true
        )]
)
data class Command (
    @SerializedName("source")
    var source: String = "",
    @SerializedName("accountId")
    var accountId: String = "",
    @SerializedName("orgId")
    var orgId: String = "",
    @SerializedName("moduleId")
    var moduleId: String = "",
    @SerializedName("name")
    var id: String = "",
    @SerializedName("displayName")
    var name: String = "",
    @SerializedName("help")
    var help: String? = null,

    @Ignore
    @SerializedName("args")
    var arguments: MutableList<Argument>? = null,

    @Ignore
    var result: ExecutionResult? = null

) : Serializable {
    companion object {
        /**
         * Checks if ids of the given entities are the same. Besides the DB-related checks this is also
         * needed for the adapters to determine which rows need to be rebound.
         * The data which does not belong to the primary key may be different - it does not affect
         * the algorithm.
         * Two null entities are considered the same. A null entity and a non-null entity are considered not the same.
         */
        fun areItemsTheSame(
            oldItem: Command?,
            newItem: Command?
        ): Boolean {
            if (oldItem == null) {
                return newItem == null
            }
            if (newItem == null) {
                return false
            }
            return oldItem.source == newItem.source &&
                    oldItem.accountId == newItem.accountId &&
                    oldItem.orgId == newItem.orgId &&
                    oldItem.moduleId == newItem.moduleId &&
                    oldItem.id == newItem.id
        }

        /**
         * Checks if contents of the given entities are the same, leaving the primary keys aside.
         * Besides the DB-related checks this is also needed for the adapters to determine
         * which rows need to be rebound.
         * The primary keys still may be different, so to check whether two entities are completely the
         * same both this function and [areItemsTheSame] need to be invoked.
         * Also includes the check of associated child objects: [ExecutionResult] and
         * [org.alteh.orghelper.data.database.Argument] as they belong to the content of the commands.
         */
        fun areContentsTheSame(
            oldItem: Command,
            newItem: Command
        ): Boolean {
            if (!(oldItem.name == newItem.name &&
                    oldItem.help == newItem.help)) {
                return false
            }
            if (!areArgumentsTheSame(oldItem, newItem) ||
                    !areResultsTheSame(oldItem, newItem)
            ) {
                return false
            }
            return true
        }

        /**
         * Checks if the arguments associated with the commands are the same. This includes checking
         * by the primary keys as well as by the contents of the arguments.
         * If the arrays of the arguments have different length, or if one list is null while the other is not,
         * the consider the arguments different.
         */
        private fun areArgumentsTheSame(
            oldItem: Command,
            newItem: Command
        ): Boolean {
            if (oldItem.arguments == null) {
                return newItem.arguments == null
            }
            if (newItem.arguments == null) {
                return false
            }
            oldItem.arguments?.let { oldArgs ->
                newItem.arguments?.let { newArgs ->
                    if (oldArgs.size != newArgs.size) {
                        return false
                    }
                    for (i in 0 until oldArgs.size) {
                        val oldArg = oldArgs[i]
                        val newArg = newArgs[i]
                        if (!Argument.areItemsTheSame(oldArg, newArg) ||
                            !Argument.areContentsTheSame(oldArg, newArg)) {
                            return false
                        }
                    }
                }
            }
            return true
        }

        /**
         * Checks if the results of command executions are the same. This includes the check down to the
         * text form of the response from the Bot's server.
         * TODO: Design a more deep verification: by attachments, by received suggestions etc.
         */
        private fun areResultsTheSame(
            oldItem: Command,
            newItem: Command
        ): Boolean {
            if (oldItem.result == null) {
                return newItem.result == null
            }
            if (newItem.result == null) {
                return false
            }
            oldItem.result?.let { oldResult ->
                newItem.result?.let { newResult ->
                    if (oldResult.commandResult == null) {
                        return newResult.commandResult == null
                    }
                    if (newResult.commandResult == null) {
                        return false
                    }
                    oldResult.commandResult?.let { oldCommandResult ->
                        newResult.commandResult?.let { newCommandResult ->
                            return oldCommandResult.resultText == newCommandResult.resultText
                        }
                    }
                }
            }
            return true
        }
    }
}