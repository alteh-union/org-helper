/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.data

import org.alteh.orghelper.data.database.Account
import org.alteh.orghelper.data.database.Module
import org.alteh.orghelper.data.database.Org
import java.io.Serializable

/**
 * Represents the selected organization, account and module altogether, so we can easily use the
 * [androidx.lifecycle.switchMap] of related [androidx.lifecycle.LiveData] with only this one object.
 */
class ModuleOfOrg (
    val module: Module,
    val org: Org,
    val account: Account
) : Serializable