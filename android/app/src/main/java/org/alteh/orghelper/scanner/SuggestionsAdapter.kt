/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.scanner

import android.app.Activity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.BaseAdapter
import android.widget.Filter
import android.widget.Filterable
import android.widget.TextView
import org.alteh.orghelper.R
import org.alteh.orghelper.data.ValueSuggestion
import java.util.*

/**
 * Adapts the list suggestions to UI, so the user can pick one for the argument input.
 * Supports filtering by a substring matching either the id of the suggestion or its description.
 */
class SuggestionAdapter(val activity: Activity, val layoutId: Int, val suggestions: List<ValueSuggestion>) :
    BaseAdapter(), Filterable {

    var filteredSuggestions = suggestions

    private val filter = SuggestionsFilter(this)

    /**
     * Gets the count of suggestions matching the filter.
     */
    override fun getCount(): Int {
        return filteredSuggestions.size
    }

    /**
     * Gets the suggestion matching the filter at a given [position].
     */
    override fun getItem(position: Int): Any {
        return filteredSuggestions[position].id
    }

    /**
     * Gets the item identifier at a given [position].
     */
    override fun getItemId(position: Int): Long {
        return position.toLong()
    }

    /**
     * Inflates a view representing a single suggestion.
     */
    override fun getView(position: Int, convertView: View?, parent: ViewGroup?): View? {
        val row: View?
        val inflater = LayoutInflater.from(activity)
        row = convertView ?: inflater.inflate(R.layout.suggestion, parent, false)

        val suggestion = filteredSuggestions[position]

        val id = row!!.findViewById<TextView>(R.id.suggestionId)
        id.text = suggestion.id

        val description = row.findViewById<TextView>(R.id.suggestionDescription)
        description.text = suggestion.description

        return row
    }

    /**
     * Gets the filter for the suggestions.
     */
    override fun getFilter(): Filter {
        return filter
    }

    /**
     * Utility class to filter suggestions by a substring.
     * Either identifier's or description's substring should match the filter string.
     */
    private class SuggestionsFilter(val adapter: SuggestionAdapter) : Filter() {

        /**
         * Makes filter results based on the given string [requestedConstraint]
         */
        override fun performFiltering(requestedConstraint: CharSequence?): FilterResults {
            var constraint = requestedConstraint
            if (constraint == null) {
                constraint = ""
            }

            val filterString = constraint.toString().lowercase(Locale.getDefault())
            val results = FilterResults()

            val count = adapter.suggestions.size
            val filteredList: MutableList<ValueSuggestion> = mutableListOf()
            var filterableString: String
            for (i in 0 until count) {
                filterableString = adapter.suggestions[i].id
                if (filterableString.lowercase(Locale.getDefault()).contains(filterString)) {
                    filteredList.add(adapter.suggestions[i])
                } else {
                    filterableString = adapter.suggestions[i].description
                    if (filterableString.lowercase(Locale.getDefault()).contains(filterString)) {
                        filteredList.add(adapter.suggestions[i])
                    }
                }
            }

            results.values = filteredList
            results.count = filteredList.size
            return results
        }

        /**
         * Commands the adapter to update the view based on the newly filtered [results].
         */
        override fun publishResults(constraint: CharSequence?, results: FilterResults) {
            adapter.filteredSuggestions = results.values as List<ValueSuggestion>? ?: listOf()
            adapter.notifyDataSetChanged()
        }
    }
}