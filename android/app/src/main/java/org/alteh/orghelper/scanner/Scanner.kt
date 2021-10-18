/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.scanner

/**
 * Converts the UI elements and structures into text arguments and vice versa, based on the types of the arguments.
 * TODO: to add support of more detailed parameters of the arguments, like is they argument is required or not.
 */
abstract class Scanner {

    companion object {
        /**
         * Represents the overall type of the scanner (the particular behavior can be adjusted by
         * other argument parameters).
         */
        enum class ScannerType(val scannerType: String) {
            StringType("string"),
            FullStringType("fullString"),
            ArrayType("array"),
            BooleanType("boolean"),
            TimeType("time"),
            ObjectType("object"),
            ChannelsType("channels"),
            SubjectsType("subjects"),
            MentionsType("mentions")
        }
    }
}