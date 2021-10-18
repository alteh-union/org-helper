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
import org.alteh.orghelper.viewmodel.AccountsViewModel

import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.activityViewModels
import androidx.recyclerview.widget.*

import androidx.recyclerview.widget.RecyclerView.ViewHolder
import com.google.android.material.floatingactionbutton.FloatingActionButton

import com.google.android.material.progressindicator.LinearProgressIndicator
import com.squareup.picasso.Picasso
import dagger.hilt.android.AndroidEntryPoint
import org.alteh.orghelper.MainActivity
import org.alteh.orghelper.OrgHelperApplication.Companion.LOG_TAG
import org.alteh.orghelper.data.AccountWithState

/**
 * Shows the list of available [org.alteh.orghelper.data.database.Account] entities.
 * Allows to select one of them to make it active (and proceed further to commands)
 * or to delete them from the app's DB (not from the source platform, of course).
 */
@AndroidEntryPoint
class AccountsFragment : Fragment() {

    private val model: AccountsViewModel by activityViewModels()
    private var recyclerView: RecyclerView? = null

    /**
     * Handles the event of the fragment's view creation.
     */
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        Log.d(LOG_TAG, "${AccountsFragment::class.java.simpleName} onCreateView")

        val view = inflater.inflate(R.layout.fragment_recycler_base, container, false)

        val progressBar = view.findViewById<LinearProgressIndicator>(R.id.progressBar)

        val progressObserver = Observer<Boolean> { newProgress ->
            run {
                progressBar?.visibility = if (newProgress) View.VISIBLE else View.GONE
            }
        }

        model.inProgress.observe(viewLifecycleOwner, progressObserver)

        val adapter = AccountListAdapter(activity as MainActivity, AccountListAdapter.AccountDiff())

        recyclerView = view.findViewById(R.id.recycler_view)
        recyclerView?.adapter = adapter

        val accountObserver = Observer<List<AccountWithState>> { newAccounts ->
            run {
                adapter.submitList(newAccounts)
            }
        }

        model.accountsWithState.observe(viewLifecycleOwner, accountObserver)

        val fab = view.findViewById<FloatingActionButton>(R.id.fab)
        fab.visibility = View.VISIBLE
        fab.setOnClickListener {
            (activity as MainActivity).onNewAccountRequested()
        }

