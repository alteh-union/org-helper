/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.data

import com.google.gson.annotations.SerializedName
import java.io.Serializable

/**
 * Represents a bundle of parameters needed to request the Bot's server to execute some command.
 * [commandId] if the non-translatable name of the command (its id).
 * [orgId] identifies the organization, for which the command needs to be executed.
 * [payload] is the set of the command's arguments with their ids and values entered by the user.
 * Module id is not required here, because the command ids are unique source-wide.
 * This object is sent to the Bot's server, so make sure the [SerializedName]s match to what is expected by the server.
 */
class CommandExecutionBundle (
    @SerializedName("command")
    var commandId: String = "",
    @SerializedName("orgId")
    var orgId: String = "",
    @SerializedName("payload")
    var payload: Map<String, String>? = null
) : Serializable