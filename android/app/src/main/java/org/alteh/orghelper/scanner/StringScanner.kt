/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.scanner

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.AutoCompleteTextView
import android.widget.EditText
import android.widget.FrameLayout
import androidx.core.widget.addTextChangedListener
import org.alteh.orghelper.R
import org.alteh.orghelper.data.database.Argument
import org.alteh.orghelper.fragment.CommandsFragment

/**
 * Builds UI for argument's input and converts UI elements and structures into text value,
 * based on the types of the arguments.
 */
class StringScanner : Scanner() {

    /**
     * Inflates and sets up UI for the [argument] input.
     */
    override fun addArgumentInput(fragment: CommandsFragment, argView: FrameLayout, argument: Argument) {
        val inputView: View = LayoutInflater.from(fragment.activity)
            .inflate(R.layout.argument_input_string, argView, false)
        inputView.layoutParams = ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        )
        argView.addView(inputView)

        val autoCompleteTextView = inputView.findViewById<AutoCompleteTextView>(R.id.argumentInput)

        argument.lastValue?.let { value ->
            autoCompleteTextView.setText(value.value)
        }

        autoCompleteTextView.addTextChangedListener { editable ->
            fragment.commandsModel.updateArgumentValue(
                argument, editable.toString())
            argument.lastValue?.value = editable.toString()
        }

        val adapter = SuggestionAdapter(fragment.requireActivity(), R.layout.suggestion,
            argument.suggestions)

        autoCompleteTextView.threshold = 0
        autoCompleteTextView.setAdapter(adapter)

        autoCompleteTextView.setOnItemClickListener { _, _, i, _ ->
            autoCompleteTextView.setText(autoCompleteTextView.adapter.getItem(i).toString())
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
        return argView.findViewById<EditText>(R.id.argumentInput).text.toString()
    }
}