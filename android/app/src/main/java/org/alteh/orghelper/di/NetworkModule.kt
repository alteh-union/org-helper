/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.di

import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import org.alteh.orghelper.MainNetwork
import org.alteh.orghelper.NetworkInterface
import org.alteh.orghelper.dao.ArgumentValueDao
import javax.inject.Singleton

/**
 * A hilt module which provides the singleton instance of Retrofit
 * to classes which request them in their constructors (by using the [javax.inject.Inject] annotation)
 */
@InstallIn(SingletonComponent::class)
@Module
class NetworkModule {
    /**
     * Provides an instance of [NetworkInterface]. Use a constructor with the [javax.inject.Inject] annotation
     * to get access to the result of this function.
     */
    @Singleton
    @Provides
    fun provideNetworkService(): NetworkInterface {
        return MainNetwork.getInstance()
    }
}