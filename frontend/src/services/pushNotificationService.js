import API from "./api";


function urlBase64ToUint8Array(
  base64String
) {

  const padding =
    "=".repeat(
      (4 -
        (base64String.length % 4))
      % 4
    );

  const base64 =
    (
      base64String
      + padding
    )
      .replace(
        /-/g,
        "+"
      )
      .replace(
        /_/g,
        "/"
      );


  const rawData =
    window.atob(
      base64
    );


  return Uint8Array.from(
    [...rawData].map(
      (char) =>
        char.charCodeAt(0)
    )
  );

}


export async function registerPushNotifications() {

  if (
    !(
      "serviceWorker"
      in navigator
    )
  ) {

    return false;

  }


  if (
    !(
      "PushManager"
      in window
    )
  ) {

    return false;

  }


  try {

    const registration =
      await navigator.serviceWorker.register(
        "/push-sw.js"
      );


    const response =
      await API.get(
        "/notifications/push/vapid-public-key"
      );


    const publicKey =
      response.data.public_key;


    if (!publicKey) {

      return false;

    }


    let permission =
      Notification.permission;


    if (
      permission
      === "default"
    ) {

      permission =
        await Notification.requestPermission();

    }


    if (
      permission
      !== "granted"
    ) {

      return false;

    }


    let subscription =
      await registration.pushManager.getSubscription();


    if (!subscription) {

      subscription =
        await registration.pushManager.subscribe(
          {
            userVisibleOnly:
              true,

            applicationServerKey:
              urlBase64ToUint8Array(
                publicKey
              ),
          }
        );

    }


    const subscriptionJson =
      subscription.toJSON();


    await API.post(
      "/notifications/push/subscribe",
      {
        endpoint:
          subscriptionJson.endpoint,

        p256dh:
          subscriptionJson.keys.p256dh,

        auth:
          subscriptionJson.keys.auth,
      }
    );


    return true;

  } catch (error) {

    console.error(
      "Push notification registration failed:",
      error
    );

    return false;

  }

}