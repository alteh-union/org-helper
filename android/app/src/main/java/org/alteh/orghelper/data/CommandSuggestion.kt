/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.data

import com.google.gson.annotations.SerializedName
import java.io.Serializable

/**
 * Represents a suggestion from the server as a proposed input for a given command's argument.
 * [id] is what will be actually sent to the server with a command request.
 * [description] is what will be shown to the user.
 * This object is received via a web-response from the Bot's server.
 * Ensure that the [SerializedName] matches to what the server sends.
 */
class CommandSuggestion (
    @SerializedName("id")
    var id: String = "",
    @SerializedName("description")
    var description: String = ""
) : Serializable