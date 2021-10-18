/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.repository

import android.util.Log
import androidx.lifecycle.LiveData
import org.alteh.orghelper.OrgHelperApplication.Companion.LOG_TAG
import org.alteh.orghelper.data.database.Setting
import org.alteh.orghelper.dao.SettingDao
import org.alteh.orghelper.data.database.Account
import javax.inject.Inject

import javax.inject.Singleton

/**
 * A repository for handling [Setting] objects. Asynchronously manages the settings in the database.
 * UI elements should access this data not directly, but via corresponding view models,
 * e.g. [org.alteh.orghelper.viewmodel.SettingsViewModel], because the view models provide a proper
 * coroutine scope which allows to run long operations in the background.
 */
@Singleton
class SettingRepository @Inject constructor(private val settingDao: SettingDao) {

    private val settings: LiveData<List<Setting>> = settingDao.getAllSettings()

    /**
     * Gets the active account identifiers (both source and accountId). Returns null
     * if either of the settings is not set.
     */
    fun getActiveAccount(): ActiveAccountSetting? {
        val currentSettings = settings.value
        currentSettings?.let {
            val activeSourceString = it.firstOrNull { setting -> setting.name == ACTIVE_SOURCE_SETTING }
            if (activeSourceString != null) {
                val activeAccountString = it.firstOrNull { setting -> setting.name == ACTIVE_ACCOUNT_SETTING }
                if (activeAccountString != null) {
                    return ActiveAccountSetting(activeSourceString.value, activeAccountString.value)
                }
            }
        }
        return null
    }

    /**
     * Gets the active source setting value or null if not set.
     */
    fun getActiveSource(): String? {
        val currentSettings = settings.value
        currentSettings?.let {
            val activeSourceString = it.firstOrNull { setting -> setting.name == ACTIVE_SOURCE_SETTING }
            if (activeSourceString != null) {
                return activeSourceString.value
            }
        }
        return null
    }

    /**
     * Gets the active organization settings value or null if not set.
     */
    fun getActiveOrg(): String? {
        val currentSettings = settings.value
        currentSettings?.let {
            val activeOrgString = it.firstOrNull { setting -> setting.name == ACTIVE_ORG_SETTING }
            if (activeOrgString != null) {
                return activeOrgString.value
            }
        }
        return null
    }

    /**
     * Gets the active command module settings value or null if not set.
     */
    fun getActiveModule(): String? {
        val currentSettings = settings.value
        currentSettings?.let {
            val activeModuleString = it.firstOrNull { setting -> setting.name == ACTIVE_MODULE_SETTING }
            if (activeModuleString != null) {
                return activeModuleString.value
            }
        }
        return null
    }

    /**
     * Gets the [LiveData] object to observe changes in the [Setting] table.
     */
    fun getAllSettings(): LiveData<List<Setting>> {
        return settings
    }

    /**
     * Inserts a new [Setting] to the table.
     */
    suspend fun insert(setting: Setting) {
        try {
            settingDao.insert(setting)
        } catch (e: Exception) {
            Log.e(LOG_TAG, "${SettingRepository::class.java.simpleName} failed to insert a setting", e)
        }
    }

    /**
     * Deletes the [Setting] from the table.
     */
    suspend fun delete(name: String) {
        try {
            settingDao.deleteByName(name)
        } catch (e: Exception) {
            Log.e(LOG_TAG, "${SettingRepository::class.java.simpleName} failed to delete a setting by name", e)
        }
    }

    companion object {
        const val ACTIVE_SOURCE_SETTING = "active_source"
        const val ACTIVE_ACCOUNT_SETTING = "active_account"
        const val ACTIVE_ORG_SETTING = "active_org"
        const val ACTIVE_MODULE_SETTING = "active_module"
    }

    /**
     * A convenience class to represent both the identifiers of an account - [source] and [id] (accountId)
     */
    class ActiveAccountSetting(val source: String, val id: String)
}