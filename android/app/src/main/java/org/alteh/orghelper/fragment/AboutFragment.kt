/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.fragment

import android.os.Build
import android.os.Bundle
import android.text.Html
import android.text.method.LinkMovementMethod
import android.text.util.Linkify
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.activity.OnBackPressedCallback
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import dagger.hilt.android.AndroidEntryPoint
import org.alteh.orghelper.BuildConfig
import org.alteh.orghelper.OrgHelperApplication.Companion.LOG_TAG
import org.alteh.orghelper.R
import org.alteh.orghelper.viewmodel.NavigationViewModel

/**
 * A simple "About" fragment with a very basic info about the app.
 */
@AndroidEntryPoint
class AboutFragment : Fragment() {

    private val navigationModel: NavigationViewModel by activityViewModels()

    /**
     * Handles the event of the fragment's view creation.
     */
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        Log.d(LOG_TAG, "${AboutFragment::class.java.simpleName} onCreateView")

        val view = inflater.inflate(R.layout.fragment_about, container, false)

        val appNameTextView = view.findViewById<TextView>(R.id.aboutApplicationName)
        val buildVersionTextView = view.findViewById<TextView>(R.id.aboutBuildVersion)
        val buildTimeTextView = view.findViewById<TextView>(R.id.aboutBuildTime)
        val websiteTextView = view.findViewById<TextView>(R.id.aboutWebsite)

        appNameTextView.text = resources.getString(R.string.about_application_name,
            BuildConfig.APP_NAME_UNTRANSLATED)
        buildVersionTextView.text = resources.getString(R.string.about_build_version,
            BuildConfig.BUILD_VERSION)
        buildTimeTextView.text = resources.getString(R.string.about_build_time,
            BuildConfig.BUILD_TIME)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            websiteTextView.text = resources.getString(R.string.about_website,
                Html.fromHtml(BuildConfig.WEBSITE_ADDRESS, Html.FROM_HTML_MODE_COMPACT))
        } else {
            websiteTextView.text = resources.getString(R.string.about_website,
                Html.fromHtml(BuildConfig.WEBSITE_ADDRESS))
        }
        Linkify.addLinks(websiteTextView, Linkify.ALL)
        websiteTextView.movementMethod = LinkMovementMethod.getInstance()

        requireActivity().onBackPressedDispatcher.addCallback(viewLifecycleOwner,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    navigationModel.setNavigationRoot(NavigationViewModel.NavigationRoot.MAIN)
                }
            })

        return view
    }
}