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
import androidx.fragment.app.Fragment
import androidx.lifecycle.Observer
import org.alteh.orghelper.R

import android.widget.TextView
import androidx.activity.OnBackPressedCallback
import androidx.fragment.app.activityViewModels

import androidx.recyclerview.widget.RecyclerView
import androidx.recyclerview.widget.RecyclerView.ViewHolder

import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import dagger.hilt.android.AndroidEntryPoint
import org.alteh.orghelper.data.database.Org
import org.alteh.orghelper.viewmodel.OrgsViewModel
import androidx.recyclerview.widget.GridLayoutManager
import com.google.android.material.progressindicator.LinearProgressIndicator
import com.squareup.picasso.Picasso
import org.alteh.orghelper.MainActivity
import org.alteh.orghelper.OrgHelperApplication.Companion.LOG_TAG

/**
 * Shows the list of [Org] entities available for the given account.
 * Allows to select one of them to proceed further.
 */
@AndroidEntryPoint
class OrgsFragment : Fragment() {

    private val orgsModel: OrgsViewModel by activityViewModels()

    private var recyclerView: RecyclerView? = null
    private var emptyListPlaceholder: TextView? = null

    /**
     * Handles the event of the fragment's view creation.
     */
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        Log.d(LOG_TAG, "${OrgsFragment::class.java.simpleName} onCreateView")

        val view = inflater.inflate(R.layout.fragment_recycler_base, container, false)

        val progressBar = view.findViewById<LinearProgressIndicator>(R.id.progressBar)

        val progressObserver = Observer<Boolean> { newProgress ->
            run {
                progressBar?.visibility = if (newProgress) View.VISIBLE else View.GONE
            }
        }

        orgsModel.inProgress.observe(viewLifecycleOwner, progressObserver)

        val adapter = OrgListAdapter(activity as MainActivity, OrgListAdapter.OrgDiff())

        recyclerView = view.findViewById(R.id.recycler_view)
        recyclerView?.adapter = adapter
        recyclerView?.layoutManager = GridLayoutManager(activity, 2)

        emptyListPlaceholder = view.findViewById(R.id.emptyListPlaceholder)

        val orgObserver = Observer<List<Org>> { newOrgs ->
            run {
                adapter.submitList(newOrgs)
                emptyListPlaceholder?.visibility = if (newOrgs == null || newOrgs.isEmpty())
                        View.VISIBLE else View.GONE
            }
        }

        orgsModel.orgs.observe(viewLifecycleOwner, orgObserver)

        orgsModel.requestOrgs()

        requireActivity().onBackPressedDispatcher.addCallback(viewLifecycleOwner,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    (activity as MainActivity).goToAccounts()
                }
            })

        return view
    }

    /**
     * Binds a view of the [RecyclerView] with an [Org] of [OrgListAdapter],
     * sets the UI up according to the item's content.
     */
    class OrgViewHolder private constructor(itemView: View) :
        ViewHolder(itemView) {

        private val nameView: TextView = itemView.findViewById(R.id.orgName)
        private val iconView: ImageView = itemView.findViewById(R.id.orgImage)
        private val acronymView: TextView = itemView.findViewById(R.id.orgAcronym)
        private val acronymBackgroundView: ImageView = itemView.findViewById(R.id.orgAcronymBackground)

        /**
         * Binds the item data to the view, sets up the UI accordingly.
         */
        fun bind(source: String?, name: String?, icon: String?, nameAcronym: String?) {
            nameView.text = name

            if (icon == null || icon.isEmpty()) {
                acronymBackgroundView.visibility = View.VISIBLE
                acronymView.visibility = View.VISIBLE
                iconView.visibility = View.GONE
                if (nameAcronym != null && nameAcronym.isNotEmpty()) {
                    acronymView.text = nameAcronym
                }
                acronymBackgroundView.setOnClickListener {
                    bindingAdapter?.let {
                        (it as OrgListAdapter).onClick(absoluteAdapterPosition)
                    }
                }
            } else {
                acronymBackgroundView.visibility = View.GONE
                acronymView.visibility = View.GONE
                iconView.visibility = View.VISIBLE
                Picasso.get().load(icon).into(iconView)
                iconView.setOnClickListener {
                    bindingAdapter?.let {
                        (it as OrgListAdapter).onClick(absoluteAdapterPosition)
                    }
                }
            }
        }

        companion object {
            /**
             * A factory function to create a view holder based on an inflated view of the [RecyclerView]
             */
            fun create(parent: ViewGroup): OrgViewHolder {
                val view: View = LayoutInflater.from(parent.context)
                    .inflate(R.layout.grid_item_org, parent, false)
                return OrgViewHolder(view)
            }
        }
    }

    /**
     * An adapter for [RecyclerView] which binds [Org] entities with the UI.
     */
    class OrgListAdapter(_activity: MainActivity, diffCallback: DiffUtil.ItemCallback<Org>) :
        ListAdapter<Org, OrgViewHolder?>(diffCallback) {

        val activity = _activity

        /**
         * Creates a view holder along with the view itself, by a request from the system.
         */
        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): OrgViewHolder {
            return OrgViewHolder.create(parent)
        }

        /**
         * Binds a data item with the view according to a request from the system.
         */
        override fun onBindViewHolder(holder: OrgViewHolder, position: Int) {
            val current: Org? = getItem(position)
            current?.let {
                holder.bind(it.source, it.name, it.icon, it.nameAcronym)
            }
        }

        /**
         * An util class for the adapter which allows to check if the item identifiers are the same
         * and if the content of the items (besides their identifiers) are the same.
         * Here we just rely on the corresponding functions in the data classes themselves,
         * as we use those functions for other purposes too.
         */
        internal class OrgDiff : DiffUtil.ItemCallback<Org>() {
            /**
             * Checks if the item identifiers are the same. Relies on the corresponding function
             * in the data class itself.
             */
            override fun areItemsTheSame(
                oldItem: Org,
                newItem: Org
            ): Boolean {
                return Org.areItemsTheSame(oldItem, newItem)
            }

            /**
             * Checks if the item contents are the same (besides the identifiers).
             * Relies on the corresponding function in the data class itself.
             */
            override fun areContentsTheSame(
                oldItem: Org,
                newItem: Org
            ): Boolean {
                return Org.areContentsTheSame(oldItem, newItem)
            }
        }

        /**
         * Handles a click on one of the [RecyclerView] views.
         * Sets the selected organization as active.
         */
        fun onClick(position: Int) {
            getItem(position)?.let {
                activity.setActiveOrg(it.id)
            }
        }
    }
}