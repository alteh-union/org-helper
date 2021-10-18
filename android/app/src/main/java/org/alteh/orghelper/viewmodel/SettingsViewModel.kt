/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import org.alteh.orghelper.data.database.Setting
import org.alteh.orghelper.repository.SettingRepository
import javax.inject.Inject

/**
 * A [ViewModel] for working with the [Setting] table of the DB.
 * UI elements/screens which are depended on the settings must observe the [settings] object from this class.
 */
@HiltViewModel
class SettingsViewModel @Inject
    internal constructor(_settingRepository: SettingRepository)
 : ViewModel() {

    /**
     * A [LiveData] value to observe the changes in the settings table of the DB.
     */
    val settings: LiveData<List<Setting>> by lazy {
        _settingRepository.getAllSettings()
    }

    private val settingRepository: SettingRepository = _settingRepository

    /**
     * Gets the currently selected source platform (like Discord).
     */
    fun getActiveSource(): String? {
        return settingRepository.getActiveSource()
    }

    /**
     * Gets the currently selected account.
     */
    fun getActiveAccount(): SettingRepository.ActiveAccountSetting? {
        return settingRepository.getActiveAccount()
    }

    /**
     * Gets the currently selected organization.
     */
    fun getActiveOrg(): String? {
        return settingRepository.getActiveOrg()
    }

    /**
     * Gets the currently selected module.
     */
    fun getActiveModule(): String? {
        return settingRepository.getActiveModule()
    }

    /**
     * Asynchronously inserts a setting to the DB.
     */
    fun insert(setting: Setting) {
        viewModelScope.launch {
            settingRepository.insert(setting)
        }
    }

    /**
     * Asynchronously deletes a setting from the DB.
     */
    fun delete(name: String) {
        viewModelScope.launch {
            settingRepository.delete(name)
        }
    }
}