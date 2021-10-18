/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.data

import org.alteh.orghelper.data.database.Account
import org.alteh.orghelper.data.database.Org
import java.io.Serializable

/**
 * Represents both the selected organization and account, so we can easily use the
 * [androidx.lifecycle.switchMap] of related [androidx.lifecycle.LiveData] with only this one object.
 */
class OrgOfAccount (
    val org: Org,
    val account: Account
) : Serializable