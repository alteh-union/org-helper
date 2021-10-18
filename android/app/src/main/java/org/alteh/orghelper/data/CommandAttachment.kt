/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.data

import com.google.gson.annotations.SerializedName
import java.io.Serializable

/**
 * Represents an attachment sent to/from the Bot's server via a web-interface.
 * Ensure that the [SerializedName]s match to what the server sends/expects to receive.
 */
class CommandAttachment (
    @SerializedName("attachment")
    var attachmentObject: String? = null,
    @SerializedName("mimeType")
    var mimeType: String = ""
) : Serializable