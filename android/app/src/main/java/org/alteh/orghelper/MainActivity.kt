/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.view.Menu
import android.view.MenuItem
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.Observer

import dagger.hilt.android.AndroidEntryPoint
import org.alteh.orghelper.OrgHelperApplication.Companion.LOG_TAG
import org.alteh.orghelper.Utils.Companion.tryCast
import org.alteh.orghelper.data.*
import org.alteh.orghelper.data.database.Account
import org.alteh.orghelper.data.database.Module
import org.alteh.orghelper.data.database.Org
import org.alteh.orghelper.data.database.Setting
import org.alteh.orghelper.fragment.*
import org.alteh.orghelper.repository.SettingRepository.Companion.ACTIVE_ACCOUNT_SETTING
import org.alteh.orghelper.repository.SettingRepository.Companion.ACTIVE_ORG_SETTING
import org.alteh.orghelper.repository.SettingRepository.Companion.ACTIVE_MODULE_SETTING
import org.alteh.orghelper.repository.SettingRepository.Companion.ACTIVE_SOURCE_SETTING
import org.alteh.orghelper.viewmodel.*
import org.alteh.orghelper.viewmodel.NavigationViewModel.NavigationRoot
import retrofit2.HttpException
import java.net.URLEncoder

/**
 * The main activity, handles most of the screens, including account management, working
 * with commands etc. Also keeps references to all view models to avoid creating
 * them multiple times for each fragment.
 */
@AndroidEntryPoint
class MainActivity : AppCompatActivity() {

    private val navigationModel: NavigationViewModel by viewModels()
    private val settingsModel: SettingsViewModel by viewModels()
    private val accountsModel: AccountsViewModel by viewModels()
    private val orgsModel: OrgsViewModel by viewModels()
    private val modulesModel: ModulesViewModel by viewModels()
    private val commandsModel: CommandsViewModel by viewModels()

    private var navigatorView: TextView? = null

    private var settingsLoaded = false
    private var accountsLoaded = false
    private var currentNavigationRoot = NavigationRoot.MAIN
    private val navigationList: MutableList<NavigationPart> = mutableListOf()
    private var currentAccounts: List<Account>? = null

    /**
     * Handles the event of activity creation from Android.
     * In particular, set the content view and sets the data observers up.
     * The settings observer is launched prior to all other, and
     * the accounts observer is launched right after the settings arrive.
     * This is to avoid too many fragment selections while the most basic
     * data (settings and accounts) is not ready yet.
     * [savedInstanceState] is not used, because we rely on the view models.
     */
    @SuppressLint("ClickableViewAccessibility")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        setSupportActionBar(findViewById(R.id.myToolbar))

        Log.d(LOG_TAG, "${MainActivity::class.java.simpleName} onCreate")

        val data: Uri? = intent?.data
        if (data != null) {
            addNewAccount(data)
        }

        navigatorView = findViewById(R.id.mainNavigator)
        navigatorView?.setOnTouchListener { view, motionEvent ->
            val layout = (view as TextView).layout
            if (layout != null) {
                val line = layout.getLineForVertical(motionEvent.y.toInt())
                val charOffset = layout.getOffsetForHorizontal(line, motionEvent.x)
                for (navigationPart in navigationList) {
                    if (navigationPart.beginPos <= charOffset &&
                        navigationPart.endPos >= charOffset) {
                        navigationPart.action?.invoke()
                        break
                    }
                }
            }
            return@setOnTouchListener true
        }


        val navigationObserver = Observer<NavigationRoot> { newRoot ->
            run {
                if (newRoot != null) {
                    currentNavigationRoot = newRoot
                    onDataChanged()
                }
            }
        }

        val orgObserver = Observer<List<Org>> { newOrgs ->
            run {
                if (newOrgs != null) {
                    onDataChanged()
                }
            }
        }

        val moduleObserver = Observer<List<Module>> { newModules ->
            run {
                if (newModules != null) {
                    onDataChanged()
                }
            }
        }

        val commandObserver = Observer<List<ArgumentOfModule>> { newCommands ->
            run {
                if (newCommands != null) {
                    onDataChanged()
                }
            }
        }

