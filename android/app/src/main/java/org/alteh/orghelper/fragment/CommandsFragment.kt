/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper.fragment

import android.Manifest
import android.graphics.Bitmap
import android.graphics.Paint
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.view.ViewGroup.LayoutParams.WRAP_CONTENT
import android.widget.*
import androidx.fragment.app.Fragment
import org.alteh.orghelper.R

import androidx.activity.OnBackPressedCallback
import androidx.core.view.children
import androidx.fragment.app.activityViewModels
import androidx.lifecycle.Observer

import androidx.recyclerview.widget.RecyclerView.ViewHolder

import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.progressindicator.LinearProgressIndicator
import dagger.hilt.android.AndroidEntryPoint
import org.alteh.orghelper.MainActivity
import org.alteh.orghelper.Utils
import org.alteh.orghelper.data.*
import org.alteh.orghelper.viewmodel.CommandsViewModel

import android.graphics.BitmapFactory
import android.util.Base64
import androidx.core.widget.addTextChangedListener
import org.alteh.orghelper.OrgHelperApplication.Companion.LOG_TAG
import org.alteh.orghelper.data.database.Argument
import org.alteh.orghelper.data.database.ArgumentValue
import org.alteh.orghelper.data.database.Command
import org.alteh.orghelper.scanner.Scanner

/**
 * The main fragment for the user to issue [Command]s to the Bot's server.
 * Displays all the command belonging to the current active command module, along
 * with their arguments.
 * Also prefills the argument values if such values are present in the DB.
 * If a command was executed, then shows the execution result as well.
 */
@AndroidEntryPoint
class CommandsFragment : Fragment() {

    var activeModule: ModuleOfOrg? = null

    val commandsModel: CommandsViewModel by activityViewModels()

    private var recyclerView: RecyclerView? = null

    private var valuesObserver: Observer<List<ArgumentValue>>? = null
    private var latestValues: List<ArgumentValue>? = null

    /**
     * Handles the event of the fragment's view creation.
     */
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        Log.d(LOG_TAG, "${CommandsFragment::class.java.simpleName} onCreateView")

        val view = inflater.inflate(R.layout.fragment_recycler_base, container, false)

        val progressBar = view.findViewById<LinearProgressIndicator>(R.id.progressBar)

        val progressObserver = Observer<Boolean> { newProgress ->
            run {
                progressBar?.visibility = if (newProgress) View.VISIBLE else View.GONE
            }
        }

        commandsModel.inProgress.observe(viewLifecycleOwner, progressObserver)

        val adapter = CommandListAdapter(this, CommandListAdapter.CommandDiff())

        recyclerView = view.findViewById(R.id.recycler_view)
        recyclerView?.adapter = adapter

