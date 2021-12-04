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
import org.alteh.orghelper.data.ValueSuggestion
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
    var nameAcronym: String? = null,
    /**
     * TODO: Make the list of commands source-wide, because they should not change
     * from org to org. Most probably, that will require creating a new "Source"
     * table in the DB, which the list of commands will belong to.
     */
    @SerializedName("suggestionCommands")
    var suggestionCommands: MutableList<String>? = null,

    /**
     * TODO: Some suggestions (like the list of timezones) can be source-wide or
     * even global. Need to bind such suggestions to respective classes accordingly.
     */
    @Ignore
    var suggestions: MutableMap<String, List<ValueSuggestion>> = mutableMapOf()
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
            if (oldItem.icon != newItem.icon ||
                    oldItem.name != newItem.name ||
                    oldItem.nameAcronym != newItem.nameAcronym) {
                return false
            }

            if (!areSuggestionCommandsTheSame(oldItem, newItem) ||
                !areSuggestionsTheSame(oldItem, newItem)
            ) {
                return false
            }
            return true
        }

        /**
         * Checks if the suggestion commands associated with the org are the same.
         * If the arrays of the commands have different length, or if one list is null while the other is not,
         * then consider the command lists different.
         */
        private fun areSuggestionCommandsTheSame(
            oldItem: Org,
            newItem: Org
        ): Boolean {
            if (oldItem.suggestionCommands == null) {
                return newItem.suggestionCommands == null
            }
            if (newItem.suggestionCommands == null) {
                return false
            }
            oldItem.suggestionCommands?.let { oldCommands ->
                newItem.suggestionCommands?.let { newCommands ->
                    if (oldCommands.size != newCommands.size) {
                        return false
                    }
                    for (i in 0 until oldCommands.size) {
                        if (oldCommands[i] != newCommands[i]) {
                            return false
                        }
                    }
                }
            }
            return true
        }

        /**
         * Checks if the fetched suggestions of the org are the same.
         * If the arrays of the suggestions have different length, then consider the lists different.
         */
        private fun areSuggestionsTheSame(
            oldItem: Org,
            newItem: Org
        ): Boolean {
            if (oldItem.suggestions.size != newItem.suggestions.size) {
                return false
            }
            for (i in oldItem.suggestions.keys) {
                if (newItem.suggestions[i] == null) {
                    return false
                }
                if (Argument.areSuggestionsTheSame(oldItem.suggestions[i]!!,
                        newItem.suggestions[i]!!)) {
                    return false
                }
            }
            return true
        }
    }
}