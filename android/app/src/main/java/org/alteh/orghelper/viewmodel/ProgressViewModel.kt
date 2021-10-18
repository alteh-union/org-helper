/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.viewmodel

import android.util.Log
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import org.alteh.orghelper.OrgHelperApplication.Companion.LOG_TAG

/**
 * An abstract view model which has a [LiveData] indicator of some background process going on
 * (like saving to the DB or sending a network request), as well as an error indicator in case
 * an exception occurs during the process.
 * In order watch for the progress and errors the user class should observer the [inProgress]
 * and [progressError] objects, and start their background tasks using the [launchProgress] function.
 */
abstract class ProgressViewModel : ViewModel() {

    /**
     * A [LiveData] value to observe when the background process is started or stopped.
     */
    val inProgress: LiveData<Boolean>
        get() = _inProgress

    private val _inProgress = MutableLiveData(false)

    /**
     * A [LiveData] value indicating that an exception occurred as a result of the background execution.
     * Contains the exception or null, if no error happened yet or if it was reset already.
     */
    val progressError: LiveData<Exception?>
        get() = _progressError

    private val _progressError = MutableLiveData<Exception?>(null)

    /**
     * Resets the progress exception to null. For example, after the user got notified about it
     * and took necessary actions.
     */
    fun resetTheError() {
        _progressError.value = null
    }

    /**
     * Launches a [block] of code in the coroutine scope of the view model, and also updates the objects
     * indicating the progress accordingly.
     * Useful for background tasks.
     */
    protected fun launchProgress(block: suspend () -> Unit): Job {
        return viewModelScope.launch {
            _progressError.value = null
            try {
                _inProgress.value = true
                block()
            } catch (error: Exception) {
                _progressError.value = error
                Log.e(LOG_TAG, "${ProgressViewModel::class.java.simpleName} launchProgress error", error)
            } finally {
                _inProgress.value = false
            }
        }
    }
}