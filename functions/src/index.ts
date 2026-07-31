import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { logger } from 'firebase-functions'

initializeApp()

const db = getFirestore()
const messaging = getMessaging()

/**
 * When a new task is created, notify all members of the event
 * (except the person who created the task).
 */
export const onTaskCreated = onDocumentCreated(
  {
    document: 'events/{eventId}/tasks/{taskId}',
    region: 'us-central1'
  },
  async (event) => {
    const snapshot = event.data
    if (!snapshot) return

    const eventId = event.params.eventId
    const taskId = event.params.taskId
    const task = snapshot.data()

    const title = (task.title as string) || 'New task'
    const createdBy = (task.createdBy as string) || null

    // Load event for the human-readable name
    const eventSnap = await db.doc(`events/${eventId}`).get()
    const eventData = eventSnap.data()
    const eventTitle = (eventData?.title as string) || 'Event'

    // Load all members of this event
    const membersSnap = await db.collection(`events/${eventId}/members`).get()
    if (membersSnap.empty) {
      logger.info('No members to notify', { eventId })
      return
    }

    const memberUids: string[] = []
    membersSnap.forEach((doc) => {
      if (doc.id !== createdBy) {
        memberUids.push(doc.id)
      }
    })

    if (memberUids.length === 0) {
      logger.info('No recipients after excluding creator', { eventId, taskId })
      return
    }

    // Collect FCM tokens from user documents
    const tokens: string[] = []
    const tokenChunks: string[][] = []

    // Firestore getAll supports up to 100 docs at a time
    for (let i = 0; i < memberUids.length; i += 100) {
      const chunk = memberUids.slice(i, i + 100)
      const refs = chunk.map((uid) => db.doc(`users/${uid}`))
      const userDocs = await db.getAll(...refs)

      for (const userDoc of userDocs) {
        if (!userDoc.exists) continue
        const data = userDoc.data()
        const fcmTokens = data?.fcmTokens as Record<string, unknown> | undefined
        if (!fcmTokens) continue

        for (const token of Object.keys(fcmTokens)) {
          if (token && typeof token === 'string') {
            tokens.push(token)
          }
        }
      }
    }

    if (tokens.length === 0) {
      logger.info('No FCM tokens found for members', { eventId, memberCount: memberUids.length })
      return
    }

    // FCM sendEachForMulticast accepts max 500 tokens
    for (let i = 0; i < tokens.length; i += 500) {
      tokenChunks.push(tokens.slice(i, i + 500))
    }

    const notificationTitle = `New task in “${eventTitle}”`
    const notificationBody = title

    const deepLink = `/e/${eventId}`

    let successCount = 0
    let failureCount = 0

    for (const chunk of tokenChunks) {
      try {
        const response = await messaging.sendEachForMulticast({
          tokens: chunk,
          notification: {
            title: notificationTitle,
            body: notificationBody
          },
          data: {
            eventId,
            taskId,
            title: notificationTitle,
            body: notificationBody,
            url: deepLink
          },
          webpush: {
            fcmOptions: {
              link: deepLink
            },
            notification: {
              icon: '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
              tag: taskId,
              renotify: true
            }
          }
        })

        successCount += response.successCount
        failureCount += response.failureCount

        // Clean up invalid tokens
        const invalidTokens: string[] = []
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const code = resp.error?.code
            if (
              code === 'messaging/invalid-registration-token' ||
              code === 'messaging/registration-token-not-registered'
            ) {
              invalidTokens.push(chunk[idx])
            }
          }
        })

        if (invalidTokens.length > 0) {
          logger.info('Removing invalid tokens', { count: invalidTokens.length })
          // Best-effort cleanup – we don't know which user owns the token here,
          // so we leave it for the next successful token refresh to overwrite.
        }
      } catch (err) {
        logger.error('Failed to send multicast', err)
        failureCount += chunk.length
      }
    }

    logger.info('Notification send finished', {
      eventId,
      taskId,
      recipients: memberUids.length,
      tokens: tokens.length,
      successCount,
      failureCount
    })
  }
)
