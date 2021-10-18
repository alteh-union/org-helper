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
import org.alteh.orghelper.data.database.Account.Companion.areItemsTheSame
import java.io.Serializable

/**
 * Represents a command argument for a given user (identified by [accountId]) in the given [source] platform
 * (like Discord) in the given organization ([orgId]), the given module ([moduleId])
 * and the given command ([commandId]). Arguments with the same [id] (argumentId) but associated with
 * different accounts OR organizations OR commands are considered *different* arguments for the purposes
 * of the application, to avoid the complications of maintaining the many-to-many relations.
 * Also, in case of the arguments, arguments with the same id but from different commands may have different
 * scanner types, help string etc.
 * Besides, the user is not expected to have *that* many accounts
 * in the same source platform to make a problem due to duplicated data.
 */
@Entity(primaryKeys = ["source", "accountId", "orgId", "moduleId", "commandId", "id"],
        foreignKeys = [ForeignKey(
            entity = Command::class,
            parentColumns = ["source", "accountId", "orgId", "moduleId", "id"],
            childColumns = ["source", "accountId", "orgId", "moduleId", "commandId"],
            onDelete = CASCADE,
            deferred = true
        )]
)
data class Argument (
    @SerializedName("source")
    var source: String = "",
    @SerializedName("accountId")
    var accountId: String = "",
    @SerializedName("orgId")
    var orgId: String = "",
    @SerializedName("moduleId")
    var moduleId: String = "",
    @SerializedName("commandId")
    var commandId: String = "",
    @SerializedName("name")
    var id: String = "",
    @SerializedName("displayName")
    var name: String = "",
    @SerializedName("scannerType")
    var scannerType: String? = "",
    @SerializedName("help")
    var help: String? = null,
    @Ignore
    @SerializedName("lastValue")
    var lastValue: ArgumentValue? = null
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
            oldItem: Argument?,
            newItem: Argument?
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
                    oldItem.commandId == newItem.commandId &&
                    oldItem.id == newItem.id
        }

        /**
         * Checks if contents of the given entities are the same, leaving the primary keys aside.
         * Besides the DB-related checks this is also needed for the adapters to determine
         * which rows need to be rebound.
         * The primary keys still may be different, so to check whether two entities are completely the
         * same both this function and [areItemsTheSame] need to be invoked.
         * Includes the check of associated child
         * [org.alteh.orghelper.data.database.ArgumentValue]'s as they belong to the content of the commands.
         */
        fun areContentsTheSame(
            oldItem: Argument,
            newItem: Argument
        ): Boolean {
            if (oldItem.lastValue == null) {
                return newItem.lastValue == null
            }
            if (newItem.lastValue == null) {
                return false
            }
            oldItem.lastValue?.let { oldValue ->
                newItem.lastValue?.let { newValue ->
                    return oldItem.name == newItem.name && oldItem.scannerType == newItem.scannerType &&
                            oldItem.help == newItem.help && oldValue.value == newValue.value
                }
            }
            return true
        }
    }
}