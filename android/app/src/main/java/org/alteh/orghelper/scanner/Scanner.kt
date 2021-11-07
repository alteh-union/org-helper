/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.scanner

import android.widget.FrameLayout
import org.alteh.orghelper.data.database.Argument
import org.alteh.orghelper.fragment.CommandsFragment

/**
 * Builds UI for argument's input and converts UI elements and structures into text value,
 * based on the types of the arguments.
 * TODO: to add support of more detailed parameters of the arguments, like is they argument is required or not.
 */
abstract class Scanner {

    /**
     * Inflates and sets up UI for the [argument] input.
     */
    abstract fun addArgumentInput(fragment: CommandsFragment, argView: FrameLayout, argument: Argument)

    /**
     * Collects inputted values from UI ([argView]) and converts it to a text value,
     * which can be sent to the Bot's server.
     */
    abstract fun getTextValue(argView: FrameLayout): String

    companion object {
        /**
         * Represents the overall type of the scanner (the particular behavior can be adjusted by
         * other argument parameters).
         */
        enum class ScannerType(val scannerType: String) {
            StringType("string"),
            ArrayType("array"),
            BooleanType("boolean"),
            TimeType("time"),
            ObjectType("object")
        }

        /**
         * Gets the scanner class by [scannerType].
         */
        fun getScannerByType(scannerType: String?): Scanner {
            return when (scannerType) {
                ScannerType.StringType.scannerType -> StringScanner()
                ScannerType.ArrayType.scannerType -> ArrayScanner()
                ScannerType.BooleanType.scannerType -> BooleanScanner()
                ScannerType.TimeType.scannerType -> TimeScanner()
                ScannerType.ObjectType.scannerType -> ObjectScanner()
                else -> StringScanner()
            }
        }
    }
}