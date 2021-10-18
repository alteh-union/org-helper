/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import org.alteh.orghelper.dao.*
import org.alteh.orghelper.data.database.*

/**
 * Represents the database of the application. The instance of the app as well as its Daos can be injected
 * to other classes using Hilt (see [org.alteh.orghelper.di.DatabaseModule]).
 *
 * The main hierarchy of entities is the following:
 * [Account] -> [Org] -> [Module] -> [Command] -> [Argument] - [ArgumentValue]
 *
 * Where "->" means a one-to-many relation and "-" means a one-to-one relation.
 */
@Database(entities = [
    Setting::class,
    Account::class,
    Org::class,
    Module::class,
    Command::class,
    Argument::class,
    ArgumentValue::class],
    version = 1, exportSchema = false)
abstract class OrgHelperDatabase : RoomDatabase() {
    abstract val settingDao: SettingDao
    abstract val accountDao: AccountDao
    abstract val orgDao: OrgDao
    abstract val moduleDao: ModuleDao
    abstract val commandDao: CommandDao
    abstract val argumentDao: ArgumentDao
    abstract val argumentValueDao: ArgumentValueDao

    companion object {
        @Volatile
        private var INSTANCE: OrgHelperDatabase? = null

        /**
         * Returns the singleton instance of the app. Creates one if it's not created yet.
         */
        fun getInstance(context: Context): OrgHelperDatabase {
            synchronized(this) {
                var instance = INSTANCE

                if (instance == null) {
                    instance = Room.databaseBuilder(
                        context.applicationContext,
                        OrgHelperDatabase::class.java,
                        OrgHelperDatabase::class.java.simpleName
                    )
                        .fallbackToDestructiveMigration()
                        .build()
                    INSTANCE = instance
                }
                return instance
            }
        }
    }
}