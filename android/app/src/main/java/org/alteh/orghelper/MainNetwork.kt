/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import org.alteh.orghelper.OrgHelperApplication.Companion.SERVER_ADDRESS
import org.alteh.orghelper.OrgHelperApplication.Companion.SERVER_PORT
import org.alteh.orghelper.data.*
import org.alteh.orghelper.data.database.Account
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*

/**
 * The network interface for exchanging the data with the Bot's server.
 * The Retrofit lib will use this to create an actual network class.
 */
interface NetworkInterface {
    /**
     * Logins the user into the Bot's server by providing it the temporary code from the source server.
     * The [code] verifies that the user is already logged into the [source] server (like Discord) and
     * granted necessary permissions to the app. The Bot's server will use this code to get the info
     * about the user from the source server, make a JWT token and return it back to the application
     * along with some other useful info (like the user name, the avatar etc.) to represent it in the UI.
     * Later the user will be authenticated by the JWT token only, until it expires.
     * The [redirectUri] should match the original redirect URI used in the first login request to the
     * source server. This is for security reasons - otherwise the source server may reject further communication.
     */
    @GET("auth/{source}/jwt")
    suspend fun login(
        @Path("source") source: String,
        @Query("code") code: String,
        @Query("redirect_uri") redirectUri: String)
            : Account?

    /**
     * Gets the list organizations for the user identified by his/her [bearerToken] (made via JWT)
     * in the given [source] platform (like Discord).
     */
    @GET("/orgs/{source}/get-orgs")
    suspend fun getOrgs(
        @Header("Authorization") bearerToken: String,
        @Path("source") source: String)
            : AccountOrgs?

    /**
     * Gets the list command modules for the user identified by his/her [bearerToken] (made via JWT)
     * in the given [source] platform (like Discord) and in the given organization identified by its [orgId].
     */
    @GET("/modules/{source}/get-modules")
    suspend fun getModules(
        @Header("Authorization") bearerToken: String,
        @Path("source") source: String,
        @Query("orgId") orgId: String)
            : OrgModules?

    /**
     * Gets the full definitions of a command module along with info about commands and their arguments.
     * The module is identified by the user id (represented by the [bearerToken],
     * the given [source] platform (like Discord), the given [orgId] (representing the organization)
     * and the given module name [moduleId].
     */
    @GET("/modules/{source}/get-module")
    suspend fun getCommands(
        @Header("Authorization") bearerToken: String,
        @Path("source") source: String,
        @Query("orgId") orgId: String,
        @Query("moduleId") moduleId: String)
            : ModuleContainer?

    /**
     * Requests the Bot server to execute a command for the user identified by his/her [bearerToken] (made via JWT)
     * in the given [source] platform (like Discord). The command object should contain all the necessary info
     * (see [CommandExecutionBundle] for details), e.g. the command and organization identifier, and
     * the argument values, if needed.
     */
    @POST("/commands/{source}/execute-command")
    suspend fun executeCommand(
        @Header("Authorization") bearerToken: String,
        @Path("source") source: String,
        @Body command: CommandExecutionBundle)
            : ExecutionResult?

    /**
     * Requests the Bot server to execute a special command to get suggestions about input for a command's
     * argument. The usage is similar to [executeCommand].
     */
    @POST("/suggestions/{source}/get-suggestions")
    suspend fun getSuggestions(
        @Header("Authorization") bearerToken: String,
        @Path("source") source: String,
        @Body command: CommandExecutionBundle)
            : ExecutionResult?
}

class MainNetwork {

    companion object {
        @Volatile
        private var INSTANCE: NetworkInterface? = null

        /**
         * Returns the singleton instance of the app. Creates one if it's not created yet.
         */
        fun getInstance(): NetworkInterface {
            synchronized(this) {
                var instance = INSTANCE

                if (instance == null) {
                    val interceptor = HttpLoggingInterceptor()
                    interceptor.setLevel(HttpLoggingInterceptor.Level.BODY)
                    val okHttpClient = OkHttpClient.Builder().addInterceptor(interceptor).build()

                    val retrofit = Retrofit.Builder()
                        .baseUrl("http://${SERVER_ADDRESS}:${SERVER_PORT}/")
                        .client(okHttpClient)
                        .addConverterFactory(GsonConverterFactory.create())
                        .build()

                    instance = retrofit.create(NetworkInterface::class.java)
                    INSTANCE = instance
                }
                return instance!!
            }
        }

        fun getBearerHeader(token: String): String {
            return "Bearer $token"
        }
    }
}