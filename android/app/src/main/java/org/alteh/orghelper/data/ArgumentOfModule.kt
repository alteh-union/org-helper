/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.data

/**
 * Represents the argument along with the info of the related command.
 * A convenience class which allows to read both commands and arguments from the DB at once.
 * The receiver is then expected to group the arguments by the corresponding commands.
 */
class ArgumentOfModule (
    var source: String = "",
    var accountId: String = "",
    var orgId: String = "",
    var moduleId: String = "",
    var id: String = "",
    var name: String = "",
    var help: String? = null,
    var argId: String? = "",
    var argName: String? = "",
    var scannerType: String? = "",
    var suggestionsCommand: String? = "",
    var argHelp: String? = null
)