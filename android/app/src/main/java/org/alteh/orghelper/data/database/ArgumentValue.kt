/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.data.database

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.ForeignKey.CASCADE
import org.alteh.orghelper.data.database.Account.Companion.areItemsTheSame
import java.io.Serializable

/**
 * Represents an argument [value] for a given user (identified by [accountId]) in the given [source] platform
 * (like Discord) in the given organization ([orgId]), the given module ([moduleId]),
 * the given command ([commandId]) and argument [argumentId].
 */
@Entity(primaryKeys = ["source", "accountId", "orgId", "moduleId", "commandId", "argumentId"],
        foreignKeys = [ForeignKey(
            entity = Argument::class,
            parentColumns = ["source", "accountId", "orgId", "moduleId", "commandId", "id"],
            childColumns = ["source", "accountId", "orgId", "moduleId", "commandId", "argumentId"],
            onDelete = CASCADE,
            deferred = true
        )]
)
data class ArgumentValue (
    var source: String = "",
    var accountId: String = "",
    var orgId: String = "",
    var moduleId: String = "",
    var commandId: String = "",
    var argumentId: String = "",
    var value: String? = null,
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
            oldItem: ArgumentValue?,
            newItem: ArgumentValue?
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
                    oldItem.argumentId == newItem.argumentId
        }

        /**
         * Checks if contents of the given entities are the same, leaving the primary keys aside.
         * Besides the DB-related checks this is also needed for the adapters to determine
         * which rows need to be rebound.
         * The primary keys still may be different, so to check whether two entities are completely the
         * same both this function and [areItemsTheSame] need to be invoked.
         */
        fun areContentsTheSame(
            oldItem: ArgumentValue,
            newItem: ArgumentValue
        ): Boolean {
            return oldItem.value == newItem.value
        }
    }
}