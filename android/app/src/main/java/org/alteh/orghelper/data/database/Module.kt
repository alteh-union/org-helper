/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.data.database

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.ForeignKey.CASCADE
import com.google.gson.annotations.SerializedName
import org.alteh.orghelper.data.database.Account.Companion.areItemsTheSame
import java.io.Serializable

/**
 * Represents a command module for a given user (identified by [accountId]) in the given [source] platform
 * (like Discord) in the given organization ([orgId]). Modules with the same [id] (moduleId) but associated with
 * different accounts OR organizations are considered *different* modules for the purposes of the application,
 * to avoid the complications of maintaining the many-to-many relations.
 * Besides, the user is not expected to have *that* many accounts
 * in the same source platform to make a problem due to duplicated data.
 */
@Entity(primaryKeys = ["source", "accountId", "orgId", "id"],
        foreignKeys = [ForeignKey(
            entity = Org::class,
            parentColumns = ["source", "accountId", "id"],
            childColumns = ["source", "accountId", "orgId"],
            onDelete = CASCADE,
            deferred = true
        )]
)
data class Module (
    @SerializedName("source")
    var source: String = "",
    @SerializedName("accountId")
    var accountId: String = "",
    @SerializedName("orgId")
    var orgId: String = "",
    @SerializedName("id")
    var id: String = "",
    @SerializedName("name")
    var name: String = "",
    @SerializedName("icon")
    var icon: String? = null
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
            oldItem: Module?,
            newItem: Module?
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
                    oldItem.id == newItem.id
        }

        /**
         * Checks if contents of the given entities are the same, leaving the primary keys aside.
         * Besides the DB-related checks this is also needed for the adapters to determine
         * which rows need to be rebound.
         * The primary keys still may be different, so to check whether two entities are completely the
         * same both this function and [areItemsTheSame] need to be invoked.
         */
        fun areContentsTheSame(
            oldItem: Module,
            newItem: Module
        ): Boolean {
            return oldItem.icon == newItem.icon &&
                    oldItem.name == newItem.name
        }
    }
}