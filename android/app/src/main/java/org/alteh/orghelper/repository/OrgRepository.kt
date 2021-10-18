/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.repository

import android.util.Log
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.switchMap
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.alteh.orghelper.MainNetwork
import org.alteh.orghelper.NetworkInterface
import org.alteh.orghelper.OrgHelperApplication.Companion.LOG_TAG
import org.alteh.orghelper.dao.*
import org.alteh.orghelper.data.database.Account
import org.alteh.orghelper.data.database.Org
import java.lang.NullPointerException
import javax.inject.Inject

import javax.inject.Singleton

/**
 * A repository for handling [Org] objects. Asynchronously manages the orgs both in the Bot's server
 * and in the database. UI elements should access this data not directly, but via corresponding view models,
 * e.g. [org.alteh.orghelper.viewmodel.OrgsViewModel], because the view models provide a proper
 * coroutine scope which allows to run long operations in the background.
 */
@Singleton
class OrgRepository @Inject constructor(private val network: NetworkInterface,
                                        private val orgDao: OrgDao
) {

    private val orgs: LiveData<List<Org>> = orgDao.getAllOrgs()

    /**
     * Asynchronously fetches the orgs from the Bot's server where both the account and the Bot are present.
     * Then updates the [Org] table accordingly.
     */
    suspend fun requestOrgs(activeAccount: Account) {

        val result = network.getOrgs(MainNetwork.getBearerHeader(activeAccount.token!!),
            activeAccount.source)

        if (result?.orgs == null) {
            val e = NullPointerException("Null result for requestOrgs")
            Log.e(LOG_TAG, "${OrgRepository::class.java.simpleName} requestOrgs failed", e)
            throw e
        }

        val resultOrgs = result.orgs!!

        withContext(Dispatchers.Default) {
            for (org in resultOrgs) {
                org.source = activeAccount.source
                org.accountId = activeAccount.id
            }
        }

        orgDao.reloadForAccount(activeAccount.source, activeAccount.id, resultOrgs)
    }

    /**
     * Gets a [LiveData] object representing the list of orgs related to the given account.
     */
    fun getOrgsByAccount(source: String, accountId: String): LiveData<List<Org>> {
        return orgs.switchMap {
            val filteredOrgs = MutableLiveData<List<Org>>()
            val filteredList = it.filter { org -> org.source == source && org.accountId == accountId }
            filteredOrgs.value = filteredList
            filteredOrgs
        }
    }

    /**
     * Gets an [Org] object from the repository by its identifiers.
     */
    fun getOrg(source: String, accountId: String, orgId: String): Org? {
        return orgs.value?.find { org ->
            org.source == source && org.accountId == accountId && org.id == orgId }
    }
}