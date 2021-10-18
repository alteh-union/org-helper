/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.di

import android.content.Context
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import org.alteh.orghelper.OrgHelperDatabase
import org.alteh.orghelper.dao.*
import javax.inject.Singleton

/**
 * A hilt module which provides instances of the database and its DAO objects
 * to classes which request them in their constructors (by using the [javax.inject.Inject] annotation)
 */
@InstallIn(SingletonComponent::class)
@Module
class DatabaseModule {
    /**
     * Provides an instance of [OrgHelperDatabase]. Use a constructor with the [javax.inject.Inject] annotation
     * to get access to the result of this function.
     */
    @Singleton
    @Provides
    fun provideAppDatabase(@ApplicationContext context: Context): OrgHelperDatabase {
        return OrgHelperDatabase.getInstance(context)
    }

    /**
     * Provides an instance of [SettingDao]. Use a constructor with the [javax.inject.Inject] annotation
     * to get access to the result of this function.
     */
    @Provides
    fun provideSettingDao(appDatabase: OrgHelperDatabase): SettingDao {
        return appDatabase.settingDao
    }

    /**
     * Provides an instance of [AccountDao]. Use a constructor with the [javax.inject.Inject] annotation
     * to get access to the result of this function.
     */
    @Provides
    fun provideAccountDao(appDatabase: OrgHelperDatabase): AccountDao {
        return appDatabase.accountDao
    }

    /**
     * Provides an instance of [OrgDao]. Use a constructor with the [javax.inject.Inject] annotation
     * to get access to the result of this function.
     */
    @Provides
    fun provideOrgDao(appDatabase: OrgHelperDatabase): OrgDao {
        return appDatabase.orgDao
    }

    /**
     * Provides an instance of [ModuleDao]. Use a constructor with the [javax.inject.Inject] annotation
     * to get access to the result of this function.
     */
    @Provides
    fun provideModuleDao(appDatabase: OrgHelperDatabase): ModuleDao {
        return appDatabase.moduleDao
    }

    /**
     * Provides an instance of [CommandDao]. Use a constructor with the [javax.inject.Inject] annotation
     * to get access to the result of this function.
     */
    @Provides
    fun provideCommandDao(appDatabase: OrgHelperDatabase): CommandDao {
        return appDatabase.commandDao
    }

    /**
     * Provides an instance of [ArgumentDao]. Use a constructor with the [javax.inject.Inject] annotation
     * to get access to the result of this function.
     */
    @Provides
    fun provideArgumentDao(appDatabase: OrgHelperDatabase): ArgumentDao {
        return appDatabase.argumentDao
    }

    /**
     * Provides an instance of [ArgumentValueDao]. Use a constructor with the [javax.inject.Inject] annotation
     * to get access to the result of this function.
     */
    @Provides
    fun provideArgumentValueDao(appDatabase: OrgHelperDatabase): ArgumentValueDao {
        return appDatabase.argumentValueDao
    }
}