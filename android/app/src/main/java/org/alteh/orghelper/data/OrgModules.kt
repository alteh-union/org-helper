/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.data

import com.google.gson.annotations.SerializedName
import org.alteh.orghelper.data.database.Module

/**
 * Represents a list of modules from a given organization.
 * This list is received via a web-response from the Bot's server.
 * Ensure that the [SerializedName] matches to what the server sends.
 */
class OrgModules {
    @SerializedName("commandModules")
    var modules: MutableList<Module>? = null
}