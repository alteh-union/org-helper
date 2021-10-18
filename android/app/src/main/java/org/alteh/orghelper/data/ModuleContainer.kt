/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.data

import com.google.gson.annotations.SerializedName

/**
 * Represents the container of the definition of a module of commands.
 * The server may also send additional info (like id, display name etc.) here, but we omit
 * it, because we already know that information from previous web-requests.
 * This object is received via a web-response from the Bot's server.
 * Ensure that the [SerializedName] matches to what the server sends.
 */
class ModuleContainer {
    @SerializedName("moduleDefinition")
    var definition: ModuleDefinition? = null
}