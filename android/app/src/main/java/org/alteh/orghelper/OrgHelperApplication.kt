/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

/**
 * Represents the application class. Hilt uses this class to inject related global singleton instances
 * to other classes which request the instances in their injection constructors.
 */
@HiltAndroidApp
class OrgHelperApplication : Application() {
    companion object {
        const val LOG_TAG = BuildConfig.APP_NAME_UNTRANSLATED
        const val SERVER_ADDRESS = BuildConfig.SERVER_ADDRESS
        const val SERVER_PORT = BuildConfig.SERVER_PORT
    }
}