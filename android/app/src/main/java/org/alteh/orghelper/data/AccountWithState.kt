/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.data

/**
 * Represents an account entity together with the info about its active/inactive state
 * which is stored in another table - [org.alteh.orghelper.data.database.Setting].
 * A convenience class used for adapters which show the account list along with it states.
 */
class AccountWithState (
    var source: String = "",
    var id: String = "",
    var username: String = "",
    var avatar: String? = null,
    var active: Boolean = false,
    var loggedIn: Boolean = true
)