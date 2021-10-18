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
import androidx.recyclerview.widget.GridLayoutManager
import com.google.android.material.progressindicator.LinearProgressIndicator
import org.alteh.orghelper.MainActivity
import org.alteh.orghelper.OrgHelperApplication.Companion.LOG_TAG
import org.alteh.orghelper.data.database.Module
import org.alteh.orghelper.viewmodel.ModulesViewModel

/**
 * Shows the list of [Module] entities available for the given account's organization.
 * Allows to select one of them to proceed further.
 */
@AndroidEntryPoint
class ModulesFragment : Fragment() {

    private val modulesModel: ModulesViewModel by activityViewModels()

    private var recyclerView: RecyclerView? = null

    /**
     * Handles the event of the fragment's view creation.
     */
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        Log.d(LOG_TAG, "${ModulesFragment::class.java.simpleName} onCreateView")

        val view = inflater.inflate(R.layout.fragment_recycler_base, container, false)

        val progressBar = view.findViewById<LinearProgressIndicator>(R.id.progressBar)

        val progressObserver = Observer<Boolean> { newProgress ->
            run {
                progressBar?.visibility = if (newProgress) View.VISIBLE else View.GONE
            }
        }

        modulesModel.inProgress.observe(viewLifecycleOwner, progressObserver)

        val adapter = ModuleListAdapter(activity as MainActivity, ModuleListAdapter.ModuleDiff())

        recyclerView = view.findViewById(R.id.recycler_view)
        recyclerView?.adapter = adapter
        recyclerView?.layoutManager = GridLayoutManager(activity, 2)

        val moduleObserver = Observer<List<Module>> { newModules ->
            run {
                adapter.submitList(newModules)
            }
        }

        modulesModel.modules.observe(viewLifecycleOwner, moduleObserver)

        modulesModel.requestModules()

        requireActivity().onBackPressedDispatcher.addCallback(viewLifecycleOwner,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    (activity as MainActivity).setActiveOrg(null)
                }
            })

        return view
    }

    /**
     * Binds a view of the [RecyclerView] with an [Module] of [ModuleListAdapter],
     * sets the UI up according to the item's content.
     */
    class ModuleViewHolder private constructor(itemView: View) :
        ViewHolder(itemView) {

        private val nameView: TextView = itemView.findViewById(R.id.moduleName)
        private val iconView: ImageView = itemView.findViewById(R.id.moduleImage)

        /**
         * Binds the item data to the view, sets up the UI accordingly.
         */
        fun bind(source: String?, name: String?, icon: String?) {
            nameView.text = name
            iconView.setOnClickListener {
                bindingAdapter?.let {
                    (it as ModuleListAdapter).onClick(absoluteAdapterPosition)
                }
            }
        }

        companion object {
            /**
             * A factory function to create a view holder based on an inflated view of the [RecyclerView]
             */
            fun create(parent: ViewGroup): ModuleViewHolder {
                val view: View = LayoutInflater.from(parent.context)
                    .inflate(R.layout.grid_item_module, parent, false)
                return ModuleViewHolder(view)
            }
        }
    }

    /**
     * An adapter for [RecyclerView] which binds [Module] entities with the UI.
     */
    class ModuleListAdapter(_activity: MainActivity, diffCallback: DiffUtil.ItemCallback<Module>) :
        ListAdapter<Module, ModuleViewHolder?>(diffCallback) {

        val activity = _activity

        /**
         * Creates a view holder along with the view itself, by a request from the system.
         */
        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ModuleViewHolder {
            return ModuleViewHolder.create(parent)
        }

        /**
         * Binds a data item with the view according to a request from the system.
         */
        override fun onBindViewHolder(holder: ModuleViewHolder, position: Int) {
            val current: Module? = getItem(position)
            current?.let {
                holder.bind(it.source, it.name, it.icon)
            }
        }

        /**
         * An util class for the adapter which allows to check if the item identifiers are the same
         * and if the content of the items (besides their identifiers) are the same.
         * Here we just rely on the corresponding functions in the data classes themselves,
         * as we use those functions for other purposes too.
         */
        internal class ModuleDiff : DiffUtil.ItemCallback<Module>() {
            /**
             * Checks if the item identifiers are the same. Relies on the corresponding function
             * in the data class itself.
             */
            override fun areItemsTheSame(
                oldItem: Module,
                newItem: Module
            ): Boolean {
                return Module.areItemsTheSame(oldItem, newItem)
            }

            /**
             * Checks if the item contents are the same (besides the identifiers).
             * Relies on the corresponding function in the data class itself.
             */
            override fun areContentsTheSame(
                oldItem: Module,
                newItem: Module
            ): Boolean {
                return Module.areContentsTheSame(oldItem, newItem)
            }
        }

        /**
         * Handles a click on one of the [RecyclerView] views.
         * Sets the selected module as active.
         */
        fun onClick(position: Int) {
            getItem(position)?.let {
                activity.setActiveModule(it.id)
            }
        }
    }
}