        val accountObserver = Observer<List<Account>> { newAccounts ->
            run {
                if (newAccounts != null) {
                    if (currentNavigationRoot == NavigationRoot.NEW_ACCOUNT) {
                        if (newAccounts.size == 1) {
                            navigationModel.setNavigationRoot(NavigationRoot.MAIN)
                        } else {
                            navigationModel.setNavigationRoot(NavigationRoot.ACCOUNTS)
                        }
                    }

                    currentAccounts = newAccounts
                    if (!accountsLoaded) {
                        accountsLoaded = true
                        orgsModel.orgs.observe(this, orgObserver)
                        modulesModel.modules.observe(this, moduleObserver)
                        commandsModel.commandsWithArgs.observe(this, commandObserver)
                        navigationModel.navigationRoot.observe(this, navigationObserver)
                    }
                }
                onDataChanged()
            }
        }

        val settingObserver = Observer<List<Setting>> {
            run {
                if (!settingsLoaded) {
                    settingsLoaded = true

                    accountsModel.accounts.observe(this, accountObserver)
                } else {
                    if (currentNavigationRoot == NavigationRoot.ACCOUNTS) {
                        navigationModel.setNavigationRoot(NavigationRoot.MAIN)
                    }

                    onDataChanged()
                }
            }
        }

        settingsModel.settings.observe(this, settingObserver)

        val errorObserver = Observer<Exception?> { newError ->
            run {
                if (newError != null && newError is HttpException && newError.code() == 401) {
                    Toast.makeText(this, R.string.logged_out, Toast.LENGTH_LONG).show()
                    onServerLogout()
                }
            }
        }

