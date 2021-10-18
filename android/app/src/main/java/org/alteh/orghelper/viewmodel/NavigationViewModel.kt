/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.viewmodel

import androidx.lifecycle.*
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject

/**
 * A [ViewModel] which tracks the navigation of the user across the screens and notifies subscribers
 * about that.
 * Not linked to any DB table, so the navigation progress may be lost in case if the app is killed.
 * However, most of the navigation states are defined by the current settings
 * (see [org.alteh.orghelper.data.database.Setting]), so typically the only navigation states that
 * will be lost are the states of some secondary screens like the "About" screen (linked to a
 * different navigation root than the main root).
 * This is done intentionally, because we don't want the user to return back to that secondary, unimportant screens
 * on relaunching the app after a day since the last usage, for example.
 * The class which needs to observe the navigation root must observe the [navigationRoot] object.
 * Exact paths from the selected root are not tracked by this model (can be tracked
 * by [org.alteh.orghelper.viewmodel.SettingsViewModel], for example).
 */
@HiltViewModel
class NavigationViewModel @Inject
    internal constructor(private val savedStateHandle: SavedStateHandle)
 : ViewModel() {

    /**
     * A [LiveData] object which allows to observe the current navigation root (but not the full
     * path from the root).
     */
    val navigationRoot: MutableLiveData<NavigationRoot> = MutableLiveData(
        savedStateHandle.get(NAVIGATION_ROOT_SAVED_STATE_KEY) ?: NavigationRoot.MAIN
    )

    /**
     * Sets [navigationRoot] and saves it to the [savedStateHandle]
     */
    fun setNavigationRoot(_navigationRoot: NavigationRoot) {
        if (_navigationRoot != navigationRoot.value) {
            navigationRoot.postValue(_navigationRoot)
            savedStateHandle.set(NAVIGATION_ROOT_SAVED_STATE_KEY, _navigationRoot)
        }
    }

    /**
     * Defines the possible navigation roots. The main root is where the user can issue org commands to the server.
     */
    enum class NavigationRoot {
        MAIN,
        ACCOUNTS,
        NEW_ACCOUNT,
        ABOUT
    }

    companion object {
        private const val NAVIGATION_ROOT_SAVED_STATE_KEY = "NAVIGATION_ROOT_SAVED_STATE_KEY"
    }
}