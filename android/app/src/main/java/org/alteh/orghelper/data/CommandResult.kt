/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.data

import com.google.gson.annotations.SerializedName
import java.io.Serializable

/**
 * Represents a result of a command execution on the Bot's server side.
 * This object is received via a web-response from the Bot's server.
 * Ensure that the [SerializedName] matches to what the server sends.
 */
class CommandResult (
    @SerializedName("text")
    var resultText: String = "",
    @SerializedName("attachments")
    var attachments: List<CommandAttachment> = listOf(),
    @SerializedName("suggestions")
    var suggestions: List<ValueSuggestion> = listOf()
) : Serializable