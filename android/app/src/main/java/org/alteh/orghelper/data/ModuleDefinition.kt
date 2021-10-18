/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.data

import com.google.gson.annotations.SerializedName
import org.alteh.orghelper.data.database.Command

/**
 * Represents the definition of a module of commands. Particularly - the full list of available
 * commands along with their argument definitions.
 * The server may also send additional info (like id, display name etc.) here, but we omit
 * it, because we already know that information from previous web-requests.
 * This object is received via a web-response from the Bot's server.
 * Ensure that the [SerializedName] matches to what the server sends.
 */
class ModuleDefinition {
    @SerializedName("commands")
    var commands: MutableList<Command>? = null
}