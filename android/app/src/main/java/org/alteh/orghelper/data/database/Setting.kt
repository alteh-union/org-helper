/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.data.database

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Represents a setting entity, consisting of id ([name]) and [value].
 * The settings include information on where the user is in the navigation route, so if the
 * app restarts it can rebuild the path.
 */
@Entity
data class Setting (
    @PrimaryKey
    var name: String = "",
    var value: String = ""
)