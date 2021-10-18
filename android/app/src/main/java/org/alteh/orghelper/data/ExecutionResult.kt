/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.data

import com.google.gson.annotations.SerializedName
import java.io.Serializable

/**
 * Represents a command execution result received from the Bot's server.
 * TODO: add the status field here and on the server side.
 * This object is received via a web-response from the Bot's server.
 * Ensure that the [SerializedName] matches to what the server sends.
 */
class ExecutionResult (
    @SerializedName("commandResult")
    var commandResult: CommandResult? = null
) : Serializable