        orgsModel.progressError.observe(this, errorObserver)
        modulesModel.progressError.observe(this, errorObserver)
        commandsModel.progressError.observe(this, errorObserver)
    }

    /**
     * Handles the event of the option menu creation from Android.
     * The [menu] is inflated based on the corresponding menu resource.
     */
    override fun onCreateOptionsMenu(menu: Menu) : Boolean {
        menuInflater.inflate(R.menu.main_menu, menu)

        return super.onCreateOptionsMenu(menu)
    }

    /**
     * Handles the event of a particular menu item selection.
     */
    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_about -> {
                navigationModel.setNavigationRoot(NavigationRoot.ABOUT)
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }

    /**
     * Launches the system dialog for asking the user to grant a specific permission to the application.
     * For now the are no specific actions to perform on the callback. Later that may change.
     */
    private val requestPermissionLauncher =
        registerForActivityResult(
            ActivityResultContracts.RequestPermission()
        ) { isGranted: Boolean ->
            if (isGranted) {
                Log.d(LOG_TAG, "${MainActivity::class.java.simpleName} permission granted")
            } else {
                Log.d(LOG_TAG, "${MainActivity::class.java.simpleName} permission denied")
            }
        }

    /**
     * Checks if a specific [permission] is granted to the app according to the Android dev guidelines.
     * That is, firstly checks if the permission is already granted. If yes - runs the [block] of code.
     * If no - asks the system if a rationale should be shown to the user to explain why he/she
     * may want to grant the permission. If the rationale should be shown - displays an appropriate
     * dialog. If no rationale is needed or if the user agrees with it, then requests
     * the Android system to show the system dialog to actually grant the permission via
     * [requestPermissionLauncher].
     * TODO: Find a way to execute the [block] in case if the permission is granted after request.
     */
    fun checkPermissions(permission: String, block: () -> Unit) {
        Log.d(LOG_TAG, "${MainActivity::class.java.simpleName} checking permission $permission")
        when {
            ContextCompat.checkSelfPermission(
                this,
                permission
            ) == PackageManager.PERMISSION_GRANTED -> {
                block.invoke()
            }
            shouldShowRequestPermissionRationale(permission) -> {
                val builder = AlertDialog.Builder(this)
                builder.apply {
                    setTitle(R.string.request_permission_title)
                    when (permission) {
                        Manifest.permission.WRITE_EXTERNAL_STORAGE ->
                            setMessage(R.string.request_write_storage_permission_message)
                    }
                    setPositiveButton(android.R.string.ok) { _, _ ->
                        requestPermissionLauncher.launch(permission)
                    }
                    setNegativeButton(android.R.string.cancel, null)
                }
                builder.create().show()
            } else -> {
                requestPermissionLauncher.launch(permission)
            }
        }
    }

    /**
     * Request the navigation model to switch to the main navigation route.
     * The UI will react on this using the navigation observer.
     */
    fun switchToMainNavigation() {
        navigationModel.setNavigationRoot(NavigationRoot.MAIN)
    }

    /**
     * Changes the settings related to the active account. If both the requested [source] and account [id]
     * are not null, then writes those value to the DB. If not, then clears the settings.
     * The UI will react on this using the settings observer.
     */
    fun setActiveAccount(source: String?, id: String?) {
        if (source == null || id == null) {
            settingsModel.delete(ACTIVE_SOURCE_SETTING)
            settingsModel.delete(ACTIVE_ACCOUNT_SETTING)
        } else {
            settingsModel.insert(Setting(ACTIVE_SOURCE_SETTING, "$source"))
            settingsModel.insert(Setting(ACTIVE_ACCOUNT_SETTING, "$id"))
        }
    }

    /**
     * Changes the setting related to the active org (by its [id]).
     * The UI will react on this using the settings observer.
     */
    fun setActiveOrg(id: String?) {
        if (id == null) {
            settingsModel.delete(ACTIVE_ORG_SETTING)
        } else {
            settingsModel.insert(Setting(ACTIVE_ORG_SETTING, "$id"))
        }
    }

    /**
     * Changes the setting related to the active module (by its [id]).
     * The UI will react on this using the settings observer.
     */
    fun setActiveModule(id: String?) {
        if (id == null) {
            settingsModel.delete(ACTIVE_MODULE_SETTING)
        } else {
            settingsModel.insert(Setting(ACTIVE_MODULE_SETTING, "$id"))
        }
    }

    /**
     * Deletes an account from the DB by its [source] and [id].
     * Also removes the settings related to the active selection, if the account to be deleted is the active one.
     */
    fun deleteAccount(source: String, id: String) {
        val activeAccountSetting = settingsModel.getActiveAccount()
        if (activeAccountSetting?.source == source && activeAccountSetting.id == id) {
            deleteActiveSettings()
        }
        accountsModel.delete(source, id)
    }

    /**
     * Sets the navigation to the route which allows to login into a new account.
     * The UI will react on this using the navigation observer.
     */
    fun onNewAccountRequested() {
        navigationModel.setNavigationRoot(NavigationRoot.NEW_ACCOUNT)
    }

    /**
     * Sets the navigation to the route which allows to view the accounts.
     * The UI will react on this using the navigation observer.
     */
    fun goToAccounts() {
        navigationModel.setNavigationRoot(NavigationRoot.ACCOUNTS)
    }

    /**
     * Starts the pipeline of logging in into Discord and authorizing the app to work with the account.
     * The redirect URI used here must match to one of intent filters in the AndroidManifest,
     * otherwise the app will not receive a callback after successful login and authorization
     * by the source server.
     */
    fun discordLogin() {
        val buffer = StringBuffer("https://discord.com/api/oauth2/authorize")
        buffer.append("?client_id=" + URLEncoder.encode(BuildConfig.DISCORD_CLIENT_ID, "UTF-8"))
        buffer.append(
            "&redirect_uri=" + URLEncoder.encode(
                "${BuildConfig.WEBSITE_ADDRESS}/orghelper/oauth/discord",
                "UTF-8"
            )
        )
        buffer.append("&response_type=code&scope=identify")

        val browserIntent =
            Intent(Intent.ACTION_VIEW, Uri.parse(buffer.toString()))
        this.startActivity(browserIntent)
    }

    /**
     * Handles the event of the account being logged out on the server side.
     * Typically that happens due to the token expiration.
     * Marks the currently active account as "logged out" in the DB
     * and cleans the settings related to the active selection.
     */
    private fun onServerLogout() {
        Log.d(LOG_TAG, "User logged out according to the server info")
        val activeAccountSetting = settingsModel.getActiveAccount()
        if (activeAccountSetting != null) {
            accountsModel.onLogout(activeAccountSetting.source, activeAccountSetting.id)
        }
        deleteActiveSettings()
    }

    /**
     * Cleans the settings related to the current active selection (source, account, org, module).
     * This affects the navigation using the settings observer and the navigation observer and forces
     * the UI to be forwarded to the Accounts fragment or to a login fragment (if no accounts are left in the DB).
     */
    private fun deleteActiveSettings() {
        settingsModel.delete(ACTIVE_SOURCE_SETTING)
        settingsModel.delete(ACTIVE_ACCOUNT_SETTING)
        settingsModel.delete(ACTIVE_ORG_SETTING)
        settingsModel.delete(ACTIVE_MODULE_SETTING)
    }

    /**
     * Handles the event of data change from one of the view models for the navigation purpose.
     * resets the current navigation sequence and starts building it from scratch, depending on the data.
     */
    private fun onDataChanged() {
        navigationList.clear()
        when (currentNavigationRoot) {
            NavigationRoot.ACCOUNTS -> onDataChangedForAccountsNavigation()
            NavigationRoot.NEW_ACCOUNT -> onDataChangedForNewAccountNavigation()
            NavigationRoot.ABOUT -> onDataChangedForAboutNavigation()
            else -> onDataChangedForMainNavigation()
        }
    }

    /**
     * Selects a fragment from the main navigation route, depending of the users' selection sequence and
     * available entities (account, org, module). Builds the navigation sequence for as far as possible
     * (until either there is no selection in the settings or a corresponding selected entity is missing from the DB)
     * according to the general scheme: source -> account -> org -> module.
     */
    private fun onDataChangedForMainNavigation() {
        if (currentAccounts != null) {
            currentAccounts?.let {
                if (it.isEmpty()) {
                    navigationModel.setNavigationRoot(NavigationRoot.NEW_ACCOUNT)
                    return
                }
            }
        } else {
            navigationModel.setNavigationRoot(NavigationRoot.NEW_ACCOUNT)
            return
        }

        val activeAccountSetting = settingsModel.getActiveAccount()
        val activeOrgSetting = settingsModel.getActiveOrg()
        val activeModuleSetting = settingsModel.getActiveModule()
        if (activeAccountSetting == null) {
            navigationModel.setNavigationRoot(NavigationRoot.ACCOUNTS)
            return
        }

        val activeAccount = accountsModel.getAccount(
            activeAccountSetting.source, activeAccountSetting.id)
        val activeSource = settingsModel.getActiveSource()
        if (activeSource == null || activeAccount == null) {
            navigationModel.setNavigationRoot(NavigationRoot.ACCOUNTS)
            return
        }

        appendNavigationPath(Utils.capitalizeFirstLetter(activeSource)) {
            navigationModel.setNavigationRoot(NavigationRoot.ACCOUNTS)
        }
        appendNavigationPath(activeAccount.username) {
            setActiveOrg(null)
            setActiveModule(null)
        }
        if (!orgsModel.hasActiveAccount()) {
            orgsModel.setActiveAccount(activeAccount)
            return
        }

        orgsModel.setActiveAccount(activeAccount)
        if (activeOrgSetting == null) {
            launchFragment(OrgsFragment::class.java)
            return
        }

        val activeOrg = orgsModel.getOrg(
                activeAccountSetting.source, activeAccountSetting.id, activeOrgSetting)
        if (activeOrg == null) {
            launchFragment(OrgsFragment::class.java)
            return
        }

        appendNavigationPath(activeOrg.name ?: activeOrg.id) {
            setActiveModule(null)
        }
        if (!modulesModel.hasActiveOrg()) {
            modulesModel.setActiveOrg(OrgOfAccount(activeOrg, activeAccount))
            return
        }

        modulesModel.setActiveOrg(OrgOfAccount(activeOrg, activeAccount))
        if (activeModuleSetting == null) {
            launchFragment(ModulesFragment::class.java)
            return
        }

        val activeModule = modulesModel.getModule(
                activeAccountSetting.source, activeAccountSetting.id, activeOrgSetting, activeModuleSetting)
        if (activeModule == null) {
            launchFragment(ModulesFragment::class.java)
            return
        }

        appendNavigationPath(activeModule.name, null)
        commandsModel.setActiveModule(ModuleOfOrg(activeModule, activeOrg, activeAccount))
        launchFragment(CommandsFragment::class.java)
    }

    /**
     * Starts a fragment from the accounts navigation route.
     */
    private fun onDataChangedForAccountsNavigation() {
        appendNavigationPath(getString(R.string.navigation_accounts), null)
        launchFragment(AccountsFragment::class.java)
    }

    /**
     * Starts a fragment from the new account (login) navigation route.
     */
    private fun onDataChangedForNewAccountNavigation() {
        appendNavigationPath(getString(R.string.add_account), null)
        launchFragment(SourceSelectionFragment::class.java)
    }

    /**
     * Starts a fragment from the "about" navigation route.
     */
    private fun onDataChangedForAboutNavigation() {
        appendNavigationPath(getString(R.string.navigation_about), null)
        launchFragment(AboutFragment::class.java)
    }

    /**
     * Launches a fragment corresponding to the provided [fragmentClass]
     */
    private fun launchFragment(fragmentClass: Class<*>) {
        updateNavigator()
        val currentFragment = supportFragmentManager.findFragmentById(R.id.mainFragment)
        if (currentFragment == null || currentFragment::class.java != fragmentClass) {
            fragmentClass.tryCast<Class<Fragment>> {
                supportFragmentManager.beginTransaction()
                    .setReorderingAllowed(true)
                    .replace(R.id.mainFragment, this, null)
                    .commit()
            }
        }
    }

    /**
     * Appends a [pathPart] to the navigation sequence. This includes the string, which will represent the part
     * in the UI for the user, the position of the string in the overall navigation text, and
     * the [action] to be performed if the user clicks on the part in the [navigatorView].
     */
    private fun appendNavigationPath(pathPart: String, action: (() -> Unit)?) {
        var totalLength = 0
        val dividerString = getString(R.string.navigation_divider)
        val dividerLength = dividerString.length
        for (navigationPart in navigationList) {
            totalLength += navigationPart.text.length + dividerLength
        }

        navigationList.add(NavigationPart(pathPart, totalLength, totalLength + pathPart.length, action))
    }

    /**
     * Updates the [navigatorView] based on the current [navigationList]. Builds the result string and assigns
     * it to the view. Also, the view will react on touches in the corresponding parts of the text,
     * if actions were supplied by the [navigationList]. The click listener is set in the [onCreate] function.
     */
    private fun updateNavigator() {
        val sb = StringBuilder()
        val dividerString = getString(R.string.navigation_divider)
        for (navigationPart in navigationList) {
            sb.append(navigationPart.text).append(dividerString)
        }
        if (sb.length >= dividerString.length) {
            sb.delete(sb.length - dividerString.length, sb.length)
        }

        navigatorView?.text = sb.toString()
    }

    /**
     * Adds a new account to the Bot's server as well as to the local DB after the user was authenticated
     * by the source server (e.g. Discord) and granted access to the application there.
     * The account is formed based of the received [data]: the last segment of the Uri is considered
     * to be the source name (according to the redirect_uri provided by the app), and the code
     * from the query parameters is the temporary "password" for the app to get further user details
     * from the source server. Later this code will be exchanged in the Bot's server for the security
     * token, and the app will work with that security token only.
     */
    private fun addNewAccount(data: Uri?) {
        val code = data?.getQueryParameter("code")

        accountsModel.requestLogin(data?.pathSegments?.last()!!, code!!)
    }

    /**
     * Represents a navigation part in the [navigationList]. Includes the position in the overall navigation
     * string, the text of the part itself, and the action which will be executed when the user clicks on
     * the part in the [navigatorView].
     */
    private class NavigationPart(
        val text: String,
        val beginPos: Int,
        val endPos: Int,
        val action: (() -> Unit)?
    )
}