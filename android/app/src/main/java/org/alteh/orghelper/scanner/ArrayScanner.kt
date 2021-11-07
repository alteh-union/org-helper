/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.scanner

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.widget.addTextChangedListener
import org.alteh.orghelper.R
import org.alteh.orghelper.data.ValueSuggestion
import org.alteh.orghelper.data.database.Argument
import org.alteh.orghelper.fragment.CommandsFragment
import android.app.Activity
import android.util.Log
import android.view.inputmethod.EditorInfo
import android.widget.*
import com.google.android.material.chip.ChipGroup
import java.util.*
import com.google.android.material.chip.Chip
import org.alteh.orghelper.OrgHelperApplication.Companion.LOG_TAG

/**
 * Builds UI for argument's input and converts UI elements and structures into text value,
 * based on the types of the arguments.
 */
class ArrayScanner : Scanner() {

    /**
     * Inflates and sets up UI for the [argument] input.
     */
    override fun addArgumentInput(fragment: CommandsFragment, argView: FrameLayout, argument: Argument) {
        val inputView: View = LayoutInflater.from(fragment.activity)
            .inflate(R.layout.argument_input_array, argView, false)
        inputView.layoutParams = ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        )
        argView.addView(inputView)

        val autoCompleteTextView = inputView.findViewById<AutoCompleteTextView>(R.id.arrayInputTextView)

        val adapter = SuggestionAdapter(fragment.requireActivity(), R.layout.suggestion,
            argument.suggestions)

        val chipGroup = inputView.findViewById<ChipGroup>(R.id.arrayInputChipGroup)

        autoCompleteTextView.threshold = 0
        autoCompleteTextView.setAdapter(adapter)

        autoCompleteTextView.setOnItemClickListener { adapterView, view, i, l ->
            addChip(fragment, autoCompleteTextView.adapter.getItem(i).toString(), chipGroup)
            autoCompleteTextView.setText("")
        }

        autoCompleteTextView.setOnEditorActionListener { textView, actionId, keyEvent ->
            if (actionId == EditorInfo.IME_ACTION_NEXT) {
                addChip(fragment, textView.text.toString(), chipGroup)
                autoCompleteTextView.setText("")
                true
            } else {
                false
            }
        }

        autoCompleteTextView.setOnClickListener {
            (it as AutoCompleteTextView).showDropDown()
        }

        autoCompleteTextView.setOnFocusChangeListener { view, focused ->
            if (focused) (view as AutoCompleteTextView).showDropDown()
        }
    }

    /**
     * Collects inputted values from UI ([argView]) and converts it to a text value,
     * which can be sent to the Bot's server.
     */
    override fun getTextValue(argView: FrameLayout): String {
        val chipGroup = argView.findViewById<ChipGroup>(R.id.arrayInputChipGroup)

        return getAllValues(chipGroup).joinToString(separator = ARRAY_SEPARATOR)
    }

    /**
     * Adds a chip view representing a single value for the array.
     */
    private fun addChip(fragment: CommandsFragment, text: String, chipGroup: ChipGroup) {
        val currentValues = getAllValues(chipGroup)
        if (currentValues.find { value -> value == text } == null) {
            val chip = Chip(fragment.requireActivity())
            chip.text = text
            chip.isCloseIconVisible = true

            chip.setOnCloseIconClickListener {
                chipGroup.removeView(chip)
            }

            chipGroup.addView(chip)
        }
    }

    /**
     * Gets inputted values from the chips in the [chipGroup].
     */
    private fun getAllValues(chipGroup: ChipGroup): List<String> {
        val values: MutableList<String> = mutableListOf()
        for (i in 0 until chipGroup.childCount) {
            val chip: View = chipGroup.getChildAt(i)
            if (chip is Chip) {
                values.add(chip.text.toString())
            }
        }

        return values
    }

    companion object {
        const val ARRAY_SEPARATOR = ","
    }
}