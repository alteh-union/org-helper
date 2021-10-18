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
 * Represents an organization for a given user (identified by [accountId]) in the given [source] platform
 * (like Discord). Organizations with the same [id] (orgId) but associated with different accounts are
 * considered *different* organizations for the purposes of the application, to avoid the complications
 * of maintaining the many-to-many relations. Besides, the user is not expected to have *that* many accounts
 * in the same source platform to make a problem due to duplicated data.
 * The [nameAcronym] is used to represent the icon if the icon image itself is not available.
 * The [icon] should be a link to a web-located image.
 */
@Entity(primaryKeys = ["source", "accountId", "id"],
        foreignKeys = [ForeignKey(
            entity = Account::class,
            parentColumns = ["source", "id"],
            childColumns = ["source", "accountId"],
            onDelete = CASCADE,
            deferred = true
        )]
)
data class Org (
    @SerializedName("source")
    var source: String = "",
    @SerializedName("accountId")
    var accountId: String = "",
    @SerializedName("id")
    var id: String = "",
    @SerializedName("icon")
    var icon: String? = null,
    @SerializedName("name")
    var name: String? = null,
    @SerializedName("nameAcronym")
    var nameAcronym: String? = null
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
            oldItem: Org?,
            newItem: Org?
        ): Boolean {
            if (oldItem == null) {
                return newItem == null
            }
            if (newItem == null) {
                return false
            }
            return oldItem.source == newItem.source &&
                    oldItem.accountId == newItem.accountId &&
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
            oldItem: Org,
            newItem: Org
        ): Boolean {
            return oldItem.icon == newItem.icon &&
                    oldItem.name == newItem.name &&
                    oldItem.nameAcronym == newItem.nameAcronym
        }
    }
}