        valuesObserver = Observer<List<ArgumentValue>> { newValues ->
            latestValues = newValues
            if (newValues != null) {
                for (value in newValues) {
                    adapter.currentList.find { com -> com.id == value.commandId }?.let {
                        it.arguments?.let { args ->
                            args.find { arg -> arg.id == value.argumentId }?.let { arg ->
                                if (arg.lastValue == null) {
                                    arg.lastValue = value
                                    adapter.notifyItemChanged(adapter.currentList.indexOf(it))
                                } else {
                                    arg.lastValue?.let { av ->
                                        if (av.value != value.value) {
                                            av.value = value.value
                                            adapter.notifyItemChanged(adapter.currentList.indexOf(it))
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                valuesObserver?.let {
                    commandsModel.argumentValues.removeObserver(it)
                }

            }
        }

        val commandObserver = Observer<List<ArgumentOfModule>> { newArguments ->
            run {
                if (newArguments != null) {
                    val byCommand = newArguments.groupBy { it.id }
                    val commands = mutableListOf<Command>()
                    for (commandWithArgs in byCommand) {
                        val args = mutableListOf<Argument>()
                        for (commandArg in commandWithArgs.value) {
                            if (commandArg.argId != null) {
                                val arg = Argument(commandArg.source, commandArg.accountId,
                                    commandArg.orgId, commandArg.moduleId, commandArg.id,
                                    commandArg.argId!!, commandArg.argName!!, commandArg.scannerType,
                                    commandArg.suggestionsCommand, commandArg.argHelp)
                                latestValues?.find {
                                        value -> commandArg.argId == value.argumentId
                                }?.let { matchingValue ->
                                    arg.lastValue = ArgumentValue(arg.source, arg.accountId, arg.orgId, arg.moduleId,
                                        arg.commandId, arg.id, matchingValue.value)
                                }
                                args.add(arg)
                            }
                        }
                        commandWithArgs.value.first {
                            commands.add(
                                Command(it.source, it.accountId,
                                it.orgId, it.moduleId, it.id, it.name, it.help, args)
                            )
                        }
                    }
                    adapter.submitList(commands)

                    valuesObserver?.let {
                        commandsModel.argumentValues.observe(viewLifecycleOwner, it)
                    }
                }
            }
        }

        commandsModel.commandsWithArgs.observe(viewLifecycleOwner, commandObserver)

        val activeModuleObserver = Observer<ModuleOfOrg> { newModule ->
            activeModule = newModule
        }

        commandsModel.getActiveModule().observe(viewLifecycleOwner, activeModuleObserver)

        val resultsObserver = Observer<Map<String, ExecutionResult>?> { newResults ->
            if (newResults != null) {
                for ((k, v) in newResults) {
                    adapter.currentList.find { com -> com.id == k }?.let {
                        it.result = v
                        adapter.notifyItemChanged(adapter.currentList.indexOf(it))
                    }
                }
            }
        }

        commandsModel.executionResults.observe(viewLifecycleOwner, resultsObserver)

        val suggestionsObserver = Observer<Map<Pair<String, String>, List<ValueSuggestion>>?> { newSuggestions ->
            if (newSuggestions != null) {
                for ((k, v) in newSuggestions) {
                    adapter.currentList.find { com -> com.id == k.first }?.let {
                        it.arguments?.let { args ->
                            args.find { arg -> arg.id == k.second }?.let { arg ->
                                if (!Argument.areSuggestionsTheSame(arg.suggestions, v)) {
                                    arg.suggestions = v
                                    activity?.runOnUiThread {
                                        adapter.notifyItemChanged(adapter.currentList.indexOf(it))
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        commandsModel.suggestionsResults.observe(viewLifecycleOwner, suggestionsObserver)

        commandsModel.requestCommands()

        requireActivity().onBackPressedDispatcher.addCallback(viewLifecycleOwner,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    (activity as MainActivity).setActiveModule(null)
                }
            })

        return view
    }

    /**
     * Binds a view of the [RecyclerView] with an [Command] of [CommandListAdapter],
     * sets the UI up according to the item's content.
     */
    class CommandViewHolder private constructor(itemView: View) :
        ViewHolder(itemView) {

        private val nameView: TextView = itemView.findViewById(R.id.commandTitle)
        private val helpView: TextView = itemView.findViewById(R.id.commandHelp)
        private val resultView: TextView = itemView.findViewById(R.id.commandResult)
        private val argsLayout: LinearLayout = itemView.findViewById(R.id.argumentContainer)
        private val attachmentsLayout: LinearLayout = itemView.findViewById(R.id.resultAttachmentContainer)
        private val executeButton: Button = itemView.findViewById(R.id.executeCommand)

        private val bitmapAttachments: MutableList<Pair<Bitmap, ImageView>> = mutableListOf()

        /**
         * Binds the item data to the view, sets up the UI accordingly.
         * Since a [Command] may have various number of arguments, the layout of the
         * arguments should be creates during this operation, not on creation of the view.
         * TODO: inflating the additional layouts in this function sometimes blocks the UI
         * TODO: for too long. Need to think of how to redesign this.
         */
        fun bind(name: String?, help: String?, arguments: List<Argument>?, result: ExecutionResult?) {
            nameView.text = name
            helpView.text = help

            inflateResult(result)

            executeButton.setOnClickListener {
                bindingAdapter?.let {
                    val argValues = mutableListOf<String>()

                    arguments?.let {
                        for (i in 0 until argsLayout.children.count()) {
                            val argView = argsLayout.children.elementAt(i)
                            val inputLayout = argView.findViewById<FrameLayout>(R.id.argumentInputLayout)
                            val value = Scanner.getScannerByType(arguments[i].scannerType).getTextValue(inputLayout)
                            argValues.add(value)
                        }
                    }

                    (it as CommandListAdapter).onExecute(absoluteAdapterPosition, argValues)
                }
            }

            if (arguments != null) {
                inflateArguments(arguments)
            }
        }

        /**
         * Shown an execution [result] for a correpodning command's view by inflating
         * a specific layout and putting the result there. This includes the text response
         * from the server, but also may include attachments like pictures.
         * If a result picture was downloaded, then the user may save it to the local storage
         * (see [saveBitmap]).
         */
        private fun inflateResult(result: ExecutionResult?) {
            attachmentsLayout.removeAllViews()
            for (attachment in bitmapAttachments) {
                attachment.first.recycle()
            }
            bitmapAttachments.clear()

            if (result?.commandResult != null) {
                result.commandResult?.let {
                    resultView.text = it.resultText

                    bindingAdapter?.let { adapter ->
                        for (attachment in it.attachments) {
                            if (attachment.mimeType == Utils.Companion.SupportedMimeTypes.MIME_BASE64.mimeName) {
                                val attachmentView = ImageView((adapter as CommandListAdapter).fragment.activity)
                                attachmentView.layoutParams = LinearLayout.LayoutParams(
                                    LinearLayout.LayoutParams.MATCH_PARENT,
                                    LinearLayout.LayoutParams.WRAP_CONTENT
                                )
                                attachmentsLayout.addView(attachmentView)

                                val imageAsBytes: ByteArray =
                                    Base64.decode(attachment.attachmentObject.toString().split(",")[1],
                                        Base64.DEFAULT)
                                val bitmap = BitmapFactory.decodeByteArray(imageAsBytes, 0, imageAsBytes.size)
                                attachmentView.setImageBitmap(bitmap)

                                attachmentView.setOnLongClickListener {
                                    val bitmapToSave = bitmapAttachments.find {
                                            pair -> pair.second == attachmentView }?.first
                                    saveBitmap(bitmapToSave)
                                    return@setOnLongClickListener true
                                }

                                bitmapAttachments.add(Pair(bitmap, attachmentView))
                            }
                        }
                    }
                }
                resultView.visibility = View.VISIBLE
            } else {
                resultView.visibility = View.GONE
            }
        }

        /**
         * Tries to save the selected bitmap received from the Bot's server to the local storage.
         * This requires some permissions check, so if the user denies it, nothing will happen.
         * If saving was successful, then briefly shows the path in the local storage where
         * the file was saved.
         */
        private fun saveBitmap(bitmapToSave: Bitmap?) {
            bitmapToSave?.let {
                bindingAdapter?.let { adapter ->
                    (adapter as CommandListAdapter).fragment.activity?.let { act ->
                        (act as MainActivity).checkPermissions(Manifest.permission.WRITE_EXTERNAL_STORAGE) {
                            val path = Utils.saveDownloadedBitmap(it, act.application)
                            if (path != null) {
                                Toast.makeText(act,
                                    act.getString(R.string.downloaded_image_saved, path),
                                    Toast.LENGTH_LONG).show()
                            } else {
                                Toast.makeText(act,
                                    act.getString(R.string.downloaded_image_not_saved),
                                    Toast.LENGTH_LONG).show()
                            }
                        }
                    }
                }
            }
        }

        /**
         * Shows the arguments of the command item by inflating a [LinearLayout] inside the
         * command view. Also adds change listeners to the input views, so the app
         * can save the values inputted by the auditor and restore them later.
         */
        private fun inflateArguments(arguments: List<Argument>) {
            bindingAdapter?.let {
                argsLayout.removeAllViews()
                for (arg in arguments) {
                    val fragment = (it as CommandListAdapter).fragment
                    val argView: View = LayoutInflater.from(fragment.activity)
                        .inflate(R.layout.list_item_argument, argsLayout, false)
                    argView.layoutParams = ViewGroup.LayoutParams(MATCH_PARENT, WRAP_CONTENT)
                    argsLayout.addView(argView)

                    val argNameView = argView.findViewById<TextView>(R.id.argumentName)
                    argNameView.text = arg.name
                    val argHelpView = argView.findViewById<TextView>(R.id.argumentHelp)
                    argHelpView.text = arg.help

                    if (arg.lastValue == null) {
                        arg.lastValue = ArgumentValue(arg.source, arg.accountId, arg.orgId, arg.moduleId,
                            arg.commandId, arg.id)
                    }

                    arg.suggestionsCommand?.let { suggestionsCommand ->
                        fragment.activeModule?.let { module ->
                            if (arg.suggestions.isEmpty()) {
                                fragment.commandsModel.getSuggestions(
                                    module.account.token!!, module.org, arg, suggestionsCommand, mapOf())
                            }
                        }
                    }

                    val argInputLayout = argView.findViewById<FrameLayout>(R.id.argumentInputLayout)

                    Scanner.getScannerByType(arg.scannerType).addArgumentInput(fragment, argInputLayout, arg)
                }
            }
        }

        companion object {
            /**
             * A factory function to create a view holder based on an inflated view of the [RecyclerView]
             */
            fun create(parent: ViewGroup): CommandViewHolder {
                val view: View = LayoutInflater.from(parent.context)
                    .inflate(R.layout.list_item_command, parent, false)
                val commandViewHolder = CommandViewHolder(view)
                commandViewHolder.nameView.paintFlags = Paint.UNDERLINE_TEXT_FLAG
                return commandViewHolder
            }
        }
    }

    /**
     * An adapter for [RecyclerView] which binds [Command] entities with the UI.
     */
    class CommandListAdapter(_fragment: CommandsFragment, diffCallback: DiffUtil.ItemCallback<Command>) :
        ListAdapter<Command, CommandViewHolder?>(diffCallback) {

        val fragment = _fragment

        /**
         * Creates a view holder along with the view itself, by a request from the system.
         */
        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CommandViewHolder {
            return CommandViewHolder.create(parent)
        }

        /**
         * Binds a data item with the view according to a request from the system.
         */
        override fun onBindViewHolder(holder: CommandViewHolder, position: Int) {
            val current: Command? = getItem(position)
            current?.let {
                holder.bind(it.name, it.help, it.arguments, it.result)
            }
        }

        /**
         * An util class for the adapter which allows to check if the item identifiers are the same
         * and if the content of the items (besides their identifiers) are the same.
         * Here we just rely on the corresponding functions in the data classes themselves,
         * as we use those functions for other purposes too.
         */
        internal class CommandDiff : DiffUtil.ItemCallback<Command>() {
            /**
             * Checks if the item identifiers are the same. Relies on the corresponding function
             * in the data class itself.
             */
            override fun areItemsTheSame(
                oldItem: Command,
                newItem: Command
            ): Boolean {
                return Command.areItemsTheSame(oldItem, newItem)
            }

            /**
             * Checks if the item contents are the same (besides the identifiers).
             * Relies on the corresponding function in the data class itself.
             */
            override fun areContentsTheSame(
                oldItem: Command,
                newItem: Command
            ): Boolean {
                return Command.areContentsTheSame(oldItem, newItem)
            }
        }

        /**
         * Handles a click the execution button of one of the [RecyclerView] views.
         * Launches a command execution on the Bot's server based on the inputted arguments.
         */
        fun onExecute(position: Int, argValues: List<String>) {
            getItem(position)?.let { command ->
                fragment.activeModule?.let { module ->
                    val argsMap = mutableMapOf<String, String>()
                    command.arguments?.let { args ->
                        for (i in args.indices) {
                            argsMap[args[i].id] = argValues[i]
                        }
                    }
                    fragment.commandsModel.executeCommand(
                        module.account.token!!, module.account.source, module.org.id,
                        command.id, argsMap)
                }
            }
        }
    }
}