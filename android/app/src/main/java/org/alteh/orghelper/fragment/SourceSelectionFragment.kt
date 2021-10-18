/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.fragment

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import androidx.activity.OnBackPressedCallback
import androidx.fragment.app.Fragment
import dagger.hilt.android.AndroidEntryPoint
import org.alteh.orghelper.MainActivity
import org.alteh.orghelper.OrgHelperApplication.Companion.LOG_TAG
import org.alteh.orghelper.R

/**
 * A simple fragment with a hardcoded selection of the source platforms (like Discord)
 */
@AndroidEntryPoint
class SourceSelectionFragment : Fragment() {

    /**
     * Handles the event of the fragment's view creation.
     */
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        Log.d(LOG_TAG, "${SourceSelectionFragment::class.java.simpleName} onCreateView")

        val view = inflater.inflate(R.layout.fragment_source_selection, container, false)

        val discordImage = view.findViewById<ImageView>(R.id.discord_login_image)

        discordImage?.setOnClickListener {
            (activity as MainActivity).discordLogin()
        }

        requireActivity().onBackPressedDispatcher.addCallback(viewLifecycleOwner,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    (activity as MainActivity).switchToMainNavigation()
                }
            })

        return view
    }
}