        return view
    }

    /**
     * Binds a view of the [RecyclerView] with an [AccountWithState] of [AccountListAdapter],
     * sets the UI up according to the item's content.
     */
    class AccountViewHolder private constructor(itemView: View) :
        ViewHolder(itemView) {

        private val sourceView: ImageView = itemView.findViewById(R.id.accountSourceImage)
        private val usernameView: TextView = itemView.findViewById(R.id.accountName)
        private val avatarView: ImageView = itemView.findViewById(R.id.accountAvatarImage)
        private val activeView: ImageView = itemView.findViewById(R.id.accountActive)
        private val activeLabelView: TextView = itemView.findViewById(R.id.accountActiveLabel)
        private val loggedOutView: TextView = itemView.findViewById(R.id.accountNotLoggedLabel)
        private val deleteView: ImageView = itemView.findViewById(R.id.accountDelete)

        /**
         * Binds the item data to the view, sets up the UI accordingly.
         */
        fun bind(source: String?, username: String?, avatar: String?, active: Boolean, loggedIn: Boolean) {
            if (avatar != null) {
                sourceView.visibility = View.VISIBLE
                Picasso.get().load(avatar).into(avatarView)
                avatarView.setColorFilter(android.R.color.black)
            } else {
                sourceView.visibility = View.GONE
                avatarView.setImageResource(R.drawable.ic_discord)
                avatarView.colorFilter = null
            }
            loggedOutView.visibility = if (loggedIn) View.GONE else View.VISIBLE
            usernameView.text = username
            if (active && loggedIn) {
                activeView.visibility = View.VISIBLE
                activeLabelView.visibility = View.VISIBLE
            } else {
                activeView.visibility = View.GONE
                activeLabelView.visibility = View.GONE
            }
            deleteView.setOnClickListener {
                bindingAdapter?.let {
                    (it as AccountListAdapter).onDeleteClick(absoluteAdapterPosition)
                }
            }
            val selectListener = View.OnClickListener {
                bindingAdapter?.let {
                    (it as AccountListAdapter).onClick(absoluteAdapterPosition)
                }
            }
            activeView.setOnClickListener(selectListener)
            activeLabelView.setOnClickListener(selectListener)
            sourceView.setOnClickListener(selectListener)
            avatarView.setOnClickListener(selectListener)
            usernameView.setOnClickListener(selectListener)
            loggedOutView.setOnClickListener(selectListener)
        }

        companion object {
            /**
             * A factory function to create a view holder based on an inflated view of the [RecyclerView]
             */
            fun create(parent: ViewGroup): AccountViewHolder {
                val view: View = LayoutInflater.from(parent.context)
                    .inflate(R.layout.list_item_account, parent, false)
                return AccountViewHolder(view)
            }
        }
    }

    /**
     * An adapter for [RecyclerView] which binds [Account] entities with the UI.
     */
    class AccountListAdapter(_activity: MainActivity, diffCallback: DiffUtil.ItemCallback<AccountWithState>) :
        ListAdapter<AccountWithState, AccountViewHolder?>(diffCallback) {

        val activity = _activity

        /**
         * Creates a view holder along with the view itself, by a request from the system.
         */
        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): AccountViewHolder {
            return AccountViewHolder.create(parent)
        }

        /**
         * Binds a data item with the view according to a request from the system.
         */
        override fun onBindViewHolder(holder: AccountViewHolder, position: Int) {
            val current: AccountWithState? = getItem(position)
            current?.let {
                holder.bind(it.source, it.username, it.avatar, it.active, it.loggedIn)
            }
        }

        /**
         * An util class for the adapter which allows to check if the item identifiers are the same
         * and if the content of the items (besides their identifiers) are the same.
         */
        internal class AccountDiff : DiffUtil.ItemCallback<AccountWithState>() {
            /**
             * Checks if the item identifiers are the same.
             */
            override fun areItemsTheSame(
                oldItem: AccountWithState,
                newItem: AccountWithState
            ): Boolean {
                return oldItem.source == newItem.source &&
                        oldItem.id == newItem.id
            }

            /**
             * Checks if the item contents are the same (besides the identifiers).
             */
            override fun areContentsTheSame(
                oldItem: AccountWithState,
                newItem: AccountWithState
            ): Boolean {
                return oldItem.username == newItem.username &&
                        oldItem.avatar == newItem.avatar &&
                        oldItem.active == newItem.active &&
                        oldItem.loggedIn == newItem.loggedIn
            }
        }

        /**
         * Handles a click on the delete button from one of the [RecyclerView] views.
         * Asks the user for confirmation, and if granted then deletes the account from the DB.
         */
        fun onDeleteClick(position: Int) {
            getItem(position)?.let { acc ->
                val builder = AlertDialog.Builder(activity)
                builder.apply {
                    setTitle(R.string.account_delete_confirmation_title)
                    setMessage(R.string.account_delete_confirmation_message)
                    setPositiveButton(android.R.string.ok) { _, _ ->
                        activity.deleteAccount(acc.source, acc.id)
                    }
                    setNegativeButton(android.R.string.cancel, null)
                }
                builder.create().show()
            }
        }

        /**
         * Handles a click on one of the [RecyclerView] views.
         * If the account is not logged in, then tries to log it in.
         * If the account is not active, then sets it as active.
         * Otherwise just switches the navigation to the main root.
         */
        fun onClick(position: Int) {
            getItem(position)?.let {
                if (!it.loggedIn) {
                    activity.discordLogin()
                } else if (it.active) {
                    activity.switchToMainNavigation()
                } else {
                    activity.setActiveAccount(it.source, it.id)
                }
            }
        }
    }
}