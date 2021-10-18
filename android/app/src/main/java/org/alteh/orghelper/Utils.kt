/*
 * Copyright (c) 2021 Alteh Union (alteh.union@gmail.com)
 *
 * Licensed under the MIT License (see the root LICENSE file for details)
 */

package org.alteh.orghelper

import android.app.Application
import android.content.ContentValues
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.annotation.RequiresApi
import java.io.File
import java.io.FileOutputStream
import java.io.OutputStream

class Utils {
    companion object {
        /**
         * An enum of supported attachment defined by [mimeName] types which can be either
         * sent or received to/from servers. Can contain custom types if both the app and the server
         * are agreed on how to handle them.
         */
        enum class SupportedMimeTypes(val mimeName: String) {
            MIME_BASE64("image/base64")
        }

        /**
         * A helper extension function which executes the given [block] only if the instance belongs
         * a subclass/implementor of the [T] type.
         */
        inline fun <reified T> Any?.tryCast(block: T.() -> Unit) {
            if (this is T) {
                block()
            }
        }

        /**
         * Returns a string which has only one difference comparing to the given [sourceString] -
         * the first letter is capitalized. This can be used for presenting some strings in UI, which
         * were received the places (like an URL string) where they were forcefully lowered.
         */
        fun capitalizeFirstLetter(sourceString: String): String {
            if (sourceString.length == 0) {
                return sourceString
            }
            return sourceString[0].uppercaseChar() + sourceString.substring(1)
        }

        /**
         * Saves a [bitmap] to the pictures media folder of the device, depending on the current
         * Android version.
         */
        fun saveDownloadedBitmap(bitmap: Bitmap, appContext: Application): String? {
            return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                saveImageInQ(bitmap, appContext)
            } else {
                saveImageInLegacy(bitmap)
            }
        }

        /**
         * Saves a [bitmap] as PNG using the [appContext] and [MediaStore] to the local storage,
         * the pictures folder. Can be used only on Android versions Q and later.
         */
        @RequiresApi(Build.VERSION_CODES.Q)
        private fun saveImageInQ(bitmap: Bitmap, appContext: Application): String {
            val filename = getDownloadedImageFileName()
            var fos: OutputStream?
            var imageUri: Uri?
            val contentValues = ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, filename)
                put(MediaStore.MediaColumns.MIME_TYPE, "image/png")
                put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_PICTURES)
                put(MediaStore.Video.Media.IS_PENDING, 1)
            }

            val contentResolver = appContext.contentResolver

            contentResolver.also { resolver ->
                imageUri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)
                fos = imageUri?.let {
                    resolver.openOutputStream(it)
                }

                fos?.use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }

                imageUri?.let {
                    contentValues.clear()
                    contentValues.put(MediaStore.Video.Media.IS_PENDING, 0)
                    contentResolver.update(it, contentValues, null, null)
                }
            }

            return imageUri.toString()
        }

        /**
         * Saves a [bitmap] as PNG on Android versions prior to Q. Just saves it to the pictures folder
         * plainly.
         */
        private fun saveImageInLegacy(bitmap: Bitmap): String? {
            val filename = getDownloadedImageFileName()
            val imagesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES)
            val image = File(imagesDir, filename)
            val fos = FileOutputStream(image)

            fos.use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }

            return image.absolutePath
        }

        /**
         * Makes and return a file name for the png image downloaded by the server
         * by applying the configured application name and the current timestamp.
         */
        private fun getDownloadedImageFileName(): String {
            return "${BuildConfig.APP_NAME_UNTRANSLATED}_IMG_${System.currentTimeMillis()}.png"
        }
